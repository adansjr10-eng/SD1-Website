import type { Entry } from "./data";

export type TeamVideoDetails = {
  enabled: boolean;
  url?: string;
  subtitle?: string;
  thumbnail_id?: string;
};
export const videoSection = "introduction-video";
export const videoDefaults = {
  heading: "Meet Sixth Gear",
  subtitle: "Project Introduction Video",
  description:
    "Get to know Team 15 — Sixth Gear and learn about our senior design project to develop a passenger bearing tester for railway research at UTRGV.",
};

/** Accept known YouTube URL shapes only. Never reuse a supplied iframe URL or query string. */
export function youtubeId(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return;
    let id: string | undefined;
    if (["youtu.be", "www.youtu.be"].includes(url.hostname)) {
      id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      if (
        url.pathname === "/watch" &&
        url.searchParams.getAll("v").length === 1
      )
        id = url.searchParams.get("v") || undefined;
      else
        id = url.pathname.match(
          /^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})\/?$/,
        )?.[1];
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : undefined;
  } catch {
    return;
  }
}

export function validateTeamVideo(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Video settings must be an object.");
  const v = value as TeamVideoDetails;
  if (typeof v.enabled !== "boolean")
    throw new Error("Choose whether the video section is enabled.");
  if (
    v.url !== undefined &&
    (typeof v.url !== "string" || (v.url.trim() && !youtubeId(v.url)))
  )
    throw new Error(
      "Use a valid HTTPS YouTube watch, youtu.be, Shorts, or YouTube embed link, or leave it blank.",
    );
  if (
    v.subtitle !== undefined &&
    (typeof v.subtitle !== "string" || v.subtitle.length > 180)
  )
    throw new Error(
      "The video subtitle must be text of at most 180 characters.",
    );
  if (
    v.thumbnail_id !== undefined &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      v.thumbnail_id,
    )
  )
    throw new Error("Choose a thumbnail from the uploaded resource library.");
}

export function isTeamVideo(entry: Entry) {
  return (
    entry.kind === "project" &&
    entry.section === videoSection &&
    Boolean(entry.details?.team_video)
  );
}

/** Inputs are RLS-filtered. Public/viewer rendering additionally excludes every draft. */
export function teamVideoEntry(entries: Entry[], editable = false) {
  const candidates = entries.filter((e) => isTeamVideo(e) && !e.demo);
  const newest = (rows: Entry[]) =>
    rows.sort(
      (a, b) =>
        b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id),
    )[0];
  return (
    (editable && newest(candidates.filter((e) => e.status === "draft"))) ||
    newest(candidates.filter((e) => e.status === "published")) ||
    undefined
  );
}

/** Editing published settings starts a separate draft and leaves the live version untouched. */
export function teamVideoDraft(entries: Entry[], source?: Entry): Entry {
  const existing = teamVideoEntry(entries, true);
  if (existing?.status === "draft") return structuredClone(existing);
  const base = source || existing;
  if (base)
    return {
      ...structuredClone(base),
      id: "",
      status: "draft",
      updated_at: new Date().toISOString(),
    };
  return {
    id: "",
    kind: "project",
    section: videoSection,
    title: videoDefaults.heading,
    summary: videoDefaults.description,
    organization: "Team 15 — Sixth Gear",
    category: "Project introduction video",
    body: "",
    specs: {},
    tags: [],
    sources: [],
    status: "draft",
    visibility: "team",
    demo: false,
    updated_at: new Date().toISOString(),
    review_state: "preliminary",
    provenance: [
      {
        document: "PBT website owner request",
        locator: "Team introduction video section",
        date: "",
        availability: "provided",
      },
    ],
    details: {
      team_video: { enabled: true, subtitle: videoDefaults.subtitle },
    },
  };
}
