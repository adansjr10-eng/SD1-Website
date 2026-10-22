export type BackendConfiguration = {
  mode: "demo" | "invalid" | "ready";
  error: string;
  projectHost?: string;
};
/** Inspect public configuration without logging either value or making requests. */
export function inspectBackendConfiguration(
  rawUrl: string | undefined,
  rawKey: string | undefined,
): BackendConfiguration {
  const url = rawUrl?.trim() || "",
    key = rawKey?.trim() || "";
  const invalid = (error: string): BackendConfiguration => ({
    mode: "invalid",
    error,
  });
  if (!url && !key) return { mode: "demo", error: "" };
  if (!url || !key)
    return invalid(
      "Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. Update environment settings and restart development or rebuild production.",
    );
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return invalid(
      "NEXT_PUBLIC_SUPABASE_URL must be your Supabase project API URL, such as https://<project-ref>.supabase.co.",
    );
  }
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
  if (
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !["", "/"].includes(parsed.pathname)
  )
    return invalid(
      "NEXT_PUBLIC_SUPABASE_URL must point to the root of your Supabase project API, not a dashboard or chat page. Use the Project URL from Supabase API settings.",
    );
  if (
    ["chatgpt.com", "chat.openai.com", "supabase.com", "app.supabase.com"].some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith("." + host),
    )
  )
    return invalid(
      "NEXT_PUBLIC_SUPABASE_URL points to a dashboard or chat website. Replace it with your project API URL from Supabase API settings (https://<project-ref>.supabase.co).",
    );
  if (key.startsWith("sb_secret_"))
    return invalid(
      "A privileged Supabase secret key cannot be used in NEXT_PUBLIC_SUPABASE_ANON_KEY. Replace it with a publishable/anon key and rotate the exposed secret in Supabase.",
    );
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (payload.role !== "anon")
        return invalid(
          "Only a Supabase anon or publishable key is permitted in the browser. Replace the privileged key and rotate it if exposed.",
        );
      if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now())
        return invalid(
          "The Supabase anon key has expired. Update the public key in environment settings.",
        );
    } catch {
      return invalid(
        "The Supabase anon key is malformed. Copy the anon or publishable key from your project API settings.",
      );
    }
  } else if (
    !key.startsWith("sb_publishable_") &&
    !(local && key === "test-public-placeholder")
  )
    return invalid(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY must contain a Supabase publishable or anon key.",
    );
  return { mode: "ready", error: "", projectHost: parsed.hostname };
}
export function explainBackendError(error: {
  code?: string;
  message?: string;
}): string {
  if (["PGRST205", "42P01"].includes(error.code || ""))
    return "Research database tables are missing or unavailable. Run supabase/schema.sql in the Supabase SQL editor, then retry.";
  if (/bucket not found/i.test(error.message || ""))
    return "Persistent storage is not initialized. Create the private research-files bucket using supabase/schema.sql, or review its settings with supabase/verify.sql.";
  if (
    error.code === "42501" ||
    /row.level security|permission denied/i.test(error.message || "")
  )
    return "Supabase denied this operation. Confirm your team membership and the row-level security policies; do not disable RLS.";
  if (/fetch|network|timeout/i.test(error.message || ""))
    return "Supabase could not be reached. Check the project API URL, project status, and network allowlist, then retry.";
  return error.message || "The Supabase request failed. Please retry.";
}
