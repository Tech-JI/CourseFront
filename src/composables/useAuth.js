import { ref, onMounted, onUnmounted } from "vue";
import { apiFetch } from "../utils/api";
import { getCookie } from "../utils/cookies";
import {
  OTP_STORAGE_KEY,
  FLOW_STATE_STORAGE_KEY,
  clearAuthFlowState,
} from "../utils/auth";

// Default timeout
const DEFAULT_OTP_TIMEOUT_SECONDS = 120;
const DEFAULT_TEMP_TOKEN_TIMEOUT_SECONDS = 600;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getOtpTimeoutSeconds() {
  return parsePositiveInt(
    import.meta.env.VITE_AUTH_OTP_TIMEOUT,
    DEFAULT_OTP_TIMEOUT_SECONDS,
  );
}

function getTempTokenTimeoutSeconds() {
  return parsePositiveInt(
    import.meta.env.VITE_AUTH_TEMP_TOKEN_TIMEOUT,
    DEFAULT_TEMP_TOKEN_TIMEOUT_SECONDS,
  );
}

export function useAuth() {
  const isAuthenticated = ref(false);

  const checkAuthentication = async () => {
    try {
      const response = await apiFetch("/api/user/status/");
      if (response.ok) {
        const data = await response.json();
        isAuthenticated.value = !!data.isAuthenticated;
        return isAuthenticated.value;
      }
      isAuthenticated.value = false;
      return isAuthenticated.value;
    } catch (e) {
      console.error("useAuth: checkAuthentication error:", e);
      isAuthenticated.value = false;
      return false;
    }
  };

  const initiateAuth = async (action, turnstileToken) => {
    const response = await apiFetch("/api/auth/init/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        action,
        turnstile_token: turnstileToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to initiate auth flow.");
    }

    const data = await response.json();
    const now = Date.now();
    const otpExpiresAt = now + getOtpTimeoutSeconds() * 1000;
    const tempTokenExpiresAt = now + getTempTokenTimeoutSeconds() * 1000;

    localStorage.setItem(
      OTP_STORAGE_KEY,
      JSON.stringify({ otp: data.otp, expires_at: otpExpiresAt }),
    );
    localStorage.setItem(
      FLOW_STATE_STORAGE_KEY,
      JSON.stringify({ status: "pending", expires_at: tempTokenExpiresAt }),
    );

    return { otp: data.otp, redirectUrl: data.redirect_url };
  };

  const verifyCallback = async (action, account, answerId) => {
    const response = await apiFetch("/api/auth/verify/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        action,
        account,
        answer_id: answerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to verify authentication.");
    }

    const data = await response.json();
    localStorage.setItem(
      FLOW_STATE_STORAGE_KEY,
      JSON.stringify({
        status: "verified",
        action: data.action,
        expires_at: data.expires_at * 1000,
      }),
    );

    return data;
  };

  const setPassword = async (action, password) => {
    const url =
      action === "signup" ? "/api/auth/signup/" : "/api/auth/password/";
    const response = await apiFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to set password.");
    }

    clearAuthFlowState();
    return await response.json();
  };

  const loginWithPassword = async (account, password, turnstileToken) => {
    const response = await apiFetch("/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        account,
        password,
        turnstile_token: turnstileToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Login failed.");
    }
    return await response.json();
  };

  const logout = async () => {
    try {
      const response = await apiFetch("/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });
      if (response.ok) {
        isAuthenticated.value = false;
        notifyAuthStateChanged();
        return true;
      } else {
        console.error("useAuth: logout failed", response.status);
        return false;
      }
    } catch (e) {
      console.error("useAuth: logout error:", e);
      return false;
    }
  };

  const onAuthStateChanged = () => {
    // Re-check authentication when other parts of app signal change
    checkAuthentication();
  };

  const notifyAuthStateChanged = () => {
    window.dispatchEvent(new CustomEvent("auth-state-changed"));
  };

  onMounted(() => {
    checkAuthentication();
    window.addEventListener("auth-state-changed", onAuthStateChanged);
  });

  onUnmounted(() => {
    window.removeEventListener("auth-state-changed", onAuthStateChanged);
  });

  return {
    isAuthenticated,
    checkAuthentication,
    initiateAuth,
    verifyCallback,
    setPassword,
    loginWithPassword,
    logout,
    notifyAuthStateChanged,
  };
}

export default { useAuth };
