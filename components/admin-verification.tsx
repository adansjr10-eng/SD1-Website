"use client";
import { useState } from "react";
import { Check, CircleHelp, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase, createAnonymousClient } from "@/lib/supabase";
import { runAdminSmokeTest, type SmokeCheck } from "@/lib/admin-smoke";
export default function AdminVerification() {
  const [busy, setBusy] = useState(false),
    [checks, setChecks] = useState<SmokeCheck[]>([]),
    [complete, setComplete] = useState(false);
  async function run() {
    if (!supabase) return;
    setBusy(true);
    setChecks([]);
    setComplete(false);
    try {
      const anonymous = createAnonymousClient();
      if (!anonymous) throw new Error("Supabase configuration is unavailable.");
      const result = await runAdminSmokeTest(supabase, anonymous, setChecks);
      setChecks(result.checks);
      setComplete(true);
    } catch {
      setChecks([
        {
          label: "Verification",
          passed: false,
          detail:
            "The test could not finish. Check your session and connection, then retry.",
        },
      ]);
      setComplete(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel backend-status">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SIGNED-IN ACCEPTANCE TEST</span>
          <h2>Verify uploads & saved changes</h2>
        </div>
        <button className="button" disabled={busy} onClick={run}>
          {busy ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <ShieldCheck size={15} />
          )}{" "}
          {busy ? "Verifying…" : "Run storage & persistence test"}
        </button>
      </div>
      <p className="muted">
        Uses your signed-in account to create a temporary team-only tester, save
        specifications, upload an image and PDF, re-read saved data and file
        bytes, check anonymous isolation, and delete its test records. Existing
        research is left unchanged. This checks persistence through new
        requests; use a browser refresh to confirm the full page workflow.
      </p>
      {checks.length > 0 && (
        <ul className="backend-checks" aria-live="polite">
          {checks.map((c) => (
            <li key={c.label}>
              <span className={`check-outcome ${c.passed ? "pass" : "action"}`}>
                {c.passed ? <Check size={15} /> : <CircleHelp size={15} />}
              </span>
              <div>
                <strong>
                  {c.label}
                  <small>{c.passed ? "Passed" : "Action required"}</small>
                </strong>
                <p>{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {complete && checks.every((c) => c.passed) && (
        <p className="verification-success" role="status">
          Live verification passed. Temporary records were removed. You can now
          test your own entry and refresh the page.
        </p>
      )}
    </section>
  );
}
