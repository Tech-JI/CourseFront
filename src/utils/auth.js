import { getCookie } from "./cookies";

const OTP_STORAGE_KEY = "auth_otp";
const FLOW_STATE_STORAGE_KEY = "auth_flow";

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

/**
 * Initiates the authentication flow.
 * @param {string} action - The authentication action (signup, login, reset_password).
 * @param {string} turnstileToken - The Cloudflare Turnstile token.
 * @returns {Promise<{otp: string, redirectUrl: string}>}
 */
export async function initiateAuth(action, turnstileToken) {
  const response = await fetch("/api/auth/init/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({
      action: action,
      turnstile_token: turnstileToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to initiate auth flow.");
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
}

/**
 * Verifies the authentication callback.
 * @param {string} action - The authentication action.
 * @param {string} account - The user's account identifier.
 * @param {string} answerId - The questionnaire answer ID.
 * @returns {Promise<any>}
 */
export async function verifyCallback(action, account, answerId) {
  const response = await fetch("/api/auth/verify/", {
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
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to verify authentication.");
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
}

/**
 * Sets or resets the user's password.
 * @param {string} action - The action being performed (signup or reset_password).
 * @param {string} password - The new password.
 * @returns {Promise<any>}
 */
export async function setPassword(action, password) {
  const url = action === "signup" ? "/api/auth/signup/" : "/api/auth/password/";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to set password.");
  }

  clearAuthFlowState();
  return await response.json();
}

/**
 * Logs in a user with username and password.
 * @param {string} account
 * @param {string} password
 * @param {string} turnstileToken
 * @returns {Promise<any>}
 */
export async function loginWithPassword(account, password, turnstileToken) {
  const response = await fetch("/api/auth/login/", {
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
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed.");
  }
  return await response.json();
}

/**
 * Retrieves the current OTP state from localStorage.
 * @returns {{otp: string, expires_at: number} | null}
 */
export function getOtpState() {
  const otpState = localStorage.getItem(OTP_STORAGE_KEY);
  if (!otpState) return null;

  let parsed;
  try {
    parsed = JSON.parse(otpState);
  } catch {
    localStorage.removeItem(OTP_STORAGE_KEY);
    return null;
  }
  if (parsed.expires_at < Date.now()) {
    localStorage.removeItem(OTP_STORAGE_KEY);
    return null;
  }

  return parsed;
}

/**
 * Retrieves the current auth flow state from localStorage.
 * @returns {{status: string, action: string, expires_at: number} | null}
 */
export function getAuthFlowState() {
  const flowState = localStorage.getItem(FLOW_STATE_STORAGE_KEY);
  if (!flowState) return null;

  let parsed;
  try {
    parsed = JSON.parse(flowState);
  } catch {
    localStorage.removeItem(FLOW_STATE_STORAGE_KEY);
    return null;
  }
  if (parsed.expires_at < Date.now()) {
    localStorage.removeItem(FLOW_STATE_STORAGE_KEY);
    return null;
  }

  return parsed;
}

/**
 * Clears all auth flow related state from localStorage.
 */
export function clearAuthFlowState() {
  localStorage.removeItem(OTP_STORAGE_KEY);
  localStorage.removeItem(FLOW_STATE_STORAGE_KEY);
}
