"use client";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Layers3,
  Activity,
  Wrench,
  RotateCw,
  ArrowDown,
  BookOpen,
  ImageIcon,
  FileText,
} from "lucide-react";
import type { Entry, Resource } from "@/lib/data";
import { entryHref } from "@/lib/project-content";
import {
  approvedImage,
  featuredProgress,
  presentationEntry,
  introductoryCopy,
  projectTitle,
  projectIdentity,
  university,
} from "@/lib/presentation";
import { progressDate, progressStatus } from "@/lib/progress";
import { ActivityBadge } from "./progress-record";
import TeamProfiles, { type ProfileActions } from "./team-profiles";
import PresentationImage from "./presentation-image";
import { Provenance } from "./project-library";
const functionIcons = [RotateCw, ArrowDown, Layers3, Activity, Wrench];
const fallbackFunctions = [
  "Controlled bearing rotation",
  "Controlled vertical loading",
  "Representative primary suspension",
  "Measurement and data acquisition",
  "Inspection and component access",
];
function FunctionalConcept() {
  return (
    <div
      className="portfolio-concept"
      role="img"
      aria-label="Conceptual functions: rotate a bearing, apply load, represent primary suspension, measure response, and provide component access. Not a final mechanical layout."
    >
      <div className="concept-topline">
        <span>PROPOSED FUNCTIONS</span>
        <span>01 / CONCEPT</span>
      </div>
      <div className="concept-main">
        <div className="concept-ring">
          <span>PBT</span>
          <small>
            BEARING TEST
            <br />
            PLATFORM
          </small>
        </div>
        <div className="concept-functions">
          {fallbackFunctions.slice(0, 4).map((f, i) => {
            const Icon = functionIcons[i];
            return (
              <div key={f}>
                <Icon size={19} />
                <span>{f}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="concept-footer">
        <span className="status-dot" />
        Under development<span>Functional illustration · no dimensions</span>
      </div>
    </div>
  );
}
export default function ProjectPresentation({
  mode,
  entries,
  resources,
  onEdit,
  onUpload,
  onNewProfile,
  onOpen,
  editable = false,
}: {
  mode: "home" | "overview";
  entries: Entry[];
  resources: Resource[];
} & ProfileActions) {
  const home = mode === "home",
    entry = presentationEntry(entries, mode, editable),
    overview = presentationEntry(entries, "overview", editable);
  const d = entry?.details,
    p = d?.presentation;
  const hero = approvedImage(p?.hero_image_id, resources, entries, editable);
  const bogie = approvedImage(p?.bogie_image_id, resources, entries, editable);
  const updates = featuredProgress(entries, p?.featured_update_ids);
  const gallery = (p?.gallery_image_ids || [])
    .map((id) => approvedImage(id, resources, entries, editable))
    .filter((r): r is Resource => Boolean(r));
  const functions = d?.functions?.length ? d.functions : fallbackFunctions;
  const whyCards =
    (p?.why_cards?.length
      ? p.why_cards
      : overview?.details?.presentation?.why_cards) || [];
  function edit(e: Entry | undefined, label = "Edit page content") {
    return (
      onEdit &&
      e && (
        <button
          className="text-button"
          onClick={() => onEdit(e)}
          aria-label={label}
        >
          {label}
        </button>
      )
    );
  }
  function progressPreview(limit: number) {
    return (
      <section className="portfolio-progress" id="overview-progress">
        <div className="portfolio-section-heading">
          <div>
            <span className="eyebrow">FROM RESEARCH TO DESIGN</span>
            <h2>
              {home ? "Latest project progress" : "Current Project Progress"}
            </h2>
            <p>Source-dated updates from the project timeline.</p>
          </div>
          <Link className="text-link" href="/progress">
            View Full Project Timeline
            <ArrowRight size={14} />
          </Link>
        </div>
        {updates.length ? (
          <div className="portfolio-progress-grid">
            {updates.slice(0, limit).map((e) => (
              <Link className="portfolio-update" href={entryHref(e)} key={e.id}>
                <span className="portfolio-update-date">{progressDate(e)}</span>
                <h3>{e.title}</h3>
                <p>{e.summary}</p>
                <ActivityBadge status={progressStatus(e)} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="portfolio-progress-empty">
            <p>
              Follow the team's proposal, concept development, and engineering
              decisions in Project Progress. Published updates will appear here.
            </p>
            <Link className="text-link" href="/progress">
              Explore Project Progress
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
    );
  }
  return (
    <div
      className={`portfolio-page ${home ? "portfolio-home" : "portfolio-overview"}`}
    >
      {!home && (
        <div className="portfolio-breadcrumb">
          <span>PROJECT OVERVIEW</span>
          <a href="#why-project-matters">Why it matters</a>
          <a href="#proposed-tester">Proposed tester</a>
          <a href="#meet-sixth-gear">Our team</a>
        </div>
      )}
      {editable && entry?.status === "draft" && (
        <div className="portfolio-preview-note">
          Editorial preview · this description is a team-only draft.
        </div>
      )}
      <section className="portfolio-hero">
        <div className="portfolio-hero-copy">
          <span className="portfolio-kicker">
            PBT <span>/</span> PASSENGER RAIL ENGINEERING
          </span>
          <h1>{entry?.title || projectTitle}</h1>
          <p className="portfolio-team-line">{projectIdentity}</p>
          <span className="portfolio-university">{university}</span>
          <p className="portfolio-description">
            {entry?.summary || introductoryCopy}
          </p>
          <div className="portfolio-hero-actions">
            <Link
              href={home ? "/project" : "#why-project-matters"}
              className="button primary"
            >
              {home ? "Explore Our Project" : "Discover the project"}
              <ArrowRight size={15} />
            </Link>
            <Link href="/progress" className="text-link">
              View Project Progress
              <ArrowRight size={14} />
            </Link>
            {home && (
              <Link href="/team" className="text-link">
                Meet the Team
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
          {edit(entry)}
          {editable && !entry && (
            <Link href="/admin" className="text-link">
              Prepare Home & Overview drafts
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
        <figure className="portfolio-hero-figure">
          {hero ? (
            <>
              <PresentationImage
                key={hero.id}
                resource={hero}
                alt={hero.caption || entry?.title || projectTitle}
                onOpen={onOpen}
              />
              <figcaption>
                {hero.caption || "Project image"}
                {hero.citation && <small>{hero.citation}</small>}
              </figcaption>
            </>
          ) : (
            <>
              <FunctionalConcept />
              <figcaption>
                Proposed system functions. This is an original conceptual
                illustration, not an extracted drawing or final mechanical
                layout.
              </figcaption>
            </>
          )}
        </figure>
      </section>
      {home ? (
        <>
          <div className="portfolio-home-highlights">
            <section>
              <span className="portfolio-mini-icon">
                <BookOpen size={20} />
              </span>
              <span className="eyebrow">THE RESEARCH OPPORTUNITY</span>
              <h2>Why the project matters</h2>
              <p>
                {whyCards[1]?.text ||
                  "A dedicated platform can support future research into passenger bearing and primary suspension arrangements."}
              </p>
              <Link href="/project#why-project-matters" className="text-link">
                Understand the research need
                <ArrowRight size={14} />
              </Link>
            </section>
            <section>
              <span className="portfolio-mini-icon">
                <Gauge size={20} />
              </span>
              <span className="eyebrow">OUR ENGINEERING APPROACH</span>
              <h2>Our proposed tester</h2>
              <p>
                {whyCards[2]?.text ||
                  "A single-bearing concept bringing together controlled rotation, vertical loading, representative suspension, and measurement."}
              </p>
              <Link href="/project#proposed-tester" className="text-link">
                See how it is intended to work
                <ArrowRight size={14} />
              </Link>
            </section>
          </div>
          {progressPreview(3)}
          <section className="portfolio-home-team">
            <div className="team-wordmark">
              SIXTH
              <br />
              GEAR<span>15</span>
            </div>
            <div>
              <span className="eyebrow">UTRGV · SENIOR DESIGN TEAM 15</span>
              <h2>Meet Sixth Gear</h2>
              <p>
                Get to know the team developing the passenger bearing tester and
                the advisors supporting the project.
              </p>
              <Link href="/project#meet-sixth-gear" className="button">
                Meet the team
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        </>
      ) : (
        <>
          <section id="why-project-matters" className="portfolio-why">
            <div className="portfolio-section-heading">
              <div>
                <span className="eyebrow">PURPOSE & OPPORTUNITY</span>
                <h2>Why This Project Matters</h2>
              </div>
            </div>
            {p?.why_intro && (
              <p className="portfolio-section-intro">{p.why_intro}</p>
            )}
            <div className="portfolio-why-grid">
              {(whyCards.length
                ? whyCards
                : [
                    {
                      title: "Existing capabilities",
                      text: "Build on laboratory bearing research and instrumentation experience.",
                    },
                    {
                      title: "Research opportunity",
                      text: "Study representative passenger bearing and suspension interfaces.",
                    },
                    {
                      title: "Our proposed solution",
                      text: "Develop a platform for controlled loading, rotation, and measurement.",
                    },
                  ]
              ).map((c, i) => (
                <article key={i}>
                  <span className="portfolio-card-number">0{i + 1}</span>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section id="proposed-tester" className="portfolio-functions">
            <div className="portfolio-section-heading">
              <div>
                <span className="eyebrow">UNDER DEVELOPMENT</span>
                <h2>Our Proposed Tester</h2>
                <p>
                  A functional view of the proposed platform. Fabrication and
                  validation remain project objectives.
                </p>
              </div>
              <Link href="/engineering" className="text-link">
                Engineering Design
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="portfolio-function-grid">
              {functions.map((f, i) => {
                const Icon = functionIcons[i % functionIcons.length];
                return (
                  <article key={i}>
                    <Icon size={24} />
                    <span>0{i + 1}</span>
                    <h3>{f}</h3>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="portfolio-bogie">
            <figure>
              {bogie ? (
                <>
                  <PresentationImage
                    key={bogie.id}
                    resource={bogie}
                    alt={p?.bogie_caption || "Passenger bogie reference"}
                    onOpen={onOpen}
                  />
                  {bogie.citation && <figcaption>{bogie.citation}</figcaption>}
                </>
              ) : (
                <div className="bogie-review-placeholder">
                  <ImageIcon size={28} />
                  <strong>
                    Bogie reference awaiting source and reuse review
                  </strong>
                  <span>
                    No verified reference image has been selected for display.
                  </span>
                </div>
              )}
            </figure>
            <div>
              <span className="eyebrow">VISUAL ENGINEERING REFERENCE</span>
              <h2>
                {p?.bogie_caption ||
                  "Passenger Bogie Reference — Bearing and Primary Suspension Arrangement"}
              </h2>
              <p>
                {p?.bogie_note ||
                  "Reference illustration. Exact bogie configuration and model identification are pending verification."}
              </p>
              <p className="muted">
                This section illustrates relevant component arrangements. It
                does not identify the project's physical bogie or establish
                delivery.
              </p>
              {onUpload && entry && (
                <button className="button" onClick={() => onUpload(entry.id)}>
                  Upload reference for review
                </button>
              )}
            </div>
          </section>
          <section className="portfolio-objectives">
            <div className="portfolio-section-heading">
              <div>
                <span className="eyebrow">WHAT WE AIM TO ACHIEVE</span>
                <h2>Project Objectives</h2>
                <p>
                  Design intentions and future outcomes, distinct from completed
                  accomplishments.
                </p>
              </div>
            </div>
            {d?.objectives?.length ? (
              <div className="portfolio-objective-grid">
                {d.objectives.map((o, i) => (
                  <article key={i}>
                    <span>0{i + 1}</span>
                    <h3>{o}</h3>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">
                The proposed platform combines bearing rotation, vertical
                loading, representative suspension, and instrumentation.
                Detailed objectives appear after editorial review.
              </p>
            )}
          </section>
          {progressPreview(4)}
          <TeamProfiles
            entries={entries}
            resources={resources}
            editable={editable}
            onEdit={onEdit}
            onUpload={onUpload}
            onNewProfile={onNewProfile}
            onOpen={onOpen}
          />
          <section className="portfolio-gallery">
            <div className="portfolio-section-heading">
              <div>
                <span className="eyebrow">DOCUMENTING THE DESIGN</span>
                <h2>Project Gallery</h2>
                <p>
                  Selected project images, with captions and source attribution.
                </p>
              </div>
              <Link href="/resources" className="text-link">
                Documents & Gallery
                <ArrowRight size={14} />
              </Link>
            </div>
            {gallery.length ? (
              <div className="portfolio-gallery-grid">
                {gallery.map((r) => (
                  <figure key={r.id}>
                    <PresentationImage
                      resource={r}
                      alt={r.caption || "Project development image"}
                      onOpen={onOpen}
                    />
                    <figcaption>
                      <strong>{r.caption || "Project image"}</strong>
                      {r.citation && <small>{r.citation}</small>}
                      {r.entry_id &&
                        entries.find((e) => e.id === r.entry_id) && (
                          <Link
                            href={entryHref(
                              entries.find((e) => e.id === r.entry_id)!,
                            )}
                            className="text-link"
                          >
                            Related project record
                            <ArrowRight size={12} />
                          </Link>
                        )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="portfolio-gallery-empty">
                <ImageIcon size={23} />
                <p>
                  Project photographs and drawings will be featured here after
                  source and permission review. No stock photographs have been
                  substituted.
                </p>
                {edit(entry, "Select featured images")}
              </div>
            )}
          </section>
          {entry && (
            <details className="portfolio-evidence">
              <summary>
                <FileText size={14} />
                Project sources & editorial details
              </summary>
              <Provenance sources={entry.provenance} />
              {edit(entry)}
              <Link href={entryHref(entry)} className="text-link">
                Open content record
                <ArrowRight size={13} />
              </Link>
            </details>
          )}
          {entries.some(
            (e) =>
              e.kind === "project" &&
              (!e.section || e.section === "overview") &&
              !e.details?.presentation &&
              (editable || e.status === "published"),
          ) && (
            <details className="portfolio-legacy">
              <summary>Additional project records</summary>
              {entries
                .filter(
                  (e) =>
                    e.kind === "project" &&
                    (!e.section || e.section === "overview") &&
                    !e.details?.presentation &&
                    (editable || e.status === "published"),
                )
                .map((e) => (
                  <article key={e.id}>
                    <Link href={entryHref(e)}>{e.title}</Link>
                    <p>{e.summary}</p>
                    {edit(e, `Edit ${e.title}`)}
                  </article>
                ))}
            </details>
          )}
        </>
      )}
      <div className="portfolio-bottom-link">
        <Link href={home ? "/project" : "/engineering"}>
          {home
            ? "Discover the full project"
            : "Continue to Engineering Design"}
          <ArrowRight size={18} />
        </Link>
        {home && (
          <Link href="/testers">
            Railway tester research
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
