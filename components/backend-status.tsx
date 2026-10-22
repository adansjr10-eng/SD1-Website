"use client";
import { useState } from "react";
import { Activity, Check, CircleHelp, LoaderCircle } from "lucide-react";
import { configuration, supabase } from "@/lib/supabase";
import { explainBackendError } from "@/lib/backend-config";
type CheckResult = {
  label: string;
  outcome: "pass" | "action" | "unverified";
  detail: string;
};
export default function BackendStatus({ editable }: { editable: boolean }) {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    const checks: CheckResult[] = [];
    try {
      if (!supabase) {
        setResults([
          {
            label: "Public configuration",
            outcome: "action",
            detail:
              configuration.error ||
              "Configure your Supabase project URL and public key.",
          },
        ]);
        return;
      }
      checks.push({
        label: "Public configuration",
        outcome: "pass",
        detail: `API host: ${configuration.projectHost}. This checks configuration format only.`,
      });
      const [{ error: entriesError }, { error: resourcesError }] =
        await Promise.all([
          supabase
            .from("entries")
            .select("id,kind,specs,status,visibility")
            .limit(0),
          supabase
            .from("resources")
            .select("id,path,mime,size,status,visibility,entry_id")
            .limit(0),
        ]);
      checks.push({
        label: "Research tables",
        outcome: entriesError || resourcesError ? "action" : "pass",
        detail:
          entriesError || resourcesError
            ? explainBackendError((entriesError || resourcesError)!)
            : "Entries and attachment tables are reachable through the current session.",
      });
      const session = await supabase.auth.getSession();
      checks.push({
        label: "Authentication",
        outcome: session.error
          ? "action"
          : session.data.session
            ? "pass"
            : "unverified",
        detail: session.error
          ? explainBackendError(session.error)
          : session.data.session
            ? "A signed-in session is available. Database policies still enforce permissions."
            : "Sign in with an authorized team account to test your membership and storage configuration.",
      });
      if (editable) {
        const { data, error } = await supabase.rpc("research_backend_status");
        if (error)
          checks.push({
            label: "Database & storage configuration",
            outcome: "action",
            detail:
              error.code === "PGRST202"
                ? "Run supabase/admin-diagnostics.sql in the Supabase SQL editor to enable authorized configuration checks."
                : explainBackendError(error),
          });
        else {
          const d = data as Record<string, unknown>;
          checks.push({
            label: "Database access policies",
            outcome: d.tables_ready && d.policies_present ? "pass" : "action",
            detail:
              d.tables_ready && d.policies_present
                ? "Required tables have RLS enabled and expected policy names are present. Behavioral tests are still needed to verify effective access."
                : "Run supabase/verify.sql in the SQL editor and review missing tables or policies.",
          });
          checks.push({
            label: "Persistent file storage",
            outcome:
              d.bucket_exists &&
              d.bucket_private &&
              d.upload_limit_ok &&
              d.images_allowed &&
              d.pdf_allowed
                ? "pass"
                : "action",
            detail:
              d.bucket_exists &&
              d.bucket_private &&
              d.upload_limit_ok &&
              d.images_allowed &&
              d.pdf_allowed
                ? "Private research-files bucket exists with a 25 MB maximum and image/PDF MIME types. A real upload is needed to verify persistence."
                : "Check the research-files bucket: private, 25 MB limit, and JPG/PNG/WebP/PDF allowed. See supabase/verify.sql.",
          });
        }
      } else
        checks.push({
          label: "Admin & storage access",
          outcome: "unverified",
          detail:
            "Only editors and admins can inspect private storage settings. Membership is granted by a Supabase administrator.",
        });
      setResults(checks);
    } catch (err) {
      setResults([
        ...checks,
        {
          label: "Connection check",
          outcome: "action",
          detail: explainBackendError({ message: (err as Error).message }),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel backend-status">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CONNECTION & SETUP</span>
          <h2>Supabase connection checks</h2>
        </div>
        <button className="button" disabled={busy} onClick={check}>
          {busy ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <Activity size={15} />
          )}{" "}
          {busy ? "Checking…" : "Check connection"}
        </button>
      </div>
      <p className="muted">
        Checks use your current account and do not create records, upload files,
        or change permissions. A passing configuration check does not prove an
        upload has persisted.
      </p>
      {results.length > 0 && (
        <ul className="backend-checks" aria-live="polite">
          {results.map((r) => (
            <li key={r.label}>
              <span className={`check-outcome ${r.outcome}`}>
                {r.outcome === "pass" ? (
                  <Check size={15} />
                ) : (
                  <CircleHelp size={15} />
                )}
              </span>
              <div>
                <strong>
                  {r.label}
                  <small>
                    {r.outcome === "pass"
                      ? "Passed"
                      : r.outcome === "action"
                        ? "Action required"
                        : "Not verified"}
                  </small>
                </strong>
                <p>{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
