import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPresentationBundle } from "../lib/presentation-import";
import {
  approvedImage,
  featuredProgress,
  profileEntries,
  presentationEntry,
  linkedinUrl,
  initials,
} from "../lib/presentation";
import { validateDetails, validateBundle } from "../lib/project-content";
import type { Entry, Resource } from "../lib/data";
const source = readFileSync("tests/fixtures/presentation-brief.md", "utf8");
const uuid = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
function entry(): Entry {
  return {
    ...buildPresentationBundle(source).entries[1],
    id: uuid,
    updated_at: "2025-01-01T00:00:00Z",
    status: "published",
    visibility: "public",
  };
}
function image(): Resource {
  return {
    id: other,
    entry_id: uuid,
    name: "fixture.png",
    caption: "Synthetic image",
    category: "",
    tags: [],
    path: `${uuid}/fixture.png`,
    mime: "image/png",
    size: 100,
    status: "published",
    visibility: "public",
    created_at: "2025-01-01",
    rights: "team-owned",
  };
}
test("presentation preparation is private/repeatable and leaves unsupported personal details and progress untouched", () => {
  const a = buildPresentationBundle(source);
  validateBundle(a);
  assert.deepEqual(a, buildPresentationBundle(source));
  assert.equal(a.entries.length, 11);
  assert.ok(
    a.entries.every(
      (e) =>
        e.status === "draft" &&
        e.visibility === "team" &&
        e.provenance?.[0].document === "Project owner Home/Overview brief",
    ),
  );
  const members = a.entries.filter(
    (e) => e.details?.profile?.group === "member",
  );
  assert.equal(members.length, 6);
  assert.ok(
    members.every(
      (e) =>
        !e.details?.profile?.photo_id &&
        !e.details?.profile?.role &&
        !e.details?.profile?.biography &&
        !e.details?.profile?.linkedin,
    ),
  );
  assert.equal(
    a.entries.filter((e) => e.details?.profile?.group === "advisor").length,
    3,
  );
  assert.equal(a.entries[1].details?.objectives?.length, 6);
  assert.equal(a.entries[1].details?.presentation?.why_cards?.length, 3);
  assert.ok(a.entries.every((e) => e.section !== "progress"));
  assert.throws(() => buildPresentationBundle("Unrelated source"));
});
test("presentation images require approved rights, an eligible parent, and profile ownership", () => {
  const e = entry(),
    r = image();
  assert.equal(approvedImage(r.id, [r], [e])?.id, r.id);
  assert.equal(
    approvedImage(r.id, [{ ...r, rights: "review-required" }], [e]),
    undefined,
  );
  assert.equal(
    approvedImage(r.id, [{ ...r, status: "draft" }], [e]),
    undefined,
  );
  assert.equal(
    approvedImage(r.id, [r], [{ ...e, status: "draft" }]),
    undefined,
  );
  assert.equal(approvedImage(r.id, [r], []), undefined);
  assert.equal(
    approvedImage(r.id, [r], [e], true, "33333333-3333-4333-8333-333333333333"),
    undefined,
  );
  assert.equal(
    approvedImage(r.id, [{ ...r, mime: "image/svg+xml" }], [e]),
    undefined,
  );
  assert.equal(
    approvedImage(
      r.id,
      [{ ...r, status: "draft" }],
      [{ ...e, status: "draft" }],
      true,
      e.id,
    )?.id,
    r.id,
  );
});
test("published progress selection excludes drafts, archives, and non-milestone records without duplicating them", () => {
  const e = {
    ...entry(),
    kind: "update" as const,
    section: "progress",
    details: {
      event_date: "2025-01-01",
      progress: { type: "milestone" as const, status: "in-progress" as const },
    },
  };
  const draft = { ...e, id: other, status: "draft" as const };
  assert.deepEqual(
    featuredProgress([draft, e]).map((e) => e.id),
    [uuid],
  );
  assert.equal(featuredProgress([e], [other]).length, 0);
  assert.equal(
    featuredProgress([
      { ...e, details: { progress: { type: "milestone", archived: true } } },
    ]).length,
    0,
  );
  assert.equal(
    featuredProgress([{ ...e, details: { progress: { type: "summary" } } }])
      .length,
    0,
  );
  assert.equal(presentationEntry([entry()], "overview")?.id, uuid);
  assert.equal(
    presentationEntry([{ ...entry(), status: "draft" }], "overview"),
    undefined,
  );
  const profiles = buildPresentationBundle(source)
    .entries.filter((e) => e.details?.profile)
    .map((e, i) => ({ ...e, id: String(i), updated_at: "" }));
  assert.equal(profileEntries(profiles).length, 0);
  assert.equal(profileEntries(profiles, true).length, 9);
});
test("profile and page validation refuse unsafe URLs, arbitrary image URLs, and excessive selections", () => {
  assert.equal(initials("Avery Fixture"), "AF");
  assert.equal(linkedinUrl("javascript:alert(1)"), "");
  assert.equal(linkedinUrl("https://linkedin.com.attacker.test/profile"), "");
  assert.equal(
    linkedinUrl("https://www.linkedin.com/in/synthetic-fixture"),
    "https://www.linkedin.com/in/synthetic-fixture",
  );
  assert.throws(() =>
    validateDetails({
      profile: { group: "member", linkedin: "http://linkedin.com/profile" },
    }),
  );
  assert.throws(() =>
    validateDetails({
      profile: {
        group: "member",
        photo_id: "https://untrusted.test/photo.png",
      },
    }),
  );
  assert.throws(() =>
    validateDetails({
      presentation: { kind: "overview", hero_image_id: "javascript:alert(1)" },
    }),
  );
  assert.throws(() =>
    validateDetails({
      presentation: { kind: "overview", gallery_image_ids: [uuid, uuid] },
    }),
  );
  assert.throws(() =>
    validateDetails({
      presentation: {
        kind: "overview",
        featured_update_ids: [
          uuid,
          other,
          "33333333-3333-4333-8333-333333333333",
          "44444444-4444-4444-8444-444444444444",
          "55555555-5555-4555-8555-555555555555",
        ],
      },
    }),
  );
});
