<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full">
      <div class="text-center">
        <!-- Loading State -->
        <div v-if="isProcessing">
          <svg
            class="animate-spin mx-auto h-12 w-12 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 class="mt-6 text-xl font-semibold text-gray-900">
            Verifying your identity...
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Please wait while we confirm your submission
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex flex-col items-center">
            <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mb-4" />
            <h3 class="text-lg font-medium text-red-800 mb-2">
              Verification Failed
            </h3>
            <p class="text-sm text-red-700 mb-4">{{ error }}</p>
            <router-link
              :to="getRetryRoute()"
              class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Try Again
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { verifyCallback } from "../utils/auth";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
const router = useRouter();

const isProcessing = ref(true);
const error = ref(null);

onMounted(async () => {
  const { action, account, answer_id } = route.query;

  if (!action || !account || !answer_id) {
    error.value =
      "Missing required parameters. Please start the process again.";
    isProcessing.value = false;
    return;
  }

  try {
    const data = await verifyCallback(action, account, answer_id);

    if (data.is_logged_in) {
      router.push("/");
    } else {
      router.push(`/${action}`);
    }
  } catch (e) {
    error.value = e.message;
    isProcessing.value = false;
  }
});

const getRetryRoute = () => {
  const action = route.query.action;
  if (action === "signup") return "/signup";
  if (action === "login") return "/login";
  if (action === "reset_password") return "/reset";
  return "/";
};
</script>
