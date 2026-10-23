/** Prepare the owner's Home/Overview brief locally; no private brief/profile list is embedded. */
import {
  validateBundle,
  type ImportBundle,
  type ImportItem,
  type ProjectDetails,
} from "./project-content";
const plain = (s: string) =>
  s.replace(/\*\*/g, "").replace(/^"|"$/g, "").trim();
function section(text: string, title: string) {
  const lines = text.split(/\r?\n/),
    at = lines.findIndex(
      (l) => /^###\s+Section\s+[A-Z]\s+[—–-]\s+/.test(l) && l.includes(title),
    );
  if (at < 0) return "";
  let end = at + 1;
  while (end < lines.length && !/^#{1,3}\s/.test(lines[end])) end++;
  return lines
    .slice(at + 1, end)
    .join("\n")
    .trim();
}
function quoted(text: string) {
  return text.match(/^"([^\n]+)"\s*$/m)?.[1] || "";
}
function bullets(text: string) {
  return text
    .split(/\r?\n/)
    .filter((l) => /^\s*-\s/.test(l))
    .map((l) => plain(l.replace(/^\s*-\s*/, "")));
}
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
export function isPresentationBrief(text: string) {
  return Boolean(
    section(text, "Project Introduction") && section(text, "Meet Sixth Gear"),
  );
}
export function buildPresentationBundle(text: string): ImportBundle {
  if (text.length > 250000 || !isPresentationBrief(text))
    throw new Error(
      "Load the Home/Project Overview brief with its Section A–H headings, or a reviewed JSON bundle.",
    );
  const project = plain(text.match(/^Project:\s*(.+)$/im)?.[1] || ""),
    team = plain(text.match(/^Team:\s*(.+)$/im)?.[1] || "");
  const homePart = text.split(/## 2\./)[1]?.split(/## 3\./)[0] || "";
  const home = quoted(homePart),
    intro = quoted(section(text, "Project Introduction"));
  if (!project || !home || !intro)
    throw new Error(
      "The brief needs a project title and the quoted Home and Project Introduction descriptions.",
    );
  const entries: ImportItem[] = [];
  function add(
    key: string,
    title: string,
    section: string,
    summary: string,
    body: string,
    details: ProjectDetails,
    locator: string,
  ) {
    entries.push({
      import_key: `pbt:presentation:${key}`,
      kind: "project",
      section,
      title,
      summary: summary.slice(0, 1000),
      body,
      details,
      organization: team,
      category: section === "team" ? "Team profiles" : "Project presentation",
      review_state: "preliminary",
      provenance: [
        {
          document: "Project owner Home/Overview brief",
          date: "",
          locator,
          availability: "provided",
          priority: "current",
        },
      ],
      sources: [],
      specs: {},
      tags: ["Owner-provided", "Source review pending"],
      status: "draft",
      visibility: "team",
      demo: false,
    });
  }
  add(
    "home",
    project,
    "home",
    home,
    "A short introduction to the proposed project; this does not describe a fabricated or validated system.",
    { presentation: { kind: "home" } },
    "Home Page — Hero Section",
  );
  const why = section(text, "Why This Project Matters");
  const whyIntro =
    why.split("Explain:")[1]?.split("Use three")[0]?.trim() || "";
  const cards = [...why.matchAll(/^\*\*([^\n]+)\*\*\s*\n([^\n]+)$/gm)].map(
    (m) => ({ title: plain(m[1]), text: plain(m[2]) }),
  );
  const functions = bullets(section(text, "Our Proposed Tester"));
  const objectives = section(text, "Project Objectives")
    .split(/\r?\n/)
    .filter((l) => /^\d+\.\s/.test(l))
    .map((l) => plain(l.replace(/^\d+\.\s*/, "")));
  const bogie = section(text, "Passenger Bogie Reference");
  add(
    "overview",
    project,
    "overview",
    intro,
    intro,
    {
      presentation: {
        kind: "overview",
        why_intro: whyIntro,
        why_cards: cards,
        bogie_caption: plain(
          bogie.match(/^\*\*([^\n]+)\*\*$/m)?.[1] ||
            "Passenger Bogie Reference — Bearing and Primary Suspension Arrangement",
        ),
        bogie_note: quoted(bogie),
        gallery_image_ids: [],
        featured_update_ids: [],
      },
      functions,
      objectives,
    },
    "Project Introduction; Why This Project Matters; Our Proposed Tester; Project Objectives; Passenger Bogie Reference",
  );
  const teamSection = section(text, "Meet Sixth Gear");
  const names =
    teamSection.split("Team members:")[1]?.split("Each card")[0] || "";
  const members = names
    .split(/\r?\n/)
    .filter((l) => /^\d+\.\s/.test(l))
    .map((l) => plain(l.replace(/^\d+\.\s*/, "")));
  for (const [i, name] of members.entries())
    add(
      `profile:${slug(name)}`,
      name,
      "team",
      "",
      "",
      { profile: { group: "member", role: "", biography: "", order: i } },
      "Meet Sixth Gear — Team members",
    );
  const advisorPart = teamSection.split("Faculty and Course Advisors")[1] || "";
  for (const [i, line] of bullets(advisorPart).entries()) {
    const [name, ...role] = line.split(/\s+—\s+/);
    if (!role.length) continue;
    add(
      `profile:${slug(name)}`,
      name,
      "team",
      "",
      role.join(" — "),
      {
        profile: {
          group: "advisor",
          role: role.join(" — "),
          order: members.length + i,
        },
      },
      "Faculty and Course Advisors",
    );
  }
  if (!members.length)
    throw new Error(
      "No team-member names were found in the supplied directory.",
    );
  const bundle: ImportBundle = {
    format: "pbt-private-drafts-v1",
    title: "Home, Overview & team review drafts",
    source_date: "",
    entries,
    warnings: [
      "Only the pasted owner brief has been processed. The PowerPoint, two PDFs, and bogie image were unavailable; no original pages or images are claimed.",
      "No profile photos, invented student roles/biographies, external profiles, or progress duplicates are included. Existing published progress records supply the timeline previews.",
      "All imports are team-only drafts. Stable keys skip reruns and preserve existing administrator edits and records. Review and publish deliberately.",
    ],
  };
  validateBundle(bundle);
  return bundle;
}
