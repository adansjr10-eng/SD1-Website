import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBriefBundle } from "../lib/brief-import";
import {
  validateBundle,
  validateDetails,
  wheelRpm,
  entryHref,
  entrySection,
} from "../lib/project-content";
const brief = `Project title: **Synthetic Engineering Project**
The website is for **Synthetic Test Team**.
### Project Overview
**Problem:** A synthetic problem.
**Objective:** A synthetic objective.
**Engineering approach:** Review evidence.
**Expected outcome:** An engineering record.
### Engineering Design
1. Design specifications
### Current Design Direction
- Controlled bearing rotation
- Hydraulic loading
### Preliminary Component Choices
- Candidate electric motor
- Candidate hydraulic pump
### Existing Railway Testers
- Example bogie test stand
- Example transit systems — configuration reference, not necessarily a tester
### Passenger Bogie Acquisition
Availability was indicated; details have not been verified.
Do not state that the bogie has arrived.
### Engineering Calculations
- Wheel speed to bearing rotational speed
- Motor power and torque
A passenger speed target is preliminary.
### Passenger Bearing Research
- Bearings and axleboxes
### Primary Suspension Research
- Suspension load paths
### Our Team
Team members:
- Synthetic Member
Faculty Advisor: Synthetic Advisor
`;
test("brief transformation is private, sourced, deterministic, and leaves unknown ratings empty", () => {
  const first = buildBriefBundle(brief),
    second = buildBriefBundle(brief);
  validateBundle(first);
  assert.deepEqual(first, second);
  assert.ok(first.entries.length > 15);
  assert.ok(
    first.entries.every(
      (e) =>
        e.status === "draft" &&
        e.visibility === "team" &&
        !e.demo &&
        e.provenance?.length,
    ),
  );
  assert.ok(
    first.entries
      .filter((e) => e.kind === "tester")
      .every((e) => Object.keys(e.specs).length === 0),
  );
  assert.equal(
    first.entries.find((e) => e.section === "team")?.details?.people?.[0].name,
    "Synthetic Member",
  );
  assert.ok(
    first.entries
      .filter((e) => e.kind === "tester")
      .some((e) => e.category === "Configuration reference"),
  );
  assert.ok(
    first.entries.every(
      (e) => !e.provenance?.some((c) => c.document === "Midterm slides"),
    ),
  );
  assert.equal(
    first.entries.find((e) => e.kind === "update")?.details?.event_date,
    undefined,
  );
  assert.ok(first.warnings.some((w) => w.includes("not supplied")));
});
test("import validation rejects public bundles, duplicates, malformed structured data, and unsafe references", () => {
  const good = buildBriefBundle(brief);
  const publicBundle = structuredClone(good);
  publicBundle.entries[0].visibility = "public";
  assert.throws(() => validateBundle(publicBundle));
  const duplicate = structuredClone(good);
  duplicate.entries.push(duplicate.entries[0]);
  assert.throws(() => validateBundle(duplicate));
  assert.throws(() =>
    validateDetails({
      rows: [{ label: "Load", value: "Unknown", state: "final" }],
    }),
  );
  const bad = structuredClone(good);
  bad.entries[0].provenance![0].url = "javascript:alert(1)";
  assert.throws(() => validateBundle(bad));
  assert.throws(() => buildBriefBundle("An unrelated document"));
});
test("RPM calculator validates source inputs and implements the stated kinematic relationship", () => {
  assert.equal(wheelRpm(0, 36), 0);
  assert.ok(Math.abs(wheelRpm(60, 36) - 560.2253997) < 0.0001);
  assert.throws(() => wheelRpm(60, 0));
  assert.throws(() => wheelRpm(-1, 36));
  assert.throws(() => wheelRpm(60, NaN));
  const entry = buildBriefBundle(brief).entries.find(
    (e) => e.section === "calculations",
  )!;
  assert.ok(entry.details?.calculation === "wheel-rpm");
  assert.equal(
    entrySection({ ...entry, id: "abc", updated_at: "" }),
    "calculations",
  );
  assert.equal(
    entryHref({ ...entry, id: "abc", updated_at: "" }),
    "/calculations/abc",
  );
});
