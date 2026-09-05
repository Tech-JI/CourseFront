<template>
  <div class="mb-8">
    <div class="bg-white overflow-hidden shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">Syllabi</h3>
            <p class="mt-1 text-sm text-gray-500">
              Uploaded by students, checked against the course automatically.
              Downloading requires login.
            </p>
          </div>
          <button
            v-if="isAuthenticated"
            class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            @click="onUploadClick"
          >
            <ArrowUpTrayIcon class="h-4 w-4 mr-1" />
            Upload
          </button>
          <button
            v-else
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            @click="router.push('/login')"
          >
            Login to upload or download
          </button>
        </div>

        <div
          v-if="loading && syllabi.length === 0"
          class="py-8 text-center text-sm text-gray-500"
        >
          Loading syllabi…
        </div>
        <div
          v-else-if="!loading && syllabi.length === 0"
          class="py-8 text-center text-sm text-gray-500"
        >
          No syllabi uploaded yet.
        </div>

        <div
          v-for="group in groupedSyllabi"
          :key="group.instructor.id"
          class="border-b border-gray-100 last:border-b-0"
        >
          <h4 class="text-sm font-semibold text-gray-900 pt-4 pb-2">
            {{ group.instructor.name }}
            <span class="ml-2 text-xs font-normal text-gray-500">
              {{ group.syllabi.length }}
              {{ group.syllabi.length === 1 ? "version" : "versions" }}
            </span>
          </h4>

          <div
            v-for="syllabus in group.syllabi"
            :key="syllabus.id"
            class="rounded-lg ring-1 ring-gray-200 bg-gray-50/50 mb-4"
          >
            <div class="px-4 py-4">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="syllabus.is_primary"
                  class="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                >
                  Primary
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="statusStyle(syllabus.status).cls"
                >
                  {{ statusStyle(syllabus.status).label }}
                </span>
                <span class="text-sm text-gray-600">
                  {{ syllabus.file.original_filename }}
                  <span class="text-gray-400">
                    ({{ formatBytes(syllabus.file.size) }})
                  </span>
                </span>
                <span
                  v-if="syllabus.uploaded_by"
                  class="text-xs text-gray-400 ml-auto"
                >
                  by {{ syllabus.uploaded_by }} ·
                  {{ formatDate(syllabus.created_at) }}
                </span>
              </div>

              <div
                v-if="syllabus.error_message"
                class="mt-2 text-sm text-red-600"
              >
                {{ syllabus.error_message }}
              </div>

              <div
                v-if="syllabus.status === 'analyzed' && syllabus.verdict"
                class="mt-2 flex flex-wrap items-center gap-2 text-xs"
              >
                <span
                  v-if="syllabus.verdict.match_score !== undefined"
                  class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700"
                >
                  Match score: {{ syllabus.verdict.match_score }}/100
                </span>
                <span
                  v-if="syllabus.verdict.matches_course_content"
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800"
                >
                  Matches course
                </span>
                <span
                  v-if="!syllabus.verdict.matches_course_content"
                  class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800"
                >
                  Does not match course content
                </span>
                <span
                  v-if="syllabus.verdict.is_legitimate"
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800"
                >
                  Looks legitimate
                </span>
                <span
                  v-if="!syllabus.verdict.is_legitimate"
                  class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800"
                >
                  Suspicious content
                </span>
                <template v-if="syllabus.verdict.flags?.length">
                  <span
                    v-for="flag in syllabus.verdict.flags"
                    :key="flag"
                    class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 font-medium text-yellow-800"
                  >
                    {{ flag }}
                  </span>
                </template>
              </div>

              <p
                v-if="syllabus.comparison?.notes"
                class="mt-2 text-xs text-gray-500"
              >
                Comparison: {{ syllabus.comparison.notes }}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button
                  v-if="syllabus.status === 'analyzed' && syllabus.summary_md"
                  class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  @click="toggleSummary(syllabus.id)"
                >
                  <ChevronDownIcon
                    :class="[
                      'h-3 w-3 mr-1 transition-transform',
                      expandedIds.has(syllabus.id) && 'rotate-180',
                    ]"
                  />
                  {{
                    expandedIds.has(syllabus.id)
                      ? "Hide summary"
                      : "View AI summary"
                  }}
                </button>
                <button
                  class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  @click="download(syllabus)"
                >
                  <ArrowDownTrayIcon class="h-3 w-3 mr-1" />
                  Download
                </button>
                <button
                  v-if="isStaff"
                  class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50"
                  @click="startEdit(syllabus)"
                >
                  <PencilIcon class="h-3 w-3 mr-1" />
                  Edit
                </button>
              </div>

              <div
                v-if="syllabus.status === 'analyzed' && syllabus.summary_md"
                class="mt-3"
              >
                <MdPreview
                  v-show="expandedIds.has(syllabus.id)"
                  :model-value="syllabus.summary_md"
                  :sanitize="sanitize"
                  preview-theme="github"
                  class="text-sm text-gray-700 markdown-content border-t border-gray-200 pt-3"
                />
              </div>

              <div
                v-if="editingId === syllabus.id"
                class="mt-3 rounded-md bg-white ring-1 ring-indigo-200 p-3 space-y-3"
              >
                <div>
                  <label class="block text-xs font-medium text-gray-700">
                    AI summary (markdown)
                  </label>
                  <textarea
                    v-model="editForm.summary_md"
                    rows="6"
                    class="mt-1 block w-full rounded-md border-0 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700">
                    Verdict (JSON)
                  </label>
                  <textarea
                    v-model="editForm.verdictText"
                    rows="4"
                    spellcheck="false"
                    class="mt-1 block w-full rounded-md border-0 font-mono text-xs text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  ></textarea>
                </div>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    v-model="editForm.is_primary"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  Mark as primary version
                </label>
                <p
                  v-if="editError"
                  class="text-sm text-red-600"
                >
                  {{ editError }}
                </p>
                <div class="flex justify-end gap-2">
                  <button
                    class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    @click="cancelEdit"
                  >
                    Cancel
                  </button>
                  <button
                    class="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    :disabled="editBusy"
                    @click="saveEdit(syllabus)"
                  >
                    {{ editBusy ? "Saving…" : "Save" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UploadSyllabusModal
      :open="uploadOpen"
      :course-id="courseId"
      :course-code="courseCode"
      :instructors="instructors"
      @close="uploadOpen = false"
      @uploaded="onUploaded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  PencilIcon,
} from "@heroicons/vue/24/outline";
import { MdPreview } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { sanitize } from "../utils/sanitize";
import { useAuth } from "../composables/useAuth";
import { useSyllabi } from "../composables/useSyllabi";
import UploadSyllabusModal from "./UploadSyllabusModal.vue";

const props = defineProps({
  courseId: { type: [String, Number], required: true },
  courseCode: { type: String, default: "" },
  instructors: { type: Array, default: () => [] },
});

const router = useRouter();
const { isAuthenticated, isStaff } = useAuth();
const { fetchSyllabi, fetchInstructors, downloadSyllabus, updateSyllabus } =
  useSyllabi();

const syllabi = ref([]);
const loading = ref(true);
const expandedIds = ref(new Set());
const uploadOpen = ref(false);
const editingId = ref(null);
const editBusy = ref(false);
const editError = ref("");
const editForm = ref({
  summary_md: "",
  verdictText: "",
  is_primary: false,
});

const localInstructors = ref([]);

// Passed-in live instructors plus any that only appear on uploaded rows.
const instructors = computed(() => {
  const map = new Map();
  for (const instructor of props.instructors) {
    map.set(instructor.id, instructor);
  }
  for (const instructor of localInstructors.value) {
    map.set(instructor.id, instructor);
  }
  for (const syllabus of syllabi.value) {
    if (!map.has(syllabus.instructor.id)) {
      map.set(syllabus.instructor.id, syllabus.instructor);
    }
  }
  return [...map.values()];
});

const groupedSyllabi = computed(() => {
  const byInstructor = new Map();
  for (const instructor of instructors.value) {
    byInstructor.set(instructor.id, {
      instructor,
      syllabi: syllabi.value
        .filter((s) => s.instructor.id === instructor.id)
        .sort((a, b) => b.is_primary - a.is_primary || b.id - a.id),
    });
  }
  return [...byInstructor.values()];
});

const STATUS_STYLES = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-800" },
  analyzed: { label: "Analyzed", cls: "bg-green-100 text-green-800" },
  failed: { label: "Failed", cls: "bg-red-100 text-red-800" },
};
const statusStyle = (status) =>
  STATUS_STYLES[status] || { label: status, cls: "bg-gray-100 text-gray-800" };

