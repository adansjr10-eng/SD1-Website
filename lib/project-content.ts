import type { Entry, Kind } from "./data";
import {
  validatePresentation,
  validateProfile,
  type PresentationDetails,
  type ProfileDetails,
} from "./presentation";
import {
  validateProgress,
  validProgressDate,
  type ProgressDetails,
} from "./progress";
export const reviewStates = [
  "confirmed",
  "preliminary",
  "pending",
  "completed",
  "planned",
] as const;
export type ReviewState = (typeof reviewStates)[number];
export const reviewLabels: Record<ReviewState, string> = {
  confirmed: "Confirmed",
  preliminary: "Preliminary",
  pending: "Pending technical confirmation",
  completed: "Completed",
  planned: "Planned",
};
export type Citation = {
  document: string;
  date: string;
  locator: string;
  url?: string;
  availability?: "provided" | "not-provided";
  priority?: "current" | "historical" | "baseline";
};
export type TechnicalRow = { label: string; value: string; state: ReviewState };
export type OptionRow = {
  function: string;
  candidate: string;
  state: ReviewState;
  reason: string;
};
export type ProjectDetails = {
  presentation?: PresentationDetails;
  profile?: ProfileDetails;
  stage?: string;
  objectives?: string[];
  rows?: TechnicalRow[];
  functions?: string[];
  options?: OptionRow[];
  decisions?: {
    date: string;
    decision: string;
    state: ReviewState;
    basis: string;
  }[];
  people?: { name: string; role: string }[];
  event_date?: string;
  event_end_date?: string;
  progress?: ProgressDetails;
  calculation?: "wheel-rpm";
  [key: string]: unknown;
};
export const projectSections = [
  { id: "overview", label: "Project Overview" },
  { id: "home", label: "Home presentation" },
  { id: "engineering", label: "Engineering Design" },
  { id: "bearings", label: "Passenger Bearing Research" },
  { id: "suspension", label: "Primary Suspension Research" },
  { id: "testers", label: "Existing Railway Testers" },
  { id: "progress", label: "Project Progress" },
  { id: "team", label: "Our Team" },
  { id: "calculations", label: "Engineering Calculations" },
];
export const designTopics = [
  "Design specifications",
  "Functional decomposition",
  "Morphological chart",
  "Concept generation",
  "Concept evaluation and selection",
  "Preliminary design calculations",
  "Embodiment design",
  "CAD drawings and models",
  "Component selection",
  "Manufacturing and assembly",
  "Validation and testing",
];
export function entrySection(e: Entry) {
  return (
    e.section ||
    (
      {
        tester: "testers",
        bearing: "bearings",
        suspension: "suspension",
        project: "overview",
        research: "research",
        update: "progress",
      } satisfies Record<Kind, string>
    )[e.kind]
  );
}
export function entryHref(e: Entry) {
  return `/${e.kind === "tester" ? "testers" : e.kind === "bearing" ? "bearings" : e.kind === "suspension" ? "suspension" : e.kind === "update" || e.section === "progress" ? "progress" : e.section === "engineering" ? "engineering" : e.section === "team" ? "team" : e.section === "calculations" ? "calculations" : e.kind === "project" ? "project" : "research"}/${e.id}`;
}
export function wheelRpm(mph: number, diameterInches: number) {
  if (
    !Number.isFinite(mph) ||
    mph < 0 ||
    !Number.isFinite(diameterInches) ||
    diameterInches <= 0
  )
    throw new Error(
      "Use a nonnegative vehicle speed and a positive wheel diameter.",
    );
  return (1056 * mph) / (Math.PI * diameterInches);
}
export type ImportItem = Omit<Entry, "id" | "updated_at"> & {
  import_key: string;
};
export type ImportBundle = {
  format: "pbt-private-drafts-v1";
  title: string;
  source_date: string;
  entries: ImportItem[];
  warnings: string[];
};
const states = new Set<string>(reviewStates);
export function validateDetails(
  value: unknown,
): asserts value is ProjectDetails {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Structured content must be an object.");
  const d = value as ProjectDetails;
  if (d.presentation !== undefined) validatePresentation(d.presentation);
  if (d.profile !== undefined) validateProfile(d.profile);
  if (d.progress !== undefined) validateProgress(d.progress);
  if (
    d.event_end_date !== undefined &&
    (!validProgressDate(d.event_end_date) ||
      !d.event_date ||
      d.event_end_date < d.event_date)
  )
    throw new Error(
      "Use a valid milestone end date on or after its start date.",
    );
  if (
    d.progress &&
    d.event_date !== undefined &&
    !validProgressDate(d.event_date)
  )
    throw new Error("Use a valid milestone start date.");
  if (d.stage !== undefined && typeof d.stage !== "string")
    throw new Error("Development stage must be text.");
  if (
    d.objectives !== undefined &&
    (!Array.isArray(d.objectives) ||
      d.objectives.some((o) => typeof o !== "string"))
  )
    throw new Error("Objectives must be text labels.");
  if (
    d.rows !== undefined &&
    (!Array.isArray(d.rows) ||
      d.rows.some(
        (r) =>
          !r ||
          typeof r.label !== "string" ||
          typeof r.value !== "string" ||
          !states.has(r.state),
      ))
  )
    throw new Error(
      "Each specification row needs a label, value, and valid review state.",
    );
  if (
    d.functions !== undefined &&
    (!Array.isArray(d.functions) ||
      d.functions.some((f) => typeof f !== "string"))
  )
    throw new Error("Functions must be a list of text labels.");
  if (
    d.options !== undefined &&
    (!Array.isArray(d.options) ||
      d.options.some(
        (r) =>
          !r ||
          typeof r.function !== "string" ||
          typeof r.candidate !== "string" ||
          typeof r.reason !== "string" ||
          !states.has(r.state),
      ))
  )
    throw new Error(
      "Concept options need function, candidate, state, and reason.",
    );
  if (
    d.people !== undefined &&
    (!Array.isArray(d.people) ||
      d.people.some(
        (p) => !p || typeof p.name !== "string" || typeof p.role !== "string",
      ))
  )
    throw new Error("Team records need name and role.");
  if (
    d.decisions !== undefined &&
    (!Array.isArray(d.decisions) ||
      d.decisions.some(
        (r) =>
          !r ||
          typeof r.date !== "string" ||
          typeof r.decision !== "string" ||
          typeof r.basis !== "string" ||
          !states.has(r.state),
      ))
  )
    throw new Error("Decision records need date, decision, state, and basis.");
  if (
    d.event_date !== undefined &&
    (typeof d.event_date !== "string" ||
      !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(d.event_date))
  )
    throw new Error(
      "Milestone dates use YYYY, YYYY-MM, or YYYY-MM-DD; leave unknown dates unset.",
    );
  if (d.calculation !== undefined && d.calculation !== "wheel-rpm")
    throw new Error("Unsupported interactive calculation.");
}
export function validateBundle(value: unknown): asserts value is ImportBundle {
  const b = value as ImportBundle;
  if (
    !b ||
    b.format !== "pbt-private-drafts-v1" ||
    typeof b.title !== "string" ||
    !Array.isArray(b.warnings) ||
    b.warnings.some((w) => typeof w !== "string") ||
    !Array.isArray(b.entries) ||
    !b.entries.length ||
    b.entries.length > 150
  )
    throw new Error("Choose a PBT draft bundle containing 1–150 entries.");
  const keys = new Set<string>();
  for (const e of b.entries) {
    if (
      !/^pbt:[a-z0-9:_-]{1,150}$/.test(e.import_key) ||
      keys.has(e.import_key)
    )
      throw new Error("Import keys must be unique, stable PBT identifiers.");
    keys.add(e.import_key);
    if (
      ![
        "tester",
        "bearing",
        "suspension",
        "project",
        "research",
        "update",
      ].includes(e.kind) ||
      !e.title?.trim() ||
      e.title.length > 180 ||
      e.status !== "draft" ||
      e.visibility !== "team"
    )
      throw new Error("Imported entries must be valid, team-only drafts.");
    if (
      !Array.isArray(e.provenance) ||
      !e.provenance.length ||
      e.provenance.some(
        (c) =>
          !c ||
          typeof c.document !== "string" ||
          !c.document ||
          typeof c.locator !== "string" ||
          !c.locator ||
          typeof c.date !== "string" ||
          (c.url &&
            (typeof c.url !== "string" || !/^https?:\/\//i.test(c.url))),
      )
    )
      throw new Error(
        "Every imported record needs a source document and location, with valid optional URLs.",
      );
    if (!e.review_state || !states.has(e.review_state))
      throw new Error("Every record needs a valid engineering review state.");
    if (
      typeof e.summary !== "string" ||
      e.summary.length > 1000 ||
      typeof e.body !== "string" ||
      typeof e.organization !== "string" ||
      typeof e.category !== "string" ||
      !Array.isArray(e.tags) ||
      e.tags.some((t) => typeof t !== "string") ||
      !Array.isArray(e.sources) ||
      e.sources.some(
        (s) =>
          typeof s.label !== "string" ||
          typeof s.url !== "string" ||
          !/^https?:\/\//i.test(s.url),
      )
    )
      throw new Error("Import text, tags, or external sources are malformed.");
    validateDetails(e.details || {});
  }
}
export const documentCategories = [
  "Project proposals",
  "Midterm presentations",
  "CAD drawings",
  "Engineering calculations",
  "Technical publications",
  "Reference manuals",
  "Design photographs",
  "Prototypes",
  "Meeting records",
];
