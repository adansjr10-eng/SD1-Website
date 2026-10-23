"use client";
import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { buildBriefBundle } from "@/lib/brief-import";
import {
  isPresentationBrief,
  buildPresentationBundle,
} from "@/lib/presentation-import";
import { isProgressBrief, buildProgressBundle } from "@/lib/progress-import";
import { validateBundle, type ImportBundle } from "@/lib/project-content";
import { supabase } from "@/lib/supabase";
import { ReviewBadge } from "./project-library";
import { ActivityBadge } from "./progress-record";
export default function PrivateImport({
  onDone,
}: {
  onDone: () => Promise<void>;
}) {
  const [text, setText] = useState(""),
    [bundle, setBundle] = useState<ImportBundle | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState("");
  function preview() {
    setError("");
    setResult("");
    try {
      const value = text.trim().startsWith("{")
        ? JSON.parse(text)
        : isPresentationBrief(text)
          ? buildPresentationBundle(text)
          : isProgressBrief(text)
            ? buildProgressBundle(text)
            : buildBriefBundle(text);
      validateBundle(value);
      setBundle(value);
    } catch (e) {
      setBundle(null);
      setError((e as Error).message);
    }
  }
  async function readFile(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Use a text/JSON review bundle smaller than 2 MB. Upload source PDFs separately as private attachments.",
      );
      return;
    }
    setText(await file.text());
    setBundle(null);
    setResult("");
    setError("");
  }
  async function importDrafts() {
    if (!supabase || !bundle) return;
    setBusy(true);
    setError("");
    try {
      validateBundle(bundle);
      const { data, error } = await supabase.rpc("import_project_drafts", {
        items: bundle.entries,
      });
      if (error)
        throw new Error(
          error.code === "PGRST202"
            ? "Apply supabase/migrations/202610_project_content.sql in the SQL editor, then retry."
            : error.message,
        );
      setResult(
        `${data.inserted} team-only drafts inserted; ${data.skipped} existing import keys skipped. Nothing was published.`,
      );
      await onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel private-import">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRIVATE EDITORIAL IMPORT</span>
          <h2>Prepare project drafts</h2>
        </div>
        <FileText size={23} />
      </div>
      <p className="muted">
        Paste the owner brief, a Home/Overview or Project Progress brief, or a
        reviewed PBT JSON bundle. Text is processed in your browser; it is not
        stored until you import. Source PDFs/presentations are uploaded
        separately as team-only documents. Public repository code contains no
        private brief or source files.
      </p>
      <details>
        <summary>Open import preparation</summary>
        <label className="file-select">
          Load owner brief or private JSON bundle
          <input
            type="file"
            accept=".txt,.md,.json"
            onChange={(e) => readFile(e.target.files?.[0])}
          />
        </label>
        <label>
          Owner brief or reviewed bundle
          <textarea
            rows={8}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setBundle(null);
            }}
            placeholder="Paste your project brief here. No data is imported by pasting."
          />
        </label>
        <button className="button" onClick={preview} disabled={!text.trim()}>
          Preview draft plan
        </button>
        {bundle && (
          <>
            <div className="import-summary">
              <strong>
                {bundle.entries.length} draft records · {bundle.title}
              </strong>
              <ul>
                {bundle.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="table-scroll import-preview">
              <table>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Section</th>
                    <th>Review / activity state</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {bundle.entries.map((e) => (
                    <tr key={e.import_key}>
                      <td>{e.title}</td>
                      <td>{e.section}</td>
                      <td>
                        {e.details?.progress ? (
                          <ActivityBadge
                            status={e.details.progress.status || "pending"}
                          />
                        ) : (
                          <ReviewBadge state={e.review_state} />
                        )}
                      </td>
                      <td>Team-only draft</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="button primary"
              disabled={busy}
              onClick={importDrafts}
            >
              <Upload size={15} />
              {busy
                ? "Importing…"
                : `Import ${bundle.entries.length} team-only drafts`}
            </button>
            <p className="muted">
              Stable import keys prevent duplicates. Reruns do not overwrite
              edits or restore deleted imported entries. Publication requires a
              separate editorial decision.
            </p>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {result && (
          <p className="verification-success" role="status">
            {result}
          </p>
        )}
      </details>
    </section>
  );
}
