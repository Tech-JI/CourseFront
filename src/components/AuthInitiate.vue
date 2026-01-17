<template>
  <div class="space-y-6">
    <!-- Turnstile Widget State -->
    <div v-if="!otpState" class="flex justify-center">
      <Turnstile
        ref="turnstileRef"
        :sitekey="turnstileSiteKey"
        @verify="onTurnstileVerified"
        @expire="onTurnstileExpired"
        @error="onTurnstileError"
      />
    </div>

    <!-- OTP Display State -->
    <div v-else class="text-center">
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Your One-Time Password
      </h3>
      <p class="text-sm text-gray-500 mb-4">
        Copy this code and paste it in the university questionnaire platform
      </p>

      <div
        class="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-4 inline-block"
      >
        <div class="text-3xl font-mono font-bold tracking-widest text-gray-900">
          {{ otpState.otp }}
        </div>
      </div>

      <p class="text-xs text-gray-500 mb-6">
        This code expires in {{ otpExpiryMinutes }} minutes
      </p>

      <button
        :disabled="isRedirecting"
        class="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="copyOtpAndRedirect"
      >
        <span v-if="!isRedirecting">{{ copyButtonText }}</span>
        <span v-else class="flex items-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          Redirecting...
        </span>
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationTriangleIcon
          class="h-5 w-5 text-red-400"
          aria-hidden="true"
        />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-1 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-4">
      <div class="inline-flex items-center text-sm text-gray-600">
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600"
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
        Initiating authentication...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { initiateAuth, getOtpState } from "../utils/auth";
import Turnstile from "./Turnstile.vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  action: {
    type: String,
    required: true,
    validator: (value) => ["signup", "login", "reset_password"].includes(value),
  },
});

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const turnstileRef = ref(null);
const otpState = ref(null);
const redirectUrl = ref(null);
const error = ref(null);
const copyButtonText = ref("Copy Code and Proceed");
const isRedirecting = ref(false);
const isLoading = ref(false);

onMounted(() => {
  const existingOtp = getOtpState();
  if (existingOtp) {
    otpState.value = existingOtp;
  }
});

const onTurnstileVerified = async (token) => {
  error.value = null;
  isLoading.value = true;

  try {
    const data = await initiateAuth(props.action, token);
    otpState.value = getOtpState();
    redirectUrl.value = data.redirectUrl;
  } catch (e) {
    error.value = e.message;
    turnstileRef.value?.reset();
  } finally {
    isLoading.value = false;
  }
};

const onTurnstileExpired = () => {
  error.value = "Security verification expired. Please try again.";
  turnstileRef.value?.reset();
};

const onTurnstileError = () => {
  error.value = "Security verification failed. Please refresh and try again.";
};

const copyOtpAndRedirect = async () => {
  if (!otpState.value) return;

  try {
    await navigator.clipboard.writeText(otpState.value.otp);
    copyButtonText.value = "Copied!";
    isRedirecting.value = true;

    setTimeout(() => {
      if (redirectUrl.value) {
        window.location.href = `${redirectUrl.value}?otp_hint=${otpState.value.otp}`;
      } else {
        error.value = "Redirect URL not found. Please try again.";
        isRedirecting.value = false;
        copyButtonText.value = "Copy Code and Proceed";
      }
    }, 1000);
  } catch {
    error.value = "Failed to copy code. Please copy it manually.";
    isRedirecting.value = false;
    copyButtonText.value = "Copy Code and Proceed";
  }
};

const otpExpiryMinutes = computed(() => {
  if (!otpState.value?.expires_at) return 0;
  const remaining = otpState.value.expires_at - Date.now();
  return Math.ceil(remaining / 1000 / 60);
});
</script>
