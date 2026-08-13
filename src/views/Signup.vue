<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2
          class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900"
        >
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <router-link
            to="/login"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            sign in to your existing account
          </router-link>
        </p>
        <p class="mt-2 text-center text-sm text-gray-500">
          Note: Your username will be the same as your JAccount
        </p>
      </div>

      <div class="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <AuthInitiate v-if="!isVerified" action="signup" />
        <SetPasswordForm v-else action="signup" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getAuthFlowState, clearAuthFlowState } from "../utils/auth";
import AuthInitiate from "../components/AuthInitiate.vue";
import SetPasswordForm from "../components/SetPasswordForm.vue";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { isAuthenticated, checkAuthentication } = useAuth();
const isVerified = ref(false);

onMounted(async () => {
  await checkAuthentication();

  if (isAuthenticated.value) {
    router.push("/");
    return;
  }

  const flowState = getAuthFlowState();
  if (
    flowState &&
    flowState.status === "verified" &&
    flowState.action === "signup"
  ) {
    isVerified.value = true;
  } else {
    clearAuthFlowState();
  }
});
</script>
