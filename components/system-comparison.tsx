"use client";
import type { Entry } from "@/lib/data";
import { displaySpec, specFields } from "@/lib/data";
import { ReviewBadge, Provenance } from "./project-library";
export default function SystemComparison({
  entries,
  selected,
  onToggle,
  imperial,
  onUnit,
  onExport,
}: {
  entries: Entry[];
  selected: string[];
  onToggle: (id: string) => void;
  imperial: boolean;
  onUnit: () => void;
  onExport: () => void;
}) {
  const testers = entries.filter((e) => e.kind === "tester"),
    chosen = testers.filter((e) => selected.includes(e.id));
  const labels = [
    ...new Set(
      chosen.flatMap((e) => e.details?.rows?.map((r) => r.label) || []),
    ),
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RESEARCH COMPARISON</div>
          <h1>Compare railway systems</h1>
          <p>
            Compare 2–4 records. Full-bogie, spring, freight-bearing, endurance,
            and configuration references serve different purposes;
            similar-looking ratings are not automatically comparable.
          </p>
        </div>
        <button className="button" onClick={onUnit}>
          {imperial ? "Imperial" : "SI units"}
        </button>
      </div>
      <div className="comparison-picker">
        {testers.map((e) => (
          <label key={e.id}>
            <input
              type="checkbox"
              checked={selected.includes(e.id)}
              onChange={() => onToggle(e.id)}
            />
            <span>
              <strong>{e.title}</strong>
              <small>{e.category || "Classification pending"}</small>
            </span>
            <ReviewBadge state={e.review_state} />
          </label>
        ))}
      </div>
      {chosen.length < 2 ? (
        <div className="empty">
          Select at least two records to display a comparison. Unknown
          specifications remain undocumented.
        </div>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <h2>Scope, evidence & specifications</h2>
            <button className="button primary" onClick={onExport}>
              Export CSV
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Comparison item</th>
                  {chosen.map((e) => (
                    <th key={e.id}>{e.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>System classification</td>
                  {chosen.map((e) => (
                    <td key={e.id}>{e.category || "Pending classification"}</td>
                  ))}
                </tr>
                <tr>
                  <td>Engineering state</td>
                  {chosen.map((e) => (
                    <td key={e.id}>
                      <ReviewBadge state={e.review_state} />
                    </td>
                  ))}
                </tr>
                {specFields.map((f) => (
                  <tr key={f.key}>
                    <td>{f.label}</td>
                    {chosen.map((e) => (
                      <td key={e.id}>
                        {displaySpec(f.key, e.specs[f.key], imperial)}
                      </td>
                    ))}
                  </tr>
                ))}
                {labels.map((label) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {chosen.map((e) => (
                      <td key={e.id}>
                        {e.details?.rows?.find((r) => r.label === label)
                          ?.value || "Not documented"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>Evidence</td>
                  {chosen.map((e) => (
                    <td key={e.id}>
                      {e.provenance?.length
                        ? e.provenance
                            .map(
                              (c) =>
                                `${c.document} · ${c.date || "date pending"} · ${c.locator}`,
                            )
                            .join("; ")
                        : "Source verification pending"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
