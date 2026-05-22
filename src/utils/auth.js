export const OTP_STORAGE_KEY = "auth_otp";
export const FLOW_STATE_STORAGE_KEY = "auth_flow";

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
