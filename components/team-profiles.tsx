"use client";
import Link from "next/link";
import { ArrowRight, Linkedin, Plus } from "lucide-react";
import type { Entry, Resource } from "@/lib/data";
import { entryHref } from "@/lib/project-content";
import {
  approvedImage,
  profileEntries,
  initials,
  linkedinUrl,
  projectIdentity,
  university,
} from "@/lib/presentation";
import PresentationImage from "./presentation-image";
export type ProfileActions = {
  onEdit?: (entry: Entry) => void;
  onUpload?: (id: string) => void;
  onNewProfile?: () => void;
  onOpen: (resource: Resource) => void;
  editable?: boolean;
};
export default function TeamProfiles({
  entries,
  resources,
  onEdit,
  onUpload,
  onNewProfile,
  onOpen,
  editable = false,
  standalone = false,
  compact = false,
}: {
  entries: Entry[];
  resources: Resource[];
  standalone?: boolean;
  compact?: boolean;
} & ProfileActions) {
  const profiles = profileEntries(entries, editable);
  const legacy = profiles.length
    ? undefined
    : entries.find(
        (e) =>
          e.section === "team" &&
          e.details?.people?.length &&
          (editable || e.status === "published"),
      );
  const people = profiles.length
    ? profiles.map((e) => ({
        name: e.title,
        role: e.details!.profile!.role || "",
        bio: e.details!.profile!.biography || "",
        linkedin: e.details!.profile!.linkedin || "",
        advisor: e.details!.profile!.group === "advisor",
        entry: e,
        photo: approvedImage(
          e.details?.profile?.photo_id,
          resources,
          entries,
          editable,
          e.id,
        ),
      }))
    : (legacy?.details?.people || []).map((p) => ({
        name: p.name,
        role: p.role,
        bio: "",
        linkedin: "",
        advisor: /advisor|instructor/i.test(p.role),
        entry: legacy!,
        photo: undefined,
      }));
  const members = people.filter((p) => !p.advisor),
    advisors = people.filter((p) => p.advisor);
  const Title = standalone ? "h1" : "h2";
  return (
    <section
      id="meet-sixth-gear"
      className={`portfolio-team ${compact ? "compact-team" : ""}`}
    >
      <div className="portfolio-section-heading">
        <div>
          <span className="eyebrow">THE PEOPLE BEHIND THE PROJECT</span>
          <Title>{standalone ? "Our Team" : "Meet Sixth Gear"}</Title>
          <p>Senior Design Team 15 — {university}</p>
        </div>
        {onNewProfile ? (
          <button className="button" onClick={onNewProfile}>
            <Plus size={14} />
            Add profile
          </button>
        ) : (
          !standalone && (
            <Link href="/team" className="text-link">
              Our team
              <ArrowRight size={14} />
            </Link>
          )
        )}
      </div>
      {members.length ? (
        <div className="portfolio-profile-grid">
          {members.slice(0, compact ? 3 : undefined).map((p, i) => (
            <article key={p.entry.id + String(i)} className="portfolio-profile">
              {p.photo ? (
                <PresentationImage
                  key={p.photo.id}
                  resource={p.photo}
                  alt={p.name}
                  onOpen={onOpen}
                  portrait
                />
              ) : (
                <div
                  className="profile-monogram"
                  aria-label={`Photo placeholder for ${p.name}`}
                >
                  <span>{initials(p.name)}</span>
                  <small>SIXTH GEAR</small>
                </div>
              )}
              <div className="profile-copy">
                <h3>{p.name}</h3>
                {p.role && <p className="profile-role">{p.role}</p>}
                {onEdit && p.photo?.status === "draft" && (
                  <small className="profile-photo-note">
                    Photo preview · not published
                  </small>
                )}
                {p.bio && <p className="profile-bio">{p.bio}</p>}
                {linkedinUrl(p.linkedin) && (
                  <a
                    href={linkedinUrl(p.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-link"
                  >
                    <Linkedin size={13} />
                    LinkedIn
                  </a>
                )}
                {onEdit && (
                  <div className="profile-editor-actions">
                    <button
                      className="text-button"
                      onClick={() => onEdit(p.entry)}
                      aria-label={`Edit profile ${p.name}`}
                    >
                      Edit profile
                    </button>
                    {onUpload && p.entry.details?.profile && (
                      <button
                        className="text-button"
                        onClick={() => onUpload(p.entry.id)}
                        aria-label={`Upload photo for ${p.name}`}
                      >
                        Upload photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="team-introduction">
          <span className="team-wordmark">
            SIXTH
            <br />
            GEAR<span>15</span>
          </span>
          <div>
            <h3>{projectIdentity}</h3>
            <p>
              A student engineering team at UTRGV documenting the development of
              a passenger bearing test platform.
            </p>
            <p className="muted">
              Profiles appear after team review. Individual photographs are
              optional.
            </p>
            {editable && (
              <Link href="/admin" className="text-link">
                Prepare the team profile drafts
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
      {!compact && advisors.length > 0 && (
        <div className="portfolio-advisors">
          <h3>Faculty and Course Advisors</h3>
          <div>
            {advisors.map((p, i) => (
              <article key={p.entry.id + String(i)}>
                <h4>{p.name}</h4>
                <p>{p.role}</p>
                {p.bio && <p>{p.bio}</p>}
                {onEdit && (
                  <button
                    className="text-button"
                    onClick={() => onEdit(p.entry)}
                    aria-label={`Edit profile ${p.name}`}
                  >
                    Edit profile
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
      {standalone &&
        entries.some(
          (e) =>
            e.section === "team" &&
            !e.details?.profile &&
            (editable || e.status === "published"),
        ) && (
          <details className="portfolio-legacy">
            <summary>Team directory records & sources</summary>
            {entries
              .filter(
                (e) =>
                  e.section === "team" &&
                  !e.details?.profile &&
                  (editable || e.status === "published"),
              )
              .map((e) => (
                <article key={e.id}>
                  <Link href={entryHref(e)}>{e.title}</Link>
                  <p>{e.summary}</p>
                  {onEdit && (
                    <button className="text-button" onClick={() => onEdit(e)}>
                      Edit directory record
                    </button>
                  )}
                </article>
              ))}
          </details>
        )}
    </section>
  );
}
