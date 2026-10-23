"use client";
import type { ProjectDetails } from "@/lib/project-content";
import {
  progressTypes,
  progressStatuses,
  type ProgressDetails,
  type ProgressType,
  type ProgressStatus,
} from "@/lib/progress";
const list = (value: string) => value.split("\n").filter(Boolean);
export default function ProgressEditor({
  details,
  onChange,
}: {
  details: ProjectDetails;
  onChange: (changes: Partial<ProjectDetails>) => void;
}) {
  const p = details.progress || {};
  const set = (changes: Partial<ProgressDetails>) =>
    onChange({ progress: { ...p, ...changes } });
  return (
    <fieldset className="progress-editor">
      <legend>Project Progress content</legend>
      <p className="muted">
        Activity status describes work completed or planned. Engineering review
        state and publication are separate decisions.
      </p>
      <div className="form-grid">
        <label>
          Progress record type
          <select
            aria-label="Progress record type"
            value={p.type || "milestone"}
            onChange={(e) => set({ type: e.target.value as ProgressType })}
          >
            {Object.entries(progressTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Activity status
          <select
            aria-label="Activity status"
            value={p.status || "pending"}
            onChange={(e) => set({ status: e.target.value as ProgressStatus })}
          >
            {Object.entries(progressStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Milestone end date
          <input
            type="date"
            value={details.event_end_date || ""}
            onChange={(e) =>
              onChange({ event_end_date: e.target.value || undefined })
            }
          />
        </label>
        <label>
          Progress as-of date
          <input
            type="date"
            value={p.as_of || ""}
            onChange={(e) => set({ as_of: e.target.value || undefined })}
          />
        </label>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={p.archived || false}
          onChange={(e) => set({ archived: e.target.checked })}
        />
        Archive this progress record
      </label>
      <small>
        Archived records remain saved and available through Show archived
        updates. Use publication/visibility controls to restrict access.
      </small>
      {p.type === "summary" && (
        <div className="form-grid">
          <label>
            Academic term
            <input
              value={p.term || ""}
              onChange={(e) => set({ term: e.target.value })}
            />
          </label>
          <label>
            Project objective
            <textarea
              aria-label="Project objective"
              value={p.objective || ""}
              onChange={(e) => set({ objective: e.target.value })}
            />
          </label>
          <label>
            Current focus
            <textarea
              aria-label="Current focus"
              value={p.focus || ""}
              onChange={(e) => set({ focus: e.target.value })}
            />
          </label>
          <label>
            Next major milestone
            <textarea
              aria-label="Next major milestone"
              value={p.next_milestone || ""}
              onChange={(e) => set({ next_milestone: e.target.value })}
            />
          </label>
        </div>
      )}
      {(p.type || "milestone") === "milestone" && (
        <label>
          Key accomplishments and design notes (one per line)
          <textarea
            rows={4}
            aria-label="Key accomplishments and design notes (one per line)"
            value={(p.accomplishments || []).join("\n")}
            onChange={(e) => set({ accomplishments: list(e.target.value) })}
          />
        </label>
      )}
      {p.type === "next-steps" && (
        <label>
          Upcoming tasks (one per line)
          <textarea
            rows={6}
            aria-label="Upcoming tasks (one per line)"
            value={(p.tasks || []).join("\n")}
            onChange={(e) => set({ tasks: list(e.target.value) })}
          />
        </label>
      )}
      {p.type === "engineering" && (
        <>
          <h3>Engineering activity tracker</h3>
          {(p.activities || []).map((a, i) => (
            <div className="editor-repeat" key={i}>
              <label>
                Activity name
                <input
                  value={a.label}
                  onChange={(e) =>
                    set({
                      activities: p.activities!.map((v, j) =>
                        j === i ? { ...v, label: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Activity review status
                <select
                  aria-label="Activity review status"
                  value={a.status}
                  onChange={(e) =>
                    set({
                      activities: p.activities!.map((v, j) =>
                        j === i
                          ? { ...v, status: e.target.value as ProgressStatus }
                          : v,
                      ),
                    })
                  }
                >
                  {Object.entries(progressStatuses).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Activity note
                <textarea
                  aria-label="Activity note"
                  value={a.note}
                  onChange={(e) =>
                    set({
                      activities: p.activities!.map((v, j) =>
                        j === i ? { ...v, note: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  set({ activities: p.activities!.filter((_, j) => j !== i) })
                }
              >
                Remove activity
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button"
            onClick={() =>
              set({
                activities: [
                  ...(p.activities || []),
                  { label: "", note: "", status: "pending" },
                ],
              })
            }
          >
            Add engineering activity
          </button>
        </>
      )}
      {p.type === "challenges" && (
        <>
          <h3>Design challenges</h3>
          {(p.challenges || []).map((c, i) => (
            <div className="editor-repeat" key={i}>
              <label>
                Challenge title
                <input
                  value={c.label}
                  onChange={(e) =>
                    set({
                      challenges: p.challenges!.map((v, j) =>
                        j === i ? { ...v, label: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Why it matters
                <textarea
                  aria-label="Why it matters"
                  value={c.reason}
                  onChange={(e) =>
                    set({
                      challenges: p.challenges!.map((v, j) =>
                        j === i ? { ...v, reason: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  set({ challenges: p.challenges!.filter((_, j) => j !== i) })
                }
              >
                Remove challenge
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button"
            onClick={() =>
              set({
                challenges: [
                  ...(p.challenges || []),
                  { label: "", reason: "" },
                ],
              })
            }
          >
            Add design challenge
          </button>
        </>
      )}
    </fieldset>
  );
}
