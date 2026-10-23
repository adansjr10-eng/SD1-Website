import type { SupabaseClient } from "@supabase/supabase-js";

export const recoveryPath = "/reset-password";
export const recoveryStorageKey = "pbt-password-recovery-user";
export const expiredRecoveryMessage =
  "This recovery link has expired, has already been used, or is invalid. Request a new recovery email below and use the newest link.";

type RecoveryCallback =
  | { kind: "error" }
  | { kind: "session"; access_token: string; refresh_token: string }
  | { kind: "code"; code: string; flowId?: string }
  | { kind: "otp"; token_hash: string };

/** Capture before the auth SDK can clear a callback. Never log these values. */
export function parseRecoveryCallback(href: string): RecoveryCallback | null {
  const url = new URL(href);
  const params = new URLSearchParams(url.search);
  new URLSearchParams(url.hash.slice(1)).forEach((value, key) =>
    params.set(key, value),
  );
  if (
    params.has("error") ||
    params.has("error_code") ||
    params.has("error_description")
  )
    return { kind: "error" };
  const recovery =
    params.get("type") === "recovery" || url.pathname === recoveryPath;
  if (!recovery) return null;
  if (params.get("code"))
    return {
      kind: "code",
      code: params.get("code")!,
      flowId: params.get("sb_flow_id") || undefined,
    };
  if (params.get("token_hash") && params.get("type") === "recovery")
    return { kind: "otp", token_hash: params.get("token_hash")! };
  if (params.get("access_token") && params.get("refresh_token"))
    return {
      kind: "session",
      access_token: params.get("access_token")!,
      refresh_token: params.get("refresh_token")!,
    };
  return params.get("type") === "recovery" ||
    params.has("access_token") ||
    params.has("refresh_token")
    ? { kind: "error" }
    : null;
}

// One exchange per page load, even with React Strict Mode or a remounted screen.
// Credentials stay in memory only until the exchange finishes.
let initialCallback =
  typeof window === "undefined"
    ? null
    : parseRecoveryCallback(window.location.href);
export const hasInitialRecoveryCallback = Boolean(initialCallback);
let callbackPending = hasInitialRecoveryCallback;
export const hasPendingRecoveryCallback = () => callbackPending;
export function finishRecoveryCallback() {
  callbackPending = false;
}
let initialExchange: Promise<string> | undefined;
export function establishRecoverySession(
  client: SupabaseClient,
): Promise<string> {
  if (initialExchange) return initialExchange;
  const callback = initialCallback;
  initialExchange = (async () => {
    try {
      if (!callback || callback.kind === "error")
        throw new Error(expiredRecoveryMessage);
      const result =
        callback.kind === "session"
          ? await client.auth.setSession(callback)
          : callback.kind === "code"
            ? await client.auth.exchangeCodeForSession(
                callback.code,
                callback.flowId ? { flowId: callback.flowId } : undefined,
              )
            : await client.auth.verifyOtp({
                type: "recovery",
                token_hash: callback.token_hash,
              });
      if (result.error) throw result.error;
      if (!result.data.session?.user.id)
        throw new Error(expiredRecoveryMessage);
      return result.data.session.user.id;
    } finally {
      initialCallback = null;
    }
  })();
  return initialExchange;
}

export function recoveryErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const code = (error as { code?: string } | null)?.code || "";
  return /fetch|network|timeout/i.test(message) ||
    code === "over_request_rate_limit"
    ? "We could not verify the recovery link right now. Check your connection and request a new recovery email, or try again later."
    : expiredRecoveryMessage;
}
export function recoveryRedirectUrl(origin: string): string {
  // A fixed same-origin route; callback query strings cannot redirect elsewhere.
  return new URL(recoveryPath, new URL(origin).origin).toString();
}
export function validateNewPassword(
  password: string,
  confirmation: string,
): string {
  if (password.length < 8)
    return "Use at least 8 characters for your new password.";
  if (password !== confirmation) return "The passwords do not match.";
  return "";
}
