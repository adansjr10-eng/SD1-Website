import type { Entry } from "@/lib/data";
import { progressStatuses, type ProgressStatus } from "@/lib/progress";
export function ActivityBadge({ status }: { status: ProgressStatus }) {
  return (
    <span className={`activity-badge activity-${status}`}>
      {progressStatuses[status]}
    </span>
  );
}
export function ProgressRecordFields({ entry }: { entry: Entry }) {
  const p = entry.details?.progress;
  return (
    <>
      {p?.type === "summary" && (
        <dl className="progress-summary-grid">
          {[
            ["Current phase", entry.details?.stage],
            ["Academic term", p.term],
            ["Project objective", p.objective],
            ["Current focus", p.focus],
            ["Next major milestone", p.next_milestone],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "Awaiting a reviewed update"}</dd>
            </div>
          ))}
        </dl>
      )}
      {p?.accomplishments?.length ? (
        <>
          <h3>Key accomplishments & design notes</h3>
          <ul>
            {p.accomplishments.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
      {p?.activities?.length ? (
        <div className="table-scroll">
          <table className="progress-activities">
            <thead>
              <tr>
                <th>Engineering activity</th>
                <th>Status</th>
                <th>Development notes</th>
              </tr>
            </thead>
            <tbody>
              {p.activities.map((a, i) => (
                <tr key={i}>
                  <th scope="row">{a.label}</th>
                  <td>
                    <ActivityBadge status={a.status} />
                  </td>
                  <td>{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {p?.challenges?.length ? (
        <div className="progress-challenges">
          {p.challenges.map((c, i) => (
            <article key={i}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{c.label}</h3>
              <p>{c.reason}</p>
            </article>
          ))}
        </div>
      ) : null}
      {p?.tasks?.length ? (
        <ol className="progress-tasks">
          {p.tasks.map((task, i) => (
            <li key={i}>
              <span className="planned-mark">Planned</span>
              {task}
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