const loadSyllabi = async () => {
  loading.value = true;
  try {
    syllabi.value = await fetchSyllabi(props.courseId);
  } catch (e) {
    console.error("SyllabusSection: failed to load syllabi:", e);
  } finally {
    loading.value = false;
  }
};

const ensureInstructors = async () => {
  if (props.instructors?.length) return;
  try {
    localInstructors.value = await fetchInstructors(props.courseId);
  } catch (e) {
    console.error("SyllabusSection: failed to load instructors:", e);
  }
};

const pollUntilSettled = async () => {
  for (let i = 0; i < 45; i++) {
    await loadSyllabi();
    const stillWorking = syllabi.value.some((s) =>
      ["pending", "processing"].includes(s.status),
    );
    if (!stillWorking) return;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
};

onMounted(async () => {
  await loadSyllabi();
  await ensureInstructors();
  if (syllabi.value.some((s) => ["pending", "processing"].includes(s.status))) {
    pollUntilSettled();
  }
});

const onUploaded = () => {
  uploadOpen.value = false;
  pollUntilSettled();
};

const onUploadClick = () => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  if (instructors.value.length === 0) {
    alert("No instructors are listed for this course yet.");
    return;
  }
  uploadOpen.value = true;
};

const toggleSummary = (id) => {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
};

const download = async (syllabus) => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  try {
    const { blob, filename } = await downloadSyllabus(syllabus.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`Failed to download: ${e.message}`);
  }
};

const startEdit = (syllabus) => {
  editingId.value = syllabus.id;
  editError.value = "";
  editForm.value = {
    summary_md: syllabus.summary_md ?? "",
    verdictText: syllabus.verdict ? JSON.stringify(syllabus.verdict, null, 2) : "",
    is_primary: syllabus.is_primary,
  };
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveEdit = async (syllabus) => {
  editError.value = "";
  let verdict = null;
  if (editForm.value.verdictText.trim()) {
    try {
      verdict = JSON.parse(editForm.value.verdictText);
    } catch (e) {
      editError.value = "Verdict must be valid JSON.";
      return;
    }
  }
  editBusy.value = true;
  try {
    const patch = {
      summary_md: editForm.value.summary_md,
      is_primary: editForm.value.is_primary,
    };
    if (verdict !== null) patch.verdict = verdict;
    const updated = await updateSyllabus(syllabus.id, patch);
    const index = syllabi.value.findIndex((s) => s.id === syllabus.id);
    if (index !== -1) syllabi.value[index] = updated;
    editingId.value = null;
  } catch (e) {
    editError.value = e.raw?.detail || e.message;
  } finally {
    editBusy.value = false;
  }
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch (e) {
    return "";
  }
};
</script>

<style scoped>
@import "../styles/MarkdownContent.css";
</style>
