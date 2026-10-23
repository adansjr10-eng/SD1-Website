"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  FileText,
  Flag,
  Plus,
} from "lucide-react";
import type { Entry, Resource } from "@/lib/data";
import { entryHref } from "@/lib/project-content";
import {
  isProgress,
  isArchived,
  progressType,
  progressDate,
  progressStatus,
  progressTypes,
  progressStatuses,
  type ProgressType,
  type ProgressStatus,
} from "@/lib/progress";
import { Provenance } from "./project-library";
import { ActivityBadge, ProgressRecordFields } from "./progress-record";
export default function ProjectProgress({
  entries,
  resources,
  renderResource,
  onEdit,
  onNew,
  onUpload,
}: {
  entries: Entry[];
  resources: Resource[];
  renderResource: (r: Resource) => ReactNode;
  onEdit?: (entry: Entry) => void;
  onNew?: (type: ProgressType) => void;
  onUpload?: (entryId: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [archive, setArchive] = useState(false);
  const all = entries.filter(isProgress);
  const visible = all.filter((e) => archive || !isArchived(e));
  const byType = (type: ProgressType) =>
    visible.filter((e) => progressType(e) === type);
  const summaries = byType("summary").sort(
      (a, b) =>
        Number(isArchived(a)) - Number(isArchived(b)) ||
        (b.details?.progress?.as_of || "").localeCompare(
          a.details?.progress?.as_of || "",
        ),
    ),
    summary = summaries[0];
  const milestones = byType("milestone").sort((a, b) =>
    (b.details?.event_date || "").localeCompare(a.details?.event_date || ""),
  );
  const filtered = milestones.filter(
    (e) => !filter || progressStatus(e) === filter,
  );
  function controls(entry: Entry) {
    return (
      <div className="progress-controls">
        <Link className="text-link" href={entryHref(entry)}>
          Open full record
          <ArrowRight size={13} />
        </Link>
        {onEdit && (
          <button
            className="text-button"
            onClick={() => onEdit(entry)}
            aria-label={`Edit ${entry.title}`}
          >
            Edit update
          </button>
        )}
        {onUpload && (
          <button className="text-button" onClick={() => onUpload(entry.id)}>
            Attach progress files
          </button>
        )}
        {entry.status === "draft" && (
          <span className="progress-draft">
            Private draft · review before publication
          </span>
        )}
        {isArchived(entry) && <span className="progress-draft">Archived</span>}
      </div>
    );
  }
  function evidence(entry: Entry) {
    const files = resources.filter((r) => r.entry_id === entry.id);
    return (
      <>
        <Provenance sources={entry.provenance} />
        {files.length > 0 && (
          <div className="progress-attachments">
            <h3>Supporting images & documents</h3>
            {files.map(renderResource)}
          </div>
        )}
      </>
    );
  }
  function newButton(type: ProgressType) {
    return (
      onNew && (
        <button className="button" onClick={() => onNew(type)}>
          <Plus size={14} />
          Add {type === "milestone" ? "milestone" : "update"}
        </button>
      )
    );
  }
  function recordBody(entry: Entry) {
    return (
      <>
        <ReactMarkdown>{entry.body}</ReactMarkdown>
        <ProgressRecordFields entry={entry} />
      </>
    );
  }
  return (
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            SIXTH GEAR · SENIOR DESIGN DEVELOPMENT
          </span>
          <h1>Project Progress</h1>
          <p>
            Accomplishments, current design work, and the next engineering
            decisions.
          </p>
        </div>
        {newButton("milestone")}
      </div>
      <nav className="progress-jump" aria-label="Progress sections">
        {[
          ["current", "Current status"],
          ["timeline", "Timeline"],
          ["bogie", "Passenger bogie"],
          ["engineering", "Engineering tracker"],
          ["challenges", "Design challenges"],
          ["next-steps", "Next steps"],
        ].map(([id, title]) => (
          <a href={`#progress-${id}`} key={id}>
            {title}
          </a>
        ))}
      </nav>
      <label className="check-label archive-toggle">
        <input
          type="checkbox"
          checked={archive}
          onChange={(e) => setArchive(e.target.checked)}
        />
        Show archived updates
        {all.some(isArchived) && ` (${all.filter(isArchived).length})`}
      </label>
      <section id="progress-current" className="panel progress-current">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CURRENT PROJECT STATUS</span>
            <h2>{summary?.title || "Development progress"}</h2>
          </div>
          <Flag size={23} />
        </div>
        {summary ? (
          <>
            <div className="progress-as-of">
              <ActivityBadge status={progressStatus(summary)} />
              <span>
                Source as of{" "}
                {summary.details?.progress?.as_of || "date not recorded"}
              </span>
            </div>
            <ProgressRecordFields entry={summary} />
            <ReactMarkdown>{summary.body}</ReactMarkdown>
            {controls(summary)}
            <details>
              <summary>Sources & supporting material</summary>
              {evidence(summary)}
            </details>
          </>
        ) : (
          <>
            <p>
              A reviewed status summary has not been published. Editors can
              import the progress brief as private drafts, then review and
              publish selected records.
            </p>
            {newButton("summary")}
          </>
        )}
        {summaries.length > 1 && (
          <details>
            <summary>Earlier status summaries ({summaries.length - 1})</summary>
            {summaries.slice(1).map((e) => (
              <article key={e.id}>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                {controls(e)}
                {evidence(e)}
              </article>
            ))}
          </details>
        )}
      </section>
      <section id="progress-timeline" className="progress-timeline-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">DEVELOPMENT HISTORY</span>
            <h2>Project Timeline</h2>
          </div>
          <label>
            Filter milestones
            <select
              aria-label="Filter milestones"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(progressStatuses).map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {milestones[0] && (
          <div className="progress-latest">
            <CalendarDays size={19} />
            <div>
              <span className="eyebrow">LATEST TIMELINE UPDATE</span>
              <a href={`#milestone-${milestones[0].id}`}>
                {milestones[0].title}
              </a>
              <small>{progressDate(milestones[0])}</small>
            </div>
            <ActivityBadge status={progressStatus(milestones[0])} />
          </div>
        )}
        <ol className="progress-milestones">
          {filtered.map((entry) => (
            <li key={entry.id} id={`milestone-${entry.id}`}>
              <span className="milestone-node" />
              <article className="panel progress-milestone">
                <div className="progress-card-top">
                  <time>{progressDate(entry)}</time>
                  <ActivityBadge status={progressStatus(entry)} />
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <details>
                  <summary>
                    Accomplishments, design notes & evidence
                    <ChevronDown size={15} />
                  </summary>
                  {entry.details?.progress?.accomplishments?.length ? (
                    <>
                      <h4>Key accomplishments & design notes</h4>
                      <ul>
                        {entry.details.progress.accomplishments.map(
                          (item, i) => (
                            <li key={i}>{item}</li>
                          ),
                        )}
                      </ul>
                    </>
                  ) : (
                    <ReactMarkdown>{entry.body}</ReactMarkdown>
                  )}
                  {evidence(entry)}
                </details>
                {controls(entry)}
              </article>
            </li>
          ))}
        </ol>
        {!filtered.length && (
          <div className="panel progress-empty">
            <FileText size={23} />
            <p>
              {milestones.length
                ? "No milestones match this status."
                : "No visible milestones yet. The supplied progress brief can be prepared as dated, private review drafts in Admin workspace."}
            </p>
          </div>
        )}
      </section>
      {(["bogie", "engineering", "challenges", "next-steps"] as const).map(
        (type) => (
          <section
            key={type}
            id={`progress-${type}`}
            className={`panel progress-block progress-block-${type}`}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  {type === "next-steps"
                    ? "UPCOMING WORK"
                    : "DESIGN DEVELOPMENT"}
                </span>
                <h2>{progressTypes[type]}</h2>
              </div>
              {newButton(type)}
            </div>
            {byType(type).length ? (
              byType(type).map((entry) => (
                <article key={entry.id} className="progress-record">
                  <div className="progress-as-of">
                    <ActivityBadge status={progressStatus(entry)} />
                    <span>
                      Source as of{" "}
                      {entry.details?.progress?.as_of || "date not recorded"}
                    </span>
                  </div>
                  {entry.title !== progressTypes[type] && (
                    <h3>{entry.title}</h3>
                  )}
                  <p>{entry.summary}</p>
                  {recordBody(entry)}
                  {controls(entry)}
                  <details>
                    <summary>Sources & supporting material</summary>
                    {evidence(entry)}
                  </details>
                </article>
              ))
            ) : (
              <p className="muted">
                No reviewed update is available in this section.
              </p>
            )}
          </section>
        ),
      )}
    </div>
  );
}
