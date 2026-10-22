import { inspectBackendConfiguration } from "../lib/backend-config";
// Local/CI builds can intentionally demonstrate the app without a backend.
// A Vercel deployment must have valid public configuration at build time.
if (process.env.VERCEL === "1") {
  const configuration = inspectBackendConfiguration(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (configuration.mode !== "ready") {
    console.error(
      "Vercel deployment configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings, then redeploy.",
    );
    if (configuration.error) console.error(configuration.error);
    process.exitCode = 1;
  }
}
