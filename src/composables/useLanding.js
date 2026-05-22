import { ref } from "vue";
import { apiFetch } from "../utils/api";

export function useLanding() {
  const loading = ref(false);
  const error = ref(null);

  const fetchLanding = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiFetch("/api/landing/");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, fetchLanding };
}

export default { useLanding };
