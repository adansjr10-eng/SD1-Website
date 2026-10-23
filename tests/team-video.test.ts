import { test } from "node:test";
import assert from "node:assert/strict";
import {
  youtubeId,
  teamVideoEntry,
  teamVideoDraft,
  isTeamVideo,
} from "../lib/team-video";
import { validateDetails } from "../lib/project-content";
import type { Entry } from "../lib/data";

const id = "AbCdEfGhI_1";
test("YouTube input supports common links and rejects unsafe hosts, credentials, protocols, and malformed IDs", () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${id}&t=15&autoplay=1`,
    `https://youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=ignored`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    ` https://youtu.be/${id} `,
  ])
    assert.equal(youtubeId(url), id);
  for (const value of [
    undefined,
    123,
    {},
    "",
    id,
    "not a URL",
    "javascript:alert(1)",
    `http://youtube.com/watch?v=${id}`,
    `https://youtube.com.evil.test/watch?v=${id}`,
    `https://evil.test/shorts/${id}`,
    `https://youtube.com@evil.test/watch?v=${id}`,
    `https://evil.test@youtube.com/watch?v=${id}`,
    `https://youtube.com:444/watch?v=${id}`,
    `https://youtu.be/${id}/extra`,
    `https://youtube.com/watch?v=${id}&v=QwErTyUiO_2`,
    `https://youtube.com/watch?v=${id}<script>`,
    "https://youtube.com/watch?v=short",
    `<iframe src="https://youtube.com/embed/${id}"></iframe>`,
  ])
    assert.equal(youtubeId(value), undefined, String(value));
});

test("video settings are validated by the existing entry validator before persistence", () => {
  validateDetails({ team_video: { enabled: true, url: "" } });
  validateDetails({
    team_video: {
      enabled: false,
      url: `https://youtu.be/${id}`,
      subtitle: "Team introduction",
    },
  });
  for (const team_video of [
    null,
    [],
    { enabled: "yes" },
    { enabled: true, url: "https://evil.test/video" },
    { enabled: false, url: "javascript:alert(1)" },
    { enabled: true, subtitle: 12 },
    { enabled: true, subtitle: "a".repeat(181) },
    { enabled: true, thumbnail_id: "https://evil.test/photo.png" },
  ])
    assert.throws(() => validateDetails({ team_video }));
});

test("published video selection cannot expose newer drafts or demo records and honors a published disable", () => {
  const published: Entry = {
    ...teamVideoDraft([]),
    id: "published",
    status: "published",
    visibility: "public",
    updated_at: "2026-10-01",
  };
  const draft: Entry = {
    ...published,
    id: "draft",
    status: "draft",
    updated_at: "2026-10-03",
    title: "Private changes",
  };
  const disabled: Entry = {
    ...published,
    id: "disabled",
    updated_at: "2026-10-02",
    details: { team_video: { enabled: false } },
  };
  const rows = [
    published,
    draft,
    disabled,
    { ...draft, demo: true, status: "published" as const },
  ];
  assert.equal(teamVideoEntry(rows)?.id, "disabled");
  assert.equal(teamVideoEntry(rows)?.details?.team_video?.enabled, false);
  assert.equal(teamVideoEntry(rows, true)?.id, "draft");
  assert.equal(teamVideoEntry([draft]), undefined);
  assert.equal(isTeamVideo({ ...published, section: "overview" }), false);
});

test("editing published video settings creates an isolated draft, preserves live data, and reuses a saved draft", () => {
  const published: Entry = {
    ...teamVideoDraft([]),
    id: "published",
    status: "published",
    visibility: "public",
  };
  const before = structuredClone(published);
  const draft = teamVideoDraft([published]);
  assert.equal(draft.id, "");
  assert.equal(draft.status, "draft");
  assert.equal(draft.visibility, "public");
  draft.details!.team_video!.enabled = false;
  assert.deepEqual(published, before);
  draft.id = "saved-draft";
  const reopened = teamVideoDraft([published, draft]);
  assert.equal(reopened.id, "saved-draft");
  assert.notEqual(reopened.details, draft.details);
  assert.equal(teamVideoDraft([]).visibility, "team");
});
