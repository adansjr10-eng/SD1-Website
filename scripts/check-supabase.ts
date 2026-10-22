import { inspectBackendConfiguration } from "../lib/backend-config";
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const config = inspectBackendConfiguration(url, key);
  if (config.mode !== "ready") {
    console.error(
      "FAIL: " +
        (config.error || "Supabase environment variables are missing."),
    );
    process.exitCode = 1;
  } else {
    console.log(
      "PASS: public configuration format. No credentials will be printed.",
    );
    const checks = [
      ["Authentication settings", "/auth/v1/settings"],
      [
        "Entries table",
        "/rest/v1/entries?select=id,kind,specs,status,visibility&limit=0",
      ],
      [
        "Attachment table",
        "/rest/v1/resources?select=id,path,mime,size,status,visibility,entry_id&limit=0",
      ],
      ["Membership table", "/rest/v1/members?select=user_id,role&limit=0"],
    ];
    for (const [label, path] of checks) {
      try {
        const response = await fetch(url!.replace(/\/$/, "") + path, {
          headers: {
            apikey: key!,
            ...(path.startsWith("/rest") && key!.split(".").length === 3
              ? { Authorization: "Bearer " + key! }
              : {}),
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          let code = "";
          try {
            const body = await response.json();
            code = typeof body.code === "string" ? body.code : "";
          } catch {}
          console.error(
            `FAIL: ${label}: HTTP ${response.status}${code ? " (" + code + ")" : ""}. Check API key, project status, schema, and network settings.`,
          );
          process.exitCode = 1;
        } else {
          console.log(`PASS: ${label} reachable.`);
          if (path === "/auth/v1/settings") {
            const settings = await response.json();
            console.log(
              `INFO: public sign-up is ${settings.disable_signup ? "disabled" : "enabled; disable it for invite-only team access"}.`,
            );
          }
        }
      } catch {
        console.error(
          `FAIL: ${label}: network request failed. Check the API URL and required hostname in the network allowlist.`,
        );
        process.exitCode = 1;
      }
    }
    console.log(
      "NOT VERIFIED: signed-in admin writes, bucket configuration, real uploads, persistence, or effective RLS. Use Admin workspace diagnostics and supabase/verify.sql, then run a signed-in upload/edit/delete smoke test.",
    );
  }
}
void main().catch(() => {
  console.error("FAIL: Supabase checks could not complete.");
  process.exitCode = 1;
});
