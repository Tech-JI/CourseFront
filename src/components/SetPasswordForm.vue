<template>
  <div class="space-y-6">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Password Field -->
      <div>
        <label
          for="password"
          class="block text-sm font-medium leading-6 text-gray-900"
        >
          Password
        </label>
        <div class="mt-2">
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            :class="{
              'ring-red-500 focus:ring-red-500':
                passwordErrors.length > 0 && password,
            }"
            @input="validatePasswordInput"
          />
        </div>

        <!-- Password Strength Indicator -->
        <div v-if="password" class="mt-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium" :class="strengthColor">
              {{ strengthText }}
            </span>
            <span class="text-xs text-gray-500">
              {{ password.length }}/32 characters
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all duration-300"
              :class="strengthColor"
              :style="{ width: `${strengthPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Password Requirements -->
        <div v-if="password" class="mt-2 space-y-1">
          <p
            v-for="error in passwordErrors"
            :key="error"
            class="text-xs text-red-600"
          >
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Confirm Password Field -->
      <div>
        <label
          for="confirmPassword"
          class="block text-sm font-medium leading-6 text-gray-900"
        >
          Confirm Password
        </label>
        <div class="mt-2">
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            :class="{
              'ring-red-500 focus:ring-red-500':
                confirmPasswordErrors.length > 0 && confirmPassword,
            }"
            @input="validateConfirmPasswordInput"
          />
        </div>
        <div
          v-if="confirmPasswordErrors.length > 0 && confirmPassword"
          class="mt-2 space-y-1"
        >
          <p
            v-for="error in confirmPasswordErrors"
            :key="error"
            class="text-xs text-red-600"
          >
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="!isSubmitting">{{ submitButtonText }}</span>
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
            Processing...
          </span>
        </button>
      </div>
    </form>

    <!-- Error Display -->
    <div v-if="submitError" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationTriangleIcon
          class="h-5 w-5 text-red-400"
          aria-hidden="true"
        />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-1 text-sm text-red-700">{{ submitError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { setPassword } from "../utils/auth";
import {
  validatePassword,
  validatePasswordConfirmation,
  calculatePasswordStrength,
  getPasswordStrengthText,
  getPasswordStrengthColor,
  getPasswordStrengthPercentage,
} from "../utils/validation";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "../composables/useAuth";

const props = defineProps({
  action: {
    type: String,
    required: true,
    validator: (value) => ["signup", "reset_password"].includes(value),
  },
});

const router = useRouter();
const { notifyAuthStateChanged } = useAuth();

const password = ref("");
const confirmPassword = ref("");
const passwordErrors = ref([]);
const confirmPasswordErrors = ref([]);
const submitError = ref(null);
const isSubmitting = ref(false);

const passwordStrength = computed(() =>
  calculatePasswordStrength(password.value),
);
const strengthText = computed(() =>
  getPasswordStrengthText(passwordStrength.value),
);
const strengthColor = computed(() =>
  getPasswordStrengthColor(passwordStrength.value),
);
const strengthPercentage = computed(() =>
  getPasswordStrengthPercentage(passwordStrength.value),
);

const submitButtonText = computed(() => {
  return props.action === "signup" ? "Create Account" : "Reset Password";
});

const isFormValid = computed(() => {
  return (
    password.value &&
    confirmPassword.value &&
    passwordErrors.value.length === 0 &&
    confirmPasswordErrors.value.length === 0
  );
});

const validatePasswordInput = () => {
  const validation = validatePassword(password.value);
  passwordErrors.value = validation.errors;
  if (confirmPassword.value) {
    validateConfirmPasswordInput();
  }
};

const validateConfirmPasswordInput = () => {
  const validation = validatePasswordConfirmation(
    password.value,
    confirmPassword.value,
  );
  confirmPasswordErrors.value = validation.errors;
};

const handleSubmit = async () => {
  validatePasswordInput();
  validateConfirmPasswordInput();

  if (!isFormValid.value) {
    return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  try {
    await setPassword(props.action, password.value);
    notifyAuthStateChanged();
    router.push("/");
  } catch (e) {
    submitError.value = e.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
