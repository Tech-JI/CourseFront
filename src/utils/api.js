// Lightweight API utilities used across components
// checkAuthentication: returns a boolean indicating auth status
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path, options = {}) {
  options.credentials = "include";
  return fetch(`${API_BASE_URL}${path}`, options);
}

export async function checkAuthentication() {
  try {
    const response = await apiFetch("/api/user/status/");
    if (response.ok) {
      const data = await response.json();
      return !!data.isAuthenticated;
    }
    return false;
  } catch (e) {
    console.error("Error checking authentication:", e);
    return false;
  }
}

export default { apiFetch, checkAuthentication };
