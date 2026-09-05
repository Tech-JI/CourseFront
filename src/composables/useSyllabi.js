import { getCookie } from "../utils/cookies";
import { apiFetch } from "../utils/api";

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_TRIES = 30; // ~2 minutes of waiting on analysis

const SETTLED_STATUSES = new Set(["analyzed", "failed"]);

function extractError(response) {
  // Serializer errors arrive as {field: [messages]}; API errors as {detail}.
  return response.json().catch(() => null);
}

export function useSyllabi() {
  const fetchSyllabi = async (courseId) => {
    if (!courseId) return [];
    const response = await apiFetch(`/api/courses/${courseId}/syllabi/`);
    if (!response.ok) {
      const errorData = await extractError(response);
      throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const fetchInstructors = async (courseId) => {
    if (!courseId) return [];
    const response = await apiFetch(`/api/courses/${courseId}/instructors`);
    if (!response.ok) {
      const errorData = await extractError(response);
      throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.instructors || [];
  };

  const uploadSyllabus = async (courseId, { file, instructorId }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("instructor", instructorId);
    const response = await apiFetch(`/api/courses/${courseId}/syllabi/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCookie("csrftoken") }, // let fetch set Content-Type
      body: formData,
    });
    if (!response.ok) {
      const errorData = await extractError(response);
      const err = new Error(errorData?.detail || "Failed to upload syllabus");
      err.raw = errorData;
      throw err;
    }
    return await response.json();
  };

  const downloadSyllabus = async (syllabusId) => {
    const response = await apiFetch(`/api/syllabi/${syllabusId}/download/`);
    if (!response.ok) {
      const errorData = await extractError(response);
      const err = new Error(errorData?.detail || "Failed to download syllabus");
      err.raw = errorData;
      throw err;
    }
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const filename = match ? match[1] : `syllabus-${syllabusId}.pdf`;
    return { blob: await response.blob(), filename };
  };

  const updateSyllabus = async (syllabusId, patch) => {
    const response = await apiFetch(`/api/syllabi/${syllabusId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const errorData = await extractError(response);
      const err = new Error(errorData?.detail || "Failed to update syllabus");
      err.raw = errorData;
      throw err;
    }
    return await response.json();
  };

  const stillProcessing = (syllabi) =>
    syllabi.some((s) => !SETTLED_STATUSES.has(s.status));

  const pollUntilSettled = async (courseId, onUpdate) => {
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      const syllabi = await fetchSyllabi(courseId);
      onUpdate?.(syllabi);
      if (!stillProcessing(syllabi)) return syllabi;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return null;
  };

  return {
    fetchSyllabi,
    fetchInstructors,
    uploadSyllabus,
    downloadSyllabus,
    updateSyllabus,
    pollUntilSettled,
  };
}

export default { useSyllabi };
