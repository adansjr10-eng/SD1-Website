"use client";
import ProgressEditor from "./progress-editor";
import PresentationEditor from "./presentation-editor";
import TeamVideoEditor from "./team-video-editor";
import { isTeamVideo } from "@/lib/team-video";
import type { Entry, Resource } from "@/lib/data";
import {
  projectSections,
  reviewStates,
  reviewLabels,
  type ProjectDetails,
  type Citation,
  type ReviewState,
} from "@/lib/project-content";
export default function ProjectEditor({
  entry,
  onChange,
  entries,
  resources,
}: {
  entry: Entry;
  entries: Entry[];
  resources: Resource[];
  onChange: (changes: Partial<Entry>) => void;
}) {
  const details = entry.details || {},
    citations = entry.provenance || [];
  const setDetails = (changes: Partial<ProjectDetails>) =>
    onChange({ details: { ...details, ...changes } });
  const citation = (i: number, changes: Partial<Citation>) =>
    onChange({
      provenance: citations.map((c, j) => (j === i ? { ...c, ...changes } : c)),
    });
  if (isTeamVideo(entry))
    return (
      <TeamVideoEditor
        entry={entry}
        entries={entries}
        resources={resources}
        onChange={onChange}
      />
    );
  return (
    <details className="spec-editor project-fields" open>
      <summary>Project structure, evidence & review status</summary>
      <div className="form-grid">
        <label>
          Project section
          <input
            list="project-sections"
            value={entry.section || ""}
            onChange={(e) => onChange({ section: e.target.value })}
          />
          <datalist id="project-sections">
            {projectSections.map((s) => (
              <option value={s.id} key={s.id}>
                {s.label}
              </option>
            ))}
          </datalist>
          <small>
            Choose a section or create a new identifier. Custom sections appear
            in the research library.
          </small>
        </label>
        <label>
          Engineering review state
          <select
            value={entry.review_state || "pending"}
            onChange={(e) =>
              onChange({ review_state: e.target.value as ReviewState })
            }
          >
            {reviewStates.map((s) => (
              <option value={s} key={s}>
                {reviewLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Development stage
          <input
            value={details.stage || ""}
            onChange={(e) => setDetails({ stage: e.target.value || undefined })}
          />
        </label>
        <label>
          Key objectives (one per line)
          <textarea
            rows={3}
            value={(details.objectives || []).join("\n")}
            onChange={(e) =>
              setDetails({
                objectives: e.target.value.split("\n").filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Milestone / activity date
          <input
            placeholder="YYYY, YYYY-MM, or YYYY-MM-DD; leave unknown dates blank"
            value={details.event_date || ""}
            onChange={(e) =>
              setDetails({ event_date: e.target.value || undefined })
            }
          />
        </label>
        <label>
          Interactive calculation
          <select
            value={details.calculation || ""}
            onChange={(e) =>
              setDetails({
                calculation:
                  e.target.value === "wheel-rpm" ? "wheel-rpm" : undefined,
              })
            }
          >
            <option value="">None</option>
            <option value="wheel-rpm">Wheel speed → rotation</option>
          </select>
        </label>
      </div>
      {entry.section === "progress" && (
        <ProgressEditor details={details} onChange={setDetails} />
      )}
      {["home", "overview", "team"].includes(entry.section || "") && (
        <PresentationEditor
          entry={entry}
          entries={entries}
          resources={resources}
          onChange={onChange}
        />
      )}
      <h3>Source provenance</h3>
      <p className="muted">
        Use document names and page/slide/section locations. An internal
        document does not need a public URL. Month-only dates are permitted when
        the day is unknown.
      </p>
      {citations.map((c, i) => (
        <div className="editor-repeat" key={i}>
          <div className="form-grid">
            <label>
              Source document
              <input
                value={c.document}
                onChange={(e) => citation(i, { document: e.target.value })}
              />
            </label>
            <label>
              Source date
              <input
                placeholder="YYYY-MM or YYYY-MM-DD"
                value={c.date}
                onChange={(e) => citation(i, { date: e.target.value })}
              />
            </label>
            <label>
              Page / slide / section
              <input
                value={c.locator}
                onChange={(e) => citation(i, { locator: e.target.value })}
              />
            </label>
            <label>
              Source URL (optional)
              <input
                type="url"
                value={c.url || ""}
                onChange={(e) =>
                  citation(i, { url: e.target.value || undefined })
                }
              />
            </label>
            <label>
              Source availability
              <select
                value={c.availability || "provided"}
                onChange={(e) =>
                  citation(i, {
                    availability: e.target.value as Citation["availability"],
                  })
                }
              >
                <option value="provided">Provided</option>
                <option value="not-provided">Original not provided</option>
              </select>
            </label>
            <label>
              Source priority
              <select
                value={c.priority || "baseline"}
                onChange={(e) =>
                  citation(i, {
                    priority: e.target.value as Citation["priority"],
                  })
                }
              >
                <option value="baseline">Baseline proposal</option>
                <option value="current">Current explicit direction</option>
                <option value="historical">Historical progress</option>
              </select>
            </label>
          </div>
          <button
            className="text-button danger"
            type="button"
            onClick={() =>
              onChange({ provenance: citations.filter((_, j) => j !== i) })
            }
          >
            Remove source
          </button>
        </div>
      ))}
      <button
        className="button"
        type="button"
        onClick={() =>
          onChange({
            provenance: [
              ...citations,
              {
                document: "",
                date: "",
                locator: "",
                availability: "provided",
                priority: "baseline",
              },
            ],
          })
        }
      >
        Add source citation
      </button>
      <h3>Structured specification rows</h3>
      {(details.rows || []).map((r, i) => (
        <div className="editor-repeat compact-grid" key={i}>
          <label>
            Item
            <input
              value={r.label}
              onChange={(e) =>
                setDetails({
                  rows: details.rows!.map((v, j) =>
                    j === i ? { ...v, label: e.target.value } : v,
                  ),
                })
              }
            />
          </label>
          <label>
            Value / uncertainty
            <input
              value={r.value}
              onChange={(e) =>
                setDetails({
                  rows: details.rows!.map((v, j) =>
                    j === i ? { ...v, value: e.target.value } : v,
                  ),
                })
              }
            />
          </label>
          <label>
            Status
            <select
              value={r.state}
              onChange={(e) =>
                setDetails({
                  rows: details.rows!.map((v, j) =>
                    j === i
                      ? { ...v, state: e.target.value as ReviewState }
                      : v,
                  ),
                })
              }
            >
              {reviewStates.map((s) => (
                <option value={s} key={s}>
                  {reviewLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setDetails({ rows: details.rows!.filter((_, j) => j !== i) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button"
        onClick={() =>
          setDetails({
            rows: [
              ...(details.rows || []),
              { label: "", value: "", state: "pending" },
            ],
          })
        }
      >
        Add specification row
      </button>
      <label>
        Functions — WHAT (one per line)
        <textarea
          rows={4}
          value={(details.functions || []).join("\n")}
          onChange={(e) =>
            setDetails({
              functions: e.target.value.split("\n").filter(Boolean),
            })
          }
        />
      </label>
      <h3>Candidate options — HOW</h3>
      {(details.options || []).map((o, i) => (
        <div className="editor-repeat" key={i}>
          <div className="form-grid">
            {(["function", "candidate", "reason"] as const).map((k) => (
              <label key={k}>
                {k}
                <input
                  value={o[k]}
                  onChange={(e) =>
                    setDetails({
                      options: details.options!.map((v, j) =>
                        j === i ? { ...v, [k]: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Status
              <select
                value={o.state}
                onChange={(e) =>
                  setDetails({
                    options: details.options!.map((v, j) =>
                      j === i
                        ? { ...v, state: e.target.value as ReviewState }
                        : v,
                    ),
                  })
                }
              >
                {reviewStates.map((s) => (
                  <option key={s} value={s}>
                    {reviewLabels[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setDetails({
                options: details.options!.filter((_, j) => j !== i),
              })
            }
          >
            Remove option
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button"
        onClick={() =>
          setDetails({
            options: [
              ...(details.options || []),
              { function: "", candidate: "", reason: "", state: "preliminary" },
            ],
          })
        }
      >
        Add candidate option
      </button>
      <h3>People & roles</h3>
      {(details.people || []).map((p, i) => (
        <div className="editor-repeat compact-grid" key={i}>
          <label>
            Name
            <input
              value={p.name}
              onChange={(e) =>
                setDetails({
                  people: details.people!.map((v, j) =>
                    j === i ? { ...v, name: e.target.value } : v,
                  ),
                })
              }
            />
          </label>
          <label>
            Role
            <input
              value={p.role}
              onChange={(e) =>
                setDetails({
                  people: details.people!.map((v, j) =>
                    j === i ? { ...v, role: e.target.value } : v,
                  ),
                })
              }
            />
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setDetails({ people: details.people!.filter((_, j) => j !== i) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button"
        onClick={() =>
          setDetails({
            people: [...(details.people || []), { name: "", role: "" }],
          })
        }
      >
        Add person
      </button>
      <h3>Decision history</h3>
      {(details.decisions || []).map((d, i) => (
        <div className="editor-repeat" key={i}>
          <div className="form-grid">
            {(["date", "decision", "basis"] as const).map((k) => (
              <label key={k}>
                {k}
                <input
                  value={d[k]}
                  onChange={(e) =>
                    setDetails({
                      decisions: details.decisions!.map((v, j) =>
                        j === i ? { ...v, [k]: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Status
              <select
                value={d.state}
                onChange={(e) =>
                  setDetails({
                    decisions: details.decisions!.map((v, j) =>
                      j === i
                        ? { ...v, state: e.target.value as ReviewState }
                        : v,
                    ),
                  })
                }
              >
                {reviewStates.map((s) => (
                  <option key={s} value={s}>
                    {reviewLabels[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setDetails({
                decisions: details.decisions!.filter((_, j) => j !== i),
              })
            }
          >
            Remove decision
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button"
        onClick={() =>
          setDetails({
            decisions: [
              ...(details.decisions || []),
              { date: "", decision: "", basis: "", state: "preliminary" },
            ],
          })
        }
      >
        Add decision record
      </button>
    </details>
  );
}
