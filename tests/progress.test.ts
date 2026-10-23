import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildProgressBundle,
  parseMilestoneHeading,
  inferProgressStatus,
} from "../lib/progress-import";
import {
  progressDate,
  progressStatus,
  progressType,
  isArchived,
  validProgressDate,
} from "../lib/progress";
import {
  validateBundle,
  validateDetails,
  entryHref,
} from "../lib/project-content";
import type { Entry } from "../lib/data";
const source = readFileSync("tests/fixtures/progress-brief.md", "utf8");
const entry = (
  value: ReturnType<typeof buildProgressBundle>["entries"][number],
): Entry => ({
  ...value,
  id: "synthetic-id",
  updated_at: "2025-01-31T00:00:00Z",
});
test("progress import scopes seven synthetic records to private source-dated drafts and stable keys", () => {
  const first = buildProgressBundle(source),
    second = buildProgressBundle(source);
  assert.deepEqual(first, second);
  validateBundle(first);
  assert.equal(first.entries.length, 7);
  assert.ok(
    first.entries.every(
      (e) =>
        e.section === "progress" &&
        e.status === "draft" &&
        e.visibility === "team" &&
        e.provenance?.[0].document === "Project owner progress brief" &&
        e.provenance[0].date === "2025-01-31",
    ),
  );
  assert.equal(new Set(first.entries.map((e) => e.import_key)).size, 7);
  const milestones = first.entries.filter(
    (e) => progressType(entry(e)) === "milestone",
  );
  assert.equal(milestones.length, 2);
  assert.ok(milestones.every((e) => !e.body.includes("Status:")));
  assert.equal(progressStatus(entry(milestones[0])), "completed");
  assert.equal(progressStatus(entry(milestones[1])), "in-progress");
  assert.equal(milestones[1].details?.event_date, "2025-01-28");
  assert.equal(milestones[1].details?.event_end_date, "2025-02-01");
  assert.match(
    progressDate(entry(milestones[1])),
    /Jan 28, 2025 – Feb 1, 2025/,
  );
  assert.equal(
    first.entries.find((e) => e.details?.progress?.type === "next-steps")
      ?.details?.progress?.status,
    "planned",
  );
  assert.equal(
    first.entries.find((e) => e.details?.progress?.type === "bogie")?.details
      ?.event_date,
    undefined,
  );
  assert.ok(first.warnings.some((w) => w.includes("were not supplied")));
  assert.equal(entryHref(entry(first.entries[0])), "/progress/synthetic-id");
});
test("activity states preserve continued work without promoting preliminary hardware to completion", () => {
  assert.equal(
    inferProgressStatus(
      "Completed milestone, with continued refinement afterward",
    ),
    "completed",
  );
  assert.equal(
    inferProgressStatus("Initial research completed; continues as needed"),
    "in-progress",
  );
  assert.equal(
    inferProgressStatus("Preliminary design developed"),
    "preliminary",
  );
  assert.equal(inferProgressStatus("Not yet verified as complete"), "pending");
  assert.equal(
    inferProgressStatus("Planned / In progress where documented"),
    "planned",
  );
  const e = entry(buildProgressBundle(source).entries[0]);
  assert.equal(isArchived(e), false);
  assert.equal(
    progressStatus({ ...e, review_state: "confirmed", details: {} }),
    "pending",
  );
  assert.equal(
    isArchived({
      ...e,
      details: {
        ...e.details,
        progress: { ...e.details?.progress, archived: true },
      },
    }),
    true,
  );
});
test("progress ranges, status fields and lists reject invalid input without inferring missing dates", () => {
  assert.deepEqual(
    parseMilestoneHeading("April 28–May 2, 2025 — Synthetic range"),
    { start: "2025-04-28", end: "2025-05-02", title: "Synthetic range" },
  );
  assert.equal(validProgressDate("2025-02-29"), false);
  assert.equal(validProgressDate("2024-02-29"), true);
  assert.throws(() =>
    validateDetails({
      event_date: "2025-02-05",
      event_end_date: "2025-02-01",
      progress: { type: "milestone" },
    }),
  );
  assert.throws(() =>
    validateDetails({
      event_date: "2025-02-30",
      progress: { type: "milestone" },
    }),
  );
  assert.throws(() => validateDetails({ progress: { status: "fabricated" } }));
  assert.throws(() => validateDetails({ progress: { tasks: [123] } }));
  assert.throws(() =>
    buildProgressBundle(
      source.replace("As of January 31, 2025", "Source date unknown"),
    ),
  );
  assert.throws(() => buildProgressBundle("Unrelated document"));
});
