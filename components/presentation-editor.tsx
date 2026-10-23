"use client";
import type { Entry, Resource } from "@/lib/data";
import {
  approvedImage,
  type PresentationDetails,
  type ProfileDetails,
} from "@/lib/presentation";
import { isProgress, isArchived, progressType } from "@/lib/progress";
export default function PresentationEditor({
  entry,
  entries,
  resources,
  onChange,
}: {
  entry: Entry;
  entries: Entry[];
  resources: Resource[];
  onChange: (value: Partial<Entry>) => void;
}) {
  const details = entry.details || {},
    p = details.presentation,
    profile = details.profile;
  const setPage = (change: Partial<PresentationDetails>) =>
    onChange({
      details: {
        ...details,
        presentation: {
          kind: entry.section === "home" ? "home" : "overview",
          ...p,
          ...change,
        },
      },
    });
  const setProfile = (change: Partial<ProfileDetails>) =>
    onChange({
      details: {
        ...details,
        profile: { group: "member", ...profile, ...change },
      },
    });
  const images = resources.filter((r) =>
    approvedImage(r.id, resources, entries, true),
  );
  function imageSelect(
    label: string,
    value: string | undefined,
    change: (id: string | undefined) => void,
    choices = images,
  ) {
    return (
      <label>
        {label}
        <select
          aria-label={label}
          value={value || ""}
          onChange={(e) => change(e.target.value || undefined)}
        >
          <option value="">No image / use neutral placeholder</option>
          {value && !choices.some((r) => r.id === value) && (
            <option value={value}>
              Current selection unavailable or not approved
            </option>
          )}
          {choices.map((r) => (
            <option key={r.id} value={r.id}>
              {r.caption || r.name} · {r.status} · {r.visibility}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function selection(
    label: string,
    ids: string[],
    choices: { id: string; label: string }[],
    max: number,
    change: (ids: string[]) => void,
  ) {
    return (
      <fieldset className="presentation-picks">
        <legend>{label}</legend>
        <p className="muted">
          Select up to {max}. Unavailable or unpublished selections are not
          displayed.
        </p>
        {choices.length ? (
          choices.map((c) => (
            <label className="check-label" key={c.id}>
              <input
                type="checkbox"
                checked={ids.includes(c.id)}
                disabled={!ids.includes(c.id) && ids.length >= max}
                onChange={(e) =>
                  change(
                    e.target.checked
                      ? [...ids, c.id]
                      : ids.filter((id) => id !== c.id),
                  )
                }
              />
              {c.label}
            </label>
          ))
        ) : (
          <small>No eligible selections available yet.</small>
        )}
        {ids.length > 0 && (
          <button
            type="button"
            className="text-button"
            onClick={() => change([])}
          >
            Clear {label.toLowerCase()}
          </button>
        )}
      </fieldset>
    );
  }
  return (
    <fieldset className="presentation-editor">
      <legend>
        {entry.section === "team"
          ? "Team profile"
          : "Home & Project Overview presentation"}
      </legend>
      {entry.section !== "team" ? (
        <>
          <label>
            Presentation layout
            <select
              aria-label="Presentation layout"
              value={p?.kind || ""}
              onChange={(e) =>
                onChange({
                  section: e.target.value || entry.section,
                  details: {
                    ...details,
                    presentation: e.target.value
                      ? {
                          ...p,
                          kind: e.target.value as PresentationDetails["kind"],
                        }
                      : undefined,
                  },
                })
              }
            >
              <option value="">Standard project record</option>
              <option value="home">Home introduction</option>
              <option value="overview">Project Overview presentation</option>
            </select>
          </label>
          {p && (
            <>
              <p className="muted">
                Title and summary above supply this page's heading and
                introduction. Objectives and functions below remain editable.
                Upload files first, confirm reuse rights, then select them here.
              </p>
              {imageSelect("Main project image", p.hero_image_id, (id) =>
                setPage({ hero_image_id: id }),
              )}
              {p.kind === "overview" && (
                <>
                  <label>
                    Why this project matters
                    <textarea
                      aria-label="Why this project matters"
                      rows={4}
                      value={p.why_intro || ""}
                      onChange={(e) => setPage({ why_intro: e.target.value })}
                    />
                  </label>
                  <h3>Research context cards</h3>
                  {(p.why_cards || []).map((card, i) => (
                    <div key={i} className="editor-repeat">
                      <label>
                        Context card title
                        <input
                          aria-label={`Context card title ${i + 1}`}
                          value={card.title}
                          onChange={(e) =>
                            setPage({
                              why_cards: p.why_cards!.map((c, j) =>
                                j === i ? { ...c, title: e.target.value } : c,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Context card description
                        <textarea
                          aria-label={`Context card description ${i + 1}`}
                          value={card.text}
                          onChange={(e) =>
                            setPage({
                              why_cards: p.why_cards!.map((c, j) =>
                                j === i ? { ...c, text: e.target.value } : c,
                              ),
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setPage({
                            why_cards: p.why_cards!.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Remove context card
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      setPage({
                        why_cards: [
                          ...(p.why_cards || []),
                          { title: "", text: "" },
                        ],
                      })
                    }
                  >
                    Add context card
                  </button>
                  {imageSelect(
                    "Passenger bogie reference image",
                    p.bogie_image_id,
                    (id) => setPage({ bogie_image_id: id }),
                  )}
                  <label>
                    Bogie reference caption
                    <input
                      value={p.bogie_caption || ""}
                      onChange={(e) =>
                        setPage({ bogie_caption: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Bogie reference note
                    <textarea
                      aria-label="Bogie reference note"
                      value={p.bogie_note || ""}
                      onChange={(e) => setPage({ bogie_note: e.target.value })}
                    />
                  </label>
                  {selection(
                    "Featured gallery images",
                    p.gallery_image_ids || [],
                    images.map((r) => ({
                      id: r.id,
                      label: r.caption || r.name,
                    })),
                    6,
                    (ids) => setPage({ gallery_image_ids: ids }),
                  )}
                </>
              )}
              {selection(
                "Featured project updates",
                p.featured_update_ids || [],
                entries
                  .filter(
                    (e) =>
                      e.status === "published" &&
                      !e.demo &&
                      isProgress(e) &&
                      !isArchived(e) &&
                      ["milestone", "bogie"].includes(progressType(e)),
                  )
                  .map((e) => ({ id: e.id, label: e.title })),
                4,
                (ids) => setPage({ featured_update_ids: ids }),
              )}
              <small>
                No selected updates means the latest three published progress
                records. A selection does not publish a draft record or
                attachment.
              </small>
            </>
          )}
        </>
      ) : (
        <>
          {details.people?.length && !profile ? (
            <p className="muted">
              This is an existing directory. Its People & roles fields remain
              below. Use Add profile on Our Team for individual photo-enabled
              profiles.
            </p>
          ) : (
            <label>
              Profile type
              <select
                aria-label="Profile type"
                value={profile?.group || ""}
                onChange={(e) =>
                  onChange({
                    details: {
                      ...details,
                      profile: e.target.value
                        ? {
                            ...profile,
                            group: e.target.value as ProfileDetails["group"],
                          }
                        : undefined,
                    },
                  })
                }
              >
                <option value="">Standard team record</option>
                <option value="member">Team member</option>
                <option value="advisor">Faculty / course advisor</option>
              </select>
            </label>
          )}
          {profile && (
            <>
              <p className="muted">
                The entry title is the person's full name. Roles, biography,
                links, and photographs are optional; leave unverified fields
                blank.
              </p>
              <div className="form-grid">
                <label>
                  Team role or advisor role
                  <input
                    value={profile.role || ""}
                    onChange={(e) => setProfile({ role: e.target.value })}
                  />
                </label>
                <label>
                  Profile order
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    value={profile.order ?? 0}
                    onChange={(e) =>
                      setProfile({ order: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <label>
                Short biography
                <textarea
                  aria-label="Short biography"
                  rows={3}
                  value={profile.biography || ""}
                  onChange={(e) => setProfile({ biography: e.target.value })}
                />
              </label>
              <label>
                LinkedIn URL (optional)
                <input
                  type="url"
                  value={profile.linkedin || ""}
                  onChange={(e) =>
                    setProfile({ linkedin: e.target.value || undefined })
                  }
                />
              </label>
              {profile.group === "member" &&
                imageSelect(
                  "Team member photo",
                  profile.photo_id,
                  (id) => setProfile({ photo_id: id }),
                  images.filter((r) => r.entry_id === entry.id),
                )}
              <small>
                Save the profile, upload a photo linked to this entry, and
                confirm its reuse rights. Then select the photo here. It stays a
                neutral initials placeholder until an eligible image is
                selected. Publication of the profile and photo are separate.
              </small>
            </>
          )}
        </>
      )}
    </fieldset>
  );
}
