/** Opt-in live smoke test. Creates team-only UUID fixtures and removes its own data. */
import { createClient } from "@supabase/supabase-js";
import { inspectBackendConfiguration } from "../lib/backend-config";
import { runAdminSmokeTest } from "../lib/admin-smoke";
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const config = inspectBackendConfiguration(url, key);
  if (config.mode !== "ready") {
    console.error(
      "FAIL: " + (config.error || "Supabase configuration is missing."),
    );
    process.exitCode = 1;
    return;
  }
  const email = process.env.RAIL_TEST_EMAIL,
    password = process.env.RAIL_TEST_PASSWORD;
  if (!email || !password) {
    console.error(
      "NOT RUN: provide RAIL_TEST_EMAIL and RAIL_TEST_PASSWORD securely for a dedicated editor account, or use the signed-in Admin workspace verification button.",
    );
    process.exitCode = 1;
    return;
  }
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(15000),
        }),
    },
  };
  const client = createClient(url!, key!, {
      ...options,
      auth: { ...options.auth, storageKey: "rail-lab-cli-verification" },
    }),
    anonymous = createClient(url!, key!, {
      ...options,
      auth: { ...options.auth, storageKey: "rail-lab-cli-anonymous" },
    });
  try {
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) {
      console.error(
        "FAIL: sign-in was not accepted. Confirm the dedicated account credentials and email confirmation.",
      );
      process.exitCode = 1;
      return;
    }
    const report = await runAdminSmokeTest(client, anonymous);
    for (const check of report.checks)
      console.log(
        `${check.passed ? "PASS" : "FAIL"}: ${check.label}: ${check.detail}`,
      );
    if (!report.passed) process.exitCode = 1;
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}
void main().catch(() => {
  console.error(
    "FAIL: live Supabase verification could not complete. Check configuration, credentials, membership, and network access. No credentials are printed.",
  );
  process.exitCode = 1;
});
