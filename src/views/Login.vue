<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2
          class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900"
        >
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link
            to="/signup"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            create a new account
          </router-link>
        </p>
      </div>

      <div class="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              :class="[
                activeTab === 'password'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              ]"
              @click="activeTab = 'password'"
            >
              Password
            </button>
            <button
              :class="[
                activeTab === 'questionnaire'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
              ]"
              @click="activeTab = 'questionnaire'"
            >
              Questionnaire
            </button>
          </nav>
        </div>

        <!-- Password Login Form -->
        <form
          v-if="activeTab === 'password'"
          class="space-y-6"
          @submit.prevent="handlePasswordLogin"
        >
          <div>
            <label
              for="account"
              class="block text-sm font-medium leading-6 text-gray-900"
            >
              Account
            </label>
            <div class="mt-2">
              <input
                id="account"
                v-model="account"
                type="text"
                autocomplete="username"
                required
                placeholder="Same as your JAccount"
                class="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <PasswordInput
              id="password"
              v-model="passwordInput"
              label="Password"
              autocomplete="current-password"
              required
            />
          </div>

          <div class="flex items-center justify-end">
            <div class="text-sm">
              <router-link
                to="/reset"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </router-link>
            </div>
          </div>

          <div>
            <Turnstile
              v-if="showPasswordTurnstile"
              ref="passwordTurnstileRef"
              :sitekey="turnstileSiteKey"
              @verify="onPasswordTurnstileVerified"
              @expire="onPasswordTurnstileExpired"
              @error="onPasswordTurnstileError"
              class="flex justify-center"
            />
          </div>

          <div>
            <button
              type="submit"
              :disabled="!passwordTurnstileToken || isPasswordLoading"
              class="w-full flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="!isPasswordLoading">Sign in</span>
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
                Signing in...
              </span>
            </button>
          </div>

          <div v-if="passwordError" class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <ExclamationTriangleIcon
                class="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <div class="mt-1 text-sm text-red-700">{{ passwordError }}</div>
              </div>
            </div>
          </div>
        </form>

        <!-- Questionnaire Login -->
        <div v-else-if="activeTab === 'questionnaire'">
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              Sign in using your university credentials via the questionnaire
              system.
            </p>
          </div>
          <AuthInitiate action="login" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { loginWithPassword, clearAuthFlowState } from "../utils/auth";
import AuthInitiate from "../components/AuthInitiate.vue";
import Turnstile from "../components/Turnstile.vue";
import PasswordInput from "../components/PasswordInput.vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { isAuthenticated, checkAuthentication, notifyAuthStateChanged } =
  useAuth();

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const activeTab = ref("password");
const account = ref("");
const passwordInput = ref("");
const passwordError = ref(null);
const isPasswordLoading = ref(false);
const showPasswordTurnstile = ref(true);
const passwordTurnstileToken = ref(null);
const passwordTurnstileRef = ref(null);

onMounted(async () => {
  await checkAuthentication();

  if (isAuthenticated.value) {
    router.push("/");
    return;
  }

  clearAuthFlowState();
});

const onPasswordTurnstileVerified = (token) => {
  passwordTurnstileToken.value = token;
};

const onPasswordTurnstileExpired = () => {
  passwordTurnstileToken.value = null;
  passwordError.value = "Security verification expired. Please try again.";
};

const onPasswordTurnstileError = () => {
  passwordTurnstileToken.value = null;
  passwordError.value =
    "Security verification failed. Please refresh and try again.";
};

const handlePasswordLogin = async () => {
  if (!passwordTurnstileToken.value) {
    passwordError.value = "Please complete the security verification.";
    return;
  }

  passwordError.value = null;
  isPasswordLoading.value = true;

  try {
    await loginWithPassword(
      account.value,
      passwordInput.value,
      passwordTurnstileToken.value,
    );
    notifyAuthStateChanged();
    router.push("/");
  } catch (e) {
    passwordError.value = e.message;
    passwordTurnstileRef.value?.reset();
    passwordTurnstileToken.value = null;
  } finally {
    isPasswordLoading.value = false;
  }
};
</script>
