/** Local preparation of an owner-supplied progress brief. No private timeline is embedded here. */
import {
  validateBundle,
  type ImportBundle,
  type ImportItem,
} from "./project-content";
import { type ProgressDetails, type ProgressStatus } from "./progress";
const plain = (s: string) => s.replace(/\*\*/g, "").trim();
function section(text: string, name: string) {
  const lines = text.split(/\r?\n/),
    at = lines.findIndex(
      (l) =>
        /^###\s/.test(l) &&
        plain(l.replace(/^###\s*(?:[A-Z]\.\s*)?/, "")).startsWith(name),
    );
  if (at < 0) return "";
  let end = at + 1;
  while (end < lines.length && !/^#{1,3}\s/.test(lines[end])) end++;
  return lines
    .slice(at + 1, end)
    .join("\n")
    .trim();
}
function bullets(text: string) {
  return text
    .split(/\r?\n/)
    .filter((l) => /^\s*-\s/.test(l))
    .map((l) => plain(l.replace(/^\s*-\s*/, "")));
}
function field(text: string, name: string) {
  return plain(
    text.match(new RegExp(`^-\\s*${name}:\\s*(.+)$`, "mi"))?.[1] || "",
  );
}
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function iso(month: string, day: string, year: string) {
  const m =
    months.findIndex((v) => v.toLowerCase() === month.toLowerCase()) + 1;
  if (!m) throw new Error("Unrecognized milestone month.");
  return `${year}-${String(m).padStart(2, "0")}-${day.padStart(2, "0")}`;
}
export function parseMilestoneHeading(value: string) {
  const match = plain(value).match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:\s*[–-]\s*(?:([A-Za-z]+)\s+)?(\d{1,2}))?,\s*(\d{4})\s+—\s+(.+)$/,
  );
  if (!match)
    throw new Error(
      "Milestone headings need a month/day or date range, year, and title separated by —.",
    );
  return {
    start: iso(match[1], match[2], match[5]),
    end: iso(match[3] || match[1], match[4] || match[2], match[5]),
    title: match[6],
  };
}
export function inferProgressStatus(value: string): ProgressStatus {
  if (/^Completed\b/i.test(value.trim())) return "completed";
  if (/not yet|pending|awaiting|not.*verified/i.test(value)) return "pending";
  if (/future|planned/i.test(value)) return "planned";
  if (/in progress|ongoing|underway|continues|refinement/i.test(value))
    return "in-progress";
  if (/preliminary/i.test(value)) return "preliminary";
  if (/completed|developed|revised/i.test(value)) return "completed";
  return "pending";
}
function narrative(value: string) {
  return value
    .split(/\r?\n/)
    .filter((line) => !/^\s*Status:/i.test(line))
    .join("\n")
    .split(/\n\s*\n/)
    .map(plain)
    .filter(
      (p) => p && !/^(?:Create |Status:|Use |Do not |As of |Display:)/i.test(p),
    )
    .map((p) =>
      p
        .replace(/^The team /, "Our team ")
        .replace(/^Clearly identify this as /, "This is ")
        .replace(/^Explain that (.)/, (_, c: string) => c.toUpperCase()),
    )
    .join("\n\n");
}
function challengeReason(label: string) {
  if (/space|instrumentation|maintenance/i.test(label))
    return "Clearances and access must accommodate sensors, inspection, and component replacement.";
  if (/vertical loading/i.test(label))
    return "Representative loads establish actuator demand and the reactions that the structure must support.";
  if (/primary suspension/i.test(label))
    return "Spring geometry and load paths determine how the actual suspension can be represented in the fixture.";
  if (/rotating drive|structural support/i.test(label))
    return "Drive alignment and structural reactions must be resolved together before detailed sizing.";
  if (/bearing|bogie/i.test(label))
    return "Verified component interfaces are needed to define fixture geometry and compatibility.";
  return "Reviewed design selections provide a stable basis for detailed analysis, drawings, and fabrication.";
}
export function isProgressBrief(text: string) {
  return Boolean(
    section(text, "Project Timeline") &&
    section(text, "Current Project Status"),
  );
}
export function buildProgressBundle(text: string): ImportBundle {
  if (text.length > 250000 || !isProgressBrief(text))
    throw new Error(
      "Load the progress brief with Current Project Status and Project Timeline headings, or a reviewed PBT JSON bundle.",
    );
  const dated = text.match(/As of ([A-Za-z]+) (\d{1,2}),? (\d{4})/i);
  if (!dated)
    throw new Error(
      "Include the source's explicit as-of date; the importer does not infer today's status.",
    );
  const asOf = iso(dated[1], dated[2], dated[3]);
  const team = plain(text.match(/^Team:\s*(.+)$/im)?.[1] || "");
  const entries: ImportItem[] = [];
  function add(
    key: string,
    title: string,
    summary: string,
    body: string,
    progress: ProgressDetails,
    locator: string,
    start?: string,
    end?: string,
    stage?: string,
  ) {
    const state =
      progress.status === "in-progress"
        ? "preliminary"
        : progress.status || "pending";
    entries.push({
      import_key: `pbt:progress:${key}`,
      kind: ["milestone", "bogie"].includes(progress.type || "")
        ? "update"
        : "project",
      section: "progress",
      title,
      summary: summary.slice(0, 1000),
      body,
      organization: team,
      category: "Project progress",
      review_state: state,
      details: {
        progress: { ...progress, as_of: asOf },
        ...(start ? { event_date: start } : {}),
        ...(end ? { event_end_date: end } : {}),
        ...(stage ? { stage } : {}),
      },
      provenance: [
        {
          document: "Project owner progress brief",
          date: asOf,
          locator,
          availability: "provided",
          priority: "current",
        },
      ],
      sources: [],
      specs: {},
      tags: ["Progress brief", "Source-document review pending"],
      status: "draft",
      visibility: "team",
      demo: false,
    });
  }
  const summary = section(text, "Current Project Status");
  const phase = field(summary, "Current phase"),
    focus = field(summary, "Current focus"),
    objective = field(summary, "Project objective"),
    next = field(summary, "Next major milestone");
  if (!phase || !objective || !focus || !next)
    throw new Error(
      "The current-status summary needs phase, objective, focus, and next major milestone.",
    );
  add(
    "current-status",
    plain(
      summary.match(/^\*\*([^\n]+)\*\*$/m)?.[1] ||
        "Project development progress",
    ),
    objective,
    `Concept development and preliminary embodiment remain active. ${focus} ${next}`,
    {
      type: "summary",
      status: "in-progress",
      term: field(summary, "Academic term"),
      objective,
      focus,
      next_milestone: next,
    },
    "Current Project Status",
    undefined,
    undefined,
    phase,
  );
  const timeline = section(text, "Project Timeline");
  const blocks = [
    ...timeline.matchAll(
      /^\*\*([^\n]+)\*\*\s*\n([\s\S]*?)(?=^\*\*[^\n]+\*\*\s*$|$(?![\s\S]))/gm,
    ),
  ];
  if (!blocks.length)
    throw new Error(
      "No dated milestone cards were found in the progress brief.",
    );
  for (const block of blocks) {
    const date = parseMilestoneHeading(block[1]),
      statusText =
        block[2].match(/^Status:\s*(.+)$/im)?.[1] || "Pending confirmation";
    const body = narrative(block[2]);
    const paragraphs = body.split(/\n\s*\n/).filter(Boolean);
    add(
      `milestone:${date.start}`,
      date.title,
      paragraphs[0] || "",
      body,
      {
        type: "milestone",
        status: inferProgressStatus(statusText),
        accomplishments: paragraphs
          .flatMap((p) => p.split(/(?<=[.!?])\s+/))
          .slice(0, 5),
      },
      `Project Timeline — ${plain(block[1])}`,
      date.start,
      date.end,
    );
  }
  const bogie = narrative(section(text, "Recent Development"));
  if (bogie)
    add(
      `bogie:${asOf}`,
      "Passenger bogie — technical information and delivery pending",
      "Availability has been indicated; configuration and delivery details still require confirmation.",
      bogie,
      { type: "bogie", status: "pending" },
      "Recent Development — Passenger Bogie",
    );
  const activities = bullets(
    section(text, "Engineering Development Progress"),
  ).map((value) => {
    const [label, ...notes] = value.split(/\s+—\s+/);
    const note = notes.join(" — ");
    return { label, note, status: inferProgressStatus(note) };
  });
  if (activities.length)
    add(
      "engineering-activities",
      "Engineering Development Progress",
      "Completed foundations, active design work, and future phases are tracked separately.",
      "Statuses reflect the owner update, not independent verification of the source files. Preliminary design is distinct from purchased, assembled, or tested hardware.",
      { type: "engineering", status: "in-progress", activities },
      "Engineering Development Progress",
    );
  const challenges = section(text, "Current Challenges")
    .split(/\r?\n/)
    .filter((l) => /^\d+\.\s/.test(l))
    .map((l) => {
      const label = plain(l.replace(/^\d+\.\s*/, ""));
      return { label, reason: challengeReason(label) };
    });
  if (challenges.length)
    add(
      "design-challenges",
      "Current Design Challenges",
      "Resolve component interfaces, loading, and access requirements as the design develops.",
      "These are normal engineering dependencies. Confirmed inputs and reviewed selections are needed before detailed analysis and fabrication.",
      { type: "challenges", status: "in-progress", challenges },
      "Current Challenges and Design Considerations",
    );
  const tasks = bullets(section(text, "Next Steps"));
  if (tasks.length)
    add(
      "next-steps",
      "Next Steps",
      "Planned engineering tasks; no completion is implied.",
      "Task order and scope remain editable as verified bogie information and design decisions become available.",
      { type: "next-steps", status: "planned", tasks },
      "Next Steps",
    );
  const completed = entries.filter(
    (e) =>
      e.details?.progress?.type === "milestone" &&
      e.details.progress.status === "completed",
  );
  entries[0].body =
    (completed.length
      ? `Completed foundations include ${completed.map((e) => e.title).join("; ")}.`
      : "No completed milestone is inferred without an explicit source status.") +
    "\n\n" +
    `Current work focuses on ${focus.charAt(0).toLowerCase() + focus.slice(1)} ` +
    "Detailed development remains ongoing; a concept demonstration does not establish an operational or validated tester.";
  const bundle: ImportBundle = {
    format: "pbt-private-drafts-v1",
    title: "Project progress review drafts",
    source_date: asOf,
    entries,
    warnings: [
      "Only the owner progress brief was processed. The three named engineering files were not supplied to this importer; original pages, figures, and dates still need review.",
      "Statuses are frozen to the explicit source as-of date. Future dates do not automatically become completed milestones.",
      "All records are team-only drafts. Stable import keys skip reruns and preserve administrator edits/deletions. Existing overlapping records are not merged or replaced.",
    ],
  };
  validateBundle(bundle);
  return bundle;
}
