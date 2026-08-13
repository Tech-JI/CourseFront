// Lightweight API utilities used across components
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path, options = {}) {
  const fetchOptions = { ...options, credentials: "include" };
  return fetch(`${API_BASE_URL}${path}`, fetchOptions);
}

export default { apiFetch };
