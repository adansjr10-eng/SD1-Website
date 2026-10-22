/** Transforms owner-supplied text locally. No project brief, names, or procurement data are embedded in the app bundle. */
import type { Kind } from "./data";
import {
  designTopics,
  validateBundle,
  type ImportBundle,
  type ImportItem,
  type ProjectDetails,
  type Citation,
  type ReviewState,
} from "./project-content";
const plain = (s: string) => s.replace(/\*\*/g, "").trim();
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
function block(text: string, heading: string) {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex(
    (l) => /^#{1,6}\s/.test(l) && plain(l.replace(/^#+\s*/, "")) === heading,
  );
  if (at < 0) return "";
  const level = lines[at].match(/^#+/)![0].length;
  let end = at + 1;
  while (end < lines.length) {
    const match = lines[end].match(/^(#+)\s/);
    if (match && match[1].length <= level) break;
    end++;
  }
  return lines
    .slice(at + 1, end)
    .join("\n")
    .trim();
}
function bullets(s: string) {
  return s
    .split("\n")
    .filter((l) => /^\s*[-*]\s/.test(l))
    .map((l) => plain(l.replace(/^\s*[-*]\s+/, "")));
}
function labeled(text: string, label: string) {
  return plain(
    text.match(
      new RegExp(`(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*([^\\n]+)`, "i"),
    )?.[1] || "",
  );
}
const pending =
  "Source-document extraction is pending. No source-backed dimensions, ratings, results, or finalized design decisions have been imported.";
export function buildBriefBundle(text: string): ImportBundle {
  if (text.length > 250000)
    throw new Error("Use a brief no larger than 250,000 characters.");
  const title = labeled(text, "Project title");
  const team = plain(
    text.match(/website is for\s+\*\*([^*]+)\*\*/i)?.[1] || "",
  );
  if (!title || !block(text, "Current Design Direction"))
    throw new Error(
      "This importer expects the project brief with Project title and Current Design Direction headings. You can also load a reviewed PBT JSON bundle.",
    );
  const sourceDate = /October\s+2026/i.test(text) ? "2026-10" : "";
  const source = (locator: string): Citation[] => [
    {
      document: "Project owner brief",
      date: sourceDate,
      locator,
      availability: "provided",
      priority: "current",
    },
  ];
  const entries: ImportItem[] = [];
  const add = (
    key: string,
    kind: Kind,
    section: string,
    name: string,
    summary: string,
    body: string,
    state: ReviewState,
    locator: string,
    details: ProjectDetails = {},
  ) => {
    entries.push({
      import_key: "pbt:" + key,
      kind,
      section,
      title: name,
      summary: summary.slice(0, 1000),
      body,
      review_state: state,
      provenance: source(locator),
      details,
      organization: team,
      category: section,
      tags: ["Owner-provided", "Awaiting source review"],
      specs: {},
      sources: [],
      status: "draft",
      visibility: "team",
      demo: false,
    });
  };
  const overview = block(text, "Project Overview");
  const direction = bullets(block(text, "Current Design Direction"));
  const candidates = bullets(block(text, "Preliminary Component Choices"));
  const problem = labeled(overview, "Problem"),
    objective = labeled(overview, "Objective"),
    approach = labeled(overview, "Engineering approach"),
    outcome = labeled(overview, "Expected outcome");
  add(
    "project-overview",
    "project",
    "overview",
    title,
    objective,
    [
      ["Problem identification", problem],
      ["Project objective", objective],
      ["Engineering approach", approach],
      ["Expected outcome", outcome],
    ]
      .map(([h, b]) => `## ${h}\n${b || pending}`)
      .join("\n\n") +
      "\n\n## Scope and limitations\nThis owner-provided direction is not a final design. Component geometry, load requirements, and delivery details need technical confirmation.\n\n## Production opportunity gap, value proposition, and stakeholders\n" +
      pending,
    "preliminary",
    "Project Overview",
    {
      objectives: objective ? [objective] : [],
      stage: "Preliminary direction; technical confirmation pending",
    },
  );
  add(
    "project-direction",
    "project",
    "engineering",
    "Current design direction",
    "Owner-provided working architecture; not a finalized design.",
    direction.map((x) => "- " + x).join("\n") + "\n\n" + pending,
    "preliminary",
    "Current Design Direction",
    {
      rows: direction.map((label) => ({
        label,
        value: "Working direction; verification pending",
        state: "preliminary",
      })),
    },
  );
  for (const topic of designTopics) {
    let body = pending,
      details: ProjectDetails = {},
      state: ReviewState = "planned";
    if (topic === "Design specifications") {
      body =
        "## Preliminary requirements\n" +
        direction.map((x) => "- " + x).join("\n") +
        "\n\nThe exact bearing class, geometry, load envelope, suspension layout, and verified speed requirement are pending technical confirmation.";
      state = "preliminary";
      details = {
        rows: [
          ...direction.map((label) => ({
            label,
            value: "Preliminary working direction",
            state: "preliminary" as const,
          })),
          ...[
            "Bogie model",
            "Bearing class",
            "Dimensions",
            "Primary suspension arrangement",
            "Load requirements",
            "Delivery schedule",
          ].map((label) => ({
            label,
            value: "Pending technical confirmation",
            state: "pending" as const,
          })),
        ],
      };
    }
    if (topic === "Functional decomposition") {
      body =
        "Functions describe WHAT is needed; candidate components describe HOW it might be achieved. This functional map is derived from the owner brief, not an extracted slide figure.";
      details = {
        functions: [
          "Rotate the bearing",
          "Apply vertical load",
          "Support and react loads",
          "Control speed and load",
          "Measure operating response",
          "Provide safe operation",
        ],
      };
      state = "preliminary";
    }
    if (
      topic === "Morphological chart" ||
      topic === "Concept generation" ||
      topic === "Component selection"
    ) {
      body =
        "Candidate solutions are taken from the owner brief. This is a review table, not the team’s original morphological chart or an approved concept evaluation.\n\n" +
        pending;
      details = {
        options: candidates.map((candidate) => ({
          function: /motor|belt|pulley|VFD/i.test(candidate)
            ? "Rotate and control speed"
            : /hydraulic|cylinder/i.test(candidate)
              ? "Apply vertical load"
              : /frame|steel|tubing/i.test(candidate)
                ? "Support and react loads"
                : "Measure and acquire data",
          candidate,
          state: "preliminary",
          reason:
            "Owner-listed candidate; performance, compatibility, and procurement are not finalized.",
        })),
      };
      state = "preliminary";
    }
    if (topic === "Concept evaluation and selection") {
      body =
        "No documented concept scores or final selection have been supplied. Preserve alternatives and evaluation criteria from the midterm slides when available.\n\n" +
        pending;
      state = "pending";
    }
    if (topic === "Preliminary design calculations") {
      body =
        "Use the calculation index to record assumptions, equations, units, source inputs, and review status. No unverified motor power, load, spring stiffness, or dimensions are assigned.";
    }
    if (topic === "CAD drawings and models") {
      body =
        "Attach original CAD files and source-attributed drawings as team-only resources. Do not substitute illustrative website artwork for a documented design.";
    }
    add(
      "engineering-" + slug(topic),
      "project",
      "engineering",
      topic,
      "Editable design record with explicit evidence and review state.",
      body,
      state,
      "Engineering Design; Current Design Direction; Preliminary Component Choices",
      details,
    );
  }
  for (const [heading, kind, section] of [
    ["Passenger Bearing Research", "bearing", "bearings"],
    ["Primary Suspension Research", "suspension", "suspension"],
  ] as const) {
    for (const topic of bullets(block(text, heading)))
      add(
        section + "-" + slug(topic),
        kind,
        section,
        topic,
        "Research topic identified in the owner brief; source content awaits review.",
        pending +
          "\n\nAttach the relevant proposal pages, original citations, and permitted figures before making technical claims.",
        "pending",
        heading,
      );
  }
  const testerBlock = block(text, "Existing Railway Testers");
  const testerNames = bullets(testerBlock);
  for (const name of testerNames) {
    const reference = /configuration reference/i.test(name);
    const category = reference
      ? "Configuration reference"
      : /single-bearing/i.test(name)
        ? "Single-bearing freight tester"
        : /four-bearing/i.test(name)
          ? "Four-bearing freight tester"
          : /spring/i.test(name)
            ? "Bogie / spring testing"
            : /bogie/i.test(name)
              ? "Full-bogie test stand"
              : "Bearing / axlebox endurance rig";
    add(
      "tester-" + slug(name),
      "tester",
      "testers",
      name,
      "Owner-identified research lead. Ratings and original references have not been verified.",
      `## Purpose and classification\n${category}. ${reference ? "This is a configuration reference and must not be presented as a directly comparable single-bearing tester." : "Classification follows the owner-provided system description; confirm it against the proposal and original source."}\n\n## Specifications and design lessons\n${pending}\n\n## References and images\nOriginal citations and reuse permissions must be recovered from the proposal. No manufacturer rating, source URL, or third-party figure has been fabricated.`,
      "pending",
      "Existing Railway Testers",
      {
        rows: [
          {
            label: "System classification",
            value: category,
            state: "preliminary",
          },
          {
            label: "Relevance to PBT",
            value:
              "Evaluate after original specifications and test scope are verified",
            state: "pending",
          },
        ],
      },
    );
    entries.at(-1)!.category = category;
  }
  const acquisition = block(text, "Passenger Bogie Acquisition");
  if (acquisition)
    add(
      "bogie-acquisition",
      "update",
      "progress",
      "Passenger bogie acquisition — technical confirmation pending",
      "Availability has been indicated; model, bearing class, geometry, loading, and delivery are not independently verified.",
      acquisition
        .split("\n\n")
        .filter((p) => !/^Display|^Use the status|^Do not state/.test(p))
        .join("\n\n") +
        "\n\nA delivery or physical-arrival milestone has not been established.",
      "pending",
      "Passenger Bogie Acquisition",
      {
        ...(sourceDate ? { event_date: sourceDate } : {}),
        decisions: [
          {
            date: sourceDate,
            decision: "Availability indicated; technical information requested",
            state: "pending",
            basis:
              "Project owner brief. Not independently verified; no arrival date recorded.",
          },
        ],
      },
    );
  const teamBlock = block(text, "Our Team");
  const memberBlock =
    teamBlock.split(/Team members:/i)[1]?.split(/Faculty Advisor:/i)[0] || "";
  const people = bullets(memberBlock).map((name) => ({
    name,
    role: "Team member",
  }));
  for (const role of [
    "Faculty Advisor",
    "Course Advisor",
    "Course Instructor",
  ]) {
    const name = labeled(teamBlock, role);
    if (name) people.push({ name, role });
  }
  if (people.length)
    add(
      "team-directory",
      "project",
      "team",
      team || "Our Team",
      "Names and roles provided by the project owner; document confirmation pending.",
      "The directory excludes phone numbers, private contact details, and internal schedules. Team logo/photo reuse is pending access and review of the supplied source documents.",
      "pending",
      "Our Team",
      { people },
    );
  const calculationBlock = block(text, "Engineering Calculations");
  for (const topic of bullets(calculationBlock)) {
    const wheel = /Wheel speed to bearing rotational speed/i.test(topic);
    add(
      "calculation-" + slug(topic),
      "research",
      "calculations",
      topic,
      wheel
        ? "Wheel/axle rotational relationship with explicit units and assumptions."
        : "Calculation work item; verified inputs and reviewed results are not yet available.",
      wheel
        ? "## Relationship\nRPM = 1056 × vehicle speed (mph) / [π × wheel diameter (in)]\n\n1056 converts mph to inches per minute. This assumes pure rolling, a known effective wheel diameter, and bearing inner-ring rotation at axle speed. Slip, effective rolling diameter changes, drive ratios, and laboratory control dynamics require separate treatment.\n\nUse measured/source-backed inputs. This kinematic relationship is not a validated test-rig design or motor/load rating."
        : pending +
            "\n\nRecord inputs, their sources and units, assumptions, equations, checks, and a reviewer before assigning a numerical result.",
      wheel ? "preliminary" : "planned",
      "Engineering Calculations",
      wheel ? { calculation: "wheel-rpm" } : {},
    );
  }
  const requirements = block(text, "Engineering Calculations").match(
    /A passenger operating speed[^\n]+/i,
  )?.[0];
  if (requirements)
    entries.find(
      (e) => e.import_key === "pbt:engineering-design-specifications",
    )!.body += "\n\n## Speed consideration\n" + requirements;
  const documents =
    text
      .match(/\d\. (?:SDI[^\n]+|Fall \d{4}[^\n]+)/g)
      ?.map((s) => plain(s.replace(/^\d\.\s*/, ""))) || [];
  add(
    "source-register",
    "research",
    "research",
    "Source document register",
    "Document extraction and source reconciliation are pending.",
    "The owner brief is the only text supplied to the importer. The following original documents were named but not read by this import:\n\n" +
      documents.map((d) => "- " + d).join("\n") +
      "\n\nUse the proposal for baseline purpose and requirements; later explicit decisions supersede earlier proposals. Preserve tracking history without inventing dates. Keep source files team-only until explicitly approved for release.",
    "pending",
    "Review the Existing Website and Documents",
  );
  const bundle: ImportBundle = {
    format: "pbt-private-drafts-v1",
    title,
    source_date: sourceDate,
    entries,
    warnings: [
      "Only the pasted owner brief has been processed. The three source documents and figures were not supplied to this parser.",
      "No manufacturer specifications, concept scores, meeting dates, or final procurement decisions have been inferred.",
      "All records will be team-only drafts. Existing import keys and administrator edits are preserved.",
    ],
  };
  validateBundle(bundle);
  return bundle;
}
