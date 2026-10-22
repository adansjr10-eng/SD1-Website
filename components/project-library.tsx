"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  FileText,
  Users,
  CircleHelp,
  Layers3,
} from "lucide-react";
import type { Entry, Resource } from "@/lib/data";
import {
  reviewLabels,
  entryHref,
  entrySection,
  designTopics,
  wheelRpm,
  type ReviewState,
  type Citation,
} from "@/lib/project-content";
export function ReviewBadge({ state }: { state?: ReviewState }) {
  return (
    <span className={`review-badge state-${state || "pending"}`}>
      {reviewLabels[state || "pending"]}
    </span>
  );
}
export function Provenance({ sources }: { sources?: Citation[] }) {
  return (
    <section className="provenance-block">
      <h2>Evidence & provenance</h2>
      {sources?.length ? (
        <ol>
          {sources.map((c, i) => (
            <li key={i}>
              <strong>{c.document}</strong>
              <span>
                {c.date || "Source date not supplied"} ·{" "}
                {c.locator || "Location pending"}
              </span>
              <small>
                {c.priority || "baseline"}
                {c.availability === "not-provided"
                  ? " · Original document not supplied"
                  : ""}
              </small>
              {c.url && /^https?:\/\//i.test(c.url) && (
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  Open source ↗
                </a>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">
          No provenance recorded. Add a source, source date, and page/section
          reference before treating this as a verified engineering claim.
        </p>
      )}
    </section>
  );
}
export function StructuredEntry({ entry }: { entry: Entry }) {
  const d = entry.details || {};
  return (
    <div className="structured-entry">
      {d.rows?.length ? (
        <section>
          <h2>Specification & requirement register</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Recorded information</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.label}</td>
                    <td>{r.value || "Pending technical confirmation"}</td>
                    <td>
                      <ReviewBadge state={r.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {d.functions?.length ? (
        <section>
          <h2>Functional decomposition — WHAT</h2>
          <p className="muted">
            Functions describe required behavior. Candidate components describe
            HOW and are evaluated separately.
          </p>
          <div
            className="functional-map"
            role="img"
            aria-label={"Tester functions: " + d.functions.join("; ")}
          >
            <div className="function-root">Passenger bearing test platform</div>
            <div className="function-branches">
              {d.functions.map((f, i) => (
                <div key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {d.options?.length ? (
        <section>
          <h2>Candidate approaches — HOW</h2>
          <p className="muted">
            Review status applies to each option. This table does not imply an
            approved concept selection.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Function</th>
                  <th>Candidate</th>
                  <th>Evaluation / design lesson</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {d.options.map((o, i) => (
                  <tr key={i}>
                    <td>{o.function}</td>
                    <td>{o.candidate}</td>
                    <td>{o.reason}</td>
                    <td>
                      <ReviewBadge state={o.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {d.people?.length ? (
        <section>
          <h2>Team & advisors</h2>
          <div className="people-grid">
            {d.people.map((p, i) => (
              <article key={i}>
                <span className="person-avatar">
                  <Users size={19} />
                </span>
                <strong>{p.name}</strong>
                <small>{p.role}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {d.decisions?.length ? (
        <section>
          <h2>Design decision history</h2>
          <div className="decision-history">
            {d.decisions.map((r, i) => (
              <article key={i}>
                <span>{r.date || "Date pending"}</span>
                <div>
                  <strong>{r.decision}</strong>
                  <p>{r.basis}</p>
                  <ReviewBadge state={r.state} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {d.calculation === "wheel-rpm" ? <WheelCalculator /> : null}
    </div>
  );
}
export function WheelCalculator() {
  const [speed, setSpeed] = useState(""),
    [diameter, setDiameter] = useState("");
  let result: number | undefined,
    error = "";
  if (speed !== "" && diameter !== "") {
    try {
      result = wheelRpm(Number(speed), Number(diameter));
    } catch (e) {
      error = (e as Error).message;
    }
  }
  return (
    <section className="panel wheel-calculator">
      <div className="eyebrow">KINEMATIC EXPLORATION</div>
      <h2>Wheel speed → bearing rotation</h2>
      <div className="formula">
        RPM = 1056 × speed (mph) / [π × diameter (in)]
      </div>
      <div className="form-grid">
        <label>
          Vehicle speed (mph)
          <input
            type="number"
            min="0"
            step="any"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
          />
        </label>
        <label>
          Effective wheel diameter (in)
          <input
            type="number"
            min="0"
            step="any"
            value={diameter}
            onChange={(e) => setDiameter(e.target.value)}
          />
        </label>
      </div>
      <output aria-live="polite">
        {error ||
          (result === undefined
            ? "Enter source-backed inputs to calculate rotational speed."
            : `${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} RPM — illustrative calculation, not a verified requirement`)}
      </output>
      <details>
        <summary>Assumptions, units & limitations</summary>
        <p>
          1056 = 5280 ft/mile × 12 in/ft ÷ 60 min/hour. Pure rolling and
          inner-ring rotation at axle speed are assumed. The effective rolling
          diameter must be known; wheel slip, wear, transmission ratios, heat,
          and laboratory dynamics are not evaluated. This calculation
          establishes no motor rating, load envelope, or final operating
          requirement. Blank inputs remain blank.
        </p>
      </details>
    </section>
  );
}
const sectionTitles: Record<string, string> = {
  engineering: "Engineering Design",
  progress: "Project Progress",
  team: "Our Team",
  calculations: "Engineering Calculations",
};
export function ProjectSection({
  section,
  entries,
  onEdit,
  onNew,
}: {
  section: string;
  entries: Entry[];
  onEdit?: (e: Entry) => void;
  onNew?: () => void;
}) {
  const [topic, setTopic] = useState("");
  const items = entries.filter(
    (e) => entrySection(e) === section && (!topic || e.title === topic),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PBT · SENIOR DESIGN ENGINEERING</div>
          <h1>{sectionTitles[section] || section}</h1>
          <p>
            {section === "engineering"
              ? "Document requirements, functions, alternatives, analysis, and validation without presenting preliminary work as final."
              : section === "progress"
                ? "Evidence-based milestones; activity dates are distinct from record edit dates."
                : section === "team"
                  ? "Team identity and advisor roles appear after editorial review."
                  : "An index of assumptions, equations, source-backed inputs, and reviewed calculations."}
          </p>
        </div>
        {onNew && (
          <button className="button primary" onClick={onNew}>
            Add entry
          </button>
        )}
      </div>
      {section === "engineering" && (
        <div className="design-tabs" aria-label="Engineering design topics">
          <Link className="button" href="/calculations">
            Calculation index →
          </Link>
          <button
            className={!topic ? "active" : ""}
            onClick={() => setTopic("")}
          >
            All design records
          </button>
          {designTopics.map((t) => (
            <button
              key={t}
              className={topic === t ? "active" : ""}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {section === "calculations" && <WheelCalculator />}
      {section === "progress" ? (
        <div className="project-timeline">
          {[...items]
            .sort((a, b) =>
              (b.details?.event_date || "").localeCompare(
                a.details?.event_date || "",
              ),
            )
            .map((e) => (
              <article className="panel" key={e.id}>
                <div className="timeline-date">
                  <Clock3 size={16} />
                  {e.details?.event_date || "Activity date not recorded"}
                </div>
                <ReviewBadge state={e.review_state} />
                <h2>
                  <Link href={entryHref(e)}>{e.title}</Link>
                </h2>
                <p>{e.summary}</p>
                <Provenance sources={e.provenance} />
                {onEdit && (
                  <button className="button" onClick={() => onEdit(e)}>
                    Edit milestone
                  </button>
                )}
              </article>
            ))}
        </div>
      ) : (
        <div className="article-grid">
          {items.map((e) => (
            <article className="panel knowledge-card" key={e.id}>
              <div className="card-kicker">
                <span>{e.category || section}</span>
                <ReviewBadge state={e.review_state} />
              </div>
              <h2>
                <Link href={entryHref(e)}>{e.title}</Link>
              </h2>
              <p>{e.summary}</p>
              {section === "team" && <StructuredEntry entry={e} />}
              <div className="knowledge-footer">
                <Link href={entryHref(e)} className="text-link">
                  Open technical record
                  <ArrowRight size={14} />
                </Link>
                {onEdit && (
                  <button className="text-button" onClick={() => onEdit(e)}>
                    Edit
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!items.length && (
        <div className="empty">
          <BookOpen />
          <h2>No reviewed entries available</h2>
          <p>
            Private drafts and unpublished source documents remain with the
            team. Editors can import the owner brief, add source-backed
            material, and publish selected records after review.
          </p>
          {section === "progress" && (
            <small>
              No historical meeting dates or completed milestones are inferred.
            </small>
          )}
        </div>
      )}
    </>
  );
}
export function ProjectHome({
  entries,
  resources,
  renderTester,
}: {
  entries: Entry[];
  resources: Resource[];
  renderTester: (e: Entry, i: number) => React.ReactNode;
}) {
  const overview =
    entries.find((e) => e.section === "overview") ||
    entries.find(
      (e) =>
        e.kind === "project" &&
        !e.section &&
        !e.demo &&
        e.id !== "project-overview",
    );
  const milestones = entries
    .filter((e) => e.kind === "update" && !e.demo)
    .sort((a, b) =>
      (b.details?.event_date || "").localeCompare(a.details?.event_date || ""),
    )
    .slice(0, 3);
  const testers = entries.filter((e) => e.kind === "tester" && !e.demo);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UNIVERSITY OF TEXAS RIO GRANDE VALLEY</div>
          <h1>
            {overview?.title ||
              "Design and Development of a Passenger Rail Bearing Tester"}
          </h1>
          <p>
            Team 15 — Sixth Gear · University Transportation Center for Railway
            Safety (UTCRS)
          </p>
        </div>
        <Link href="/project" className="button">
          Project overview
          <ArrowRight size={15} />
        </Link>
      </div>
      <section className="academic-hero">
        <div>
          <span className="hero-eyebrow">PBT · TEAM 15 — SIXTH GEAR</span>
          <h2>
            Passenger rail bearing research.
            <br />A documented engineering process.
          </h2>
          <p>
            {overview?.summary ||
              "Follow the design and development of a passenger bearing test platform. Technical content is shown only after the team reviews and publishes it."}
          </p>
          <div className="hero-actions">
            <Link className="button light" href="/engineering">
              Explore engineering design
              <ArrowRight size={15} />
            </Link>
            <Link href="/resources" className="hero-link">
              Technical documents
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <aside>
          <span className="eyebrow">DEVELOPMENT STATUS</span>
          <ReviewBadge state={overview?.review_state} />
          <p>
            {overview
              ? overview.details?.stage ||
                "Development status follows the currently visible project record."
              : "Awaiting a reviewed project overview. No final design status is inferred."}
          </p>
          <span className="hero-disclosure">
            <CircleHelp size={15} />
            Source dates and review states accompany technical records.
          </span>
        </aside>
      </section>
      <div className="stats-grid">
        {[
          {
            n: entries.filter((e) => entrySection(e) === "engineering").length,
            t: "Engineering records",
            href: "/engineering",
            icon: Layers3,
          },
          {
            n: testers.length,
            t: "Railway system references",
            href: "/testers",
            icon: BookOpen,
          },
          {
            n: resources.length,
            t: "Documents & images",
            href: "/resources",
            icon: FileText,
          },
          {
            n: milestones.length,
            t: "Recent progress records",
            href: "/progress",
            icon: Clock3,
          },
        ].map((s) => (
          <Link className="stat-card" key={s.t} href={s.href}>
            <span className="stat-icon blue">
              <s.icon size={20} />
            </span>
            <strong>{s.n.toString().padStart(2, "0")}</strong>
            <b>{s.t}</b>
            <small>Visible to your current account</small>
          </Link>
        ))}
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Project objectives & design highlights</h2>
            <Link className="text-link" href="/engineering">
              View design records
              <ArrowRight size={14} />
            </Link>
          </div>
          {overview ? (
            <div>
              <p className="home-description">{overview.summary}</p>
              {overview.details?.objectives?.length ? (
                <ul className="objective-list">
                  {overview.details.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="muted">
              The project objective, working architecture, and requirements will
              appear here after their records are reviewed. Editors can prepare
              team-only drafts in the admin workspace.
            </p>
          )}
          {entries
            .filter((e) => e.section === "engineering")
            .slice(0, 3)
            .map((e) => (
              <Link className="research-row" key={e.id} href={entryHref(e)}>
                <Layers3 size={18} />
                <div>
                  <strong>{e.title}</strong>
                  <span>{e.summary}</span>
                </div>
                <ReviewBadge state={e.review_state} />
              </Link>
            ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Recent progress</h2>
            <Link href="/progress" className="text-link">
              Full timeline
              <ArrowRight size={14} />
            </Link>
          </div>
          {milestones.length ? (
            milestones.map((e) => (
              <Link href={entryHref(e)} key={e.id} className="research-row">
                <Clock3 size={18} />
                <div>
                  <strong>{e.title}</strong>
                  <span>{e.details?.event_date || "Date pending"}</span>
                </div>
                <ReviewBadge state={e.review_state} />
              </Link>
            ))
          ) : (
            <p className="muted">
              No progress records have been published. The tracking report is
              needed to verify historical meeting dates and completed work.
            </p>
          )}
        </section>
      </div>
      <div className="section-heading">
        <div>
          <div className="eyebrow">RESEARCH LANDSCAPE</div>
          <h2>Existing railway testers & configuration references</h2>
          <p>
            Compare system scope, evidence, and useful design features—not just
            nominal ratings.
          </p>
        </div>
        <Link href="/testers" className="text-link">
          Open database
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="tester-grid">{testers.slice(0, 3).map(renderTester)}</div>
      {!testers.length && (
        <div className="panel empty compact">
          No approved railway-system records are visible. Research leads are
          kept as private drafts until their classifications and sources are
          reviewed.
        </div>
      )}
    </>
  );
}

export function ReviewGuide() {
  return (
    <details className="review-guide">
      <summary>How to read project status</summary>
      <div>
        {Object.entries(reviewLabels).map(([state, label]) => (
          <p key={state}>
            <ReviewBadge state={state as ReviewState} />
            <span>
              {
                (
                  {
                    confirmed:
                      "Supported by an approved source or verified decision.",
                    preliminary:
                      "Proposed target or concept awaiting validation.",
                    pending:
                      "Technical evidence, documentation, or confirmation is still required.",
                    completed:
                      "An activity has demonstrably finished; source and date should be recorded.",
                    planned: "Future analysis, fabrication, or testing.",
                  } as Record<string, string>
                )[state]
              }
            </span>
          </p>
        ))}
      </div>
      <small>
        Engineering maturity is separate from draft/publication status.
        Publishing an entry does not make its technical claims confirmed.
      </small>
    </details>
  );
}
