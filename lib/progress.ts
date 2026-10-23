import type { Entry } from "./data";
export const progressTypes = {
  summary: "Current Project Status",
  milestone: "Timeline milestone",
  bogie: "Recent Development — Passenger Bogie",
  engineering: "Engineering Development Progress",
  challenges: "Current Design Challenges",
  "next-steps": "Next Steps",
} as const;
export type ProgressType = keyof typeof progressTypes;
export const progressStatuses = {
  completed: "Completed",
  "in-progress": "In progress",
  pending: "Pending confirmation",
  preliminary: "Preliminary design",
  planned: "Planned",
} as const;
export type ProgressStatus = keyof typeof progressStatuses;
export type ProgressDetails = {
  type?: ProgressType;
  status?: ProgressStatus;
  archived?: boolean;
  as_of?: string;
  term?: string;
  objective?: string;
  focus?: string;
  next_milestone?: string;
  accomplishments?: string[];
  activities?: { label: string; status: ProgressStatus; note: string }[];
  challenges?: { label: string; reason: string }[];
  tasks?: string[];
};
export function progressType(entry: Entry): ProgressType {
  return entry.details?.progress?.type || "milestone";
}
export function progressStatus(entry: Entry): ProgressStatus {
  return (
    entry.details?.progress?.status ||
    (entry.review_state === "confirmed"
      ? "pending"
      : entry.review_state || "pending")
  );
}
export const isProgress = (entry: Entry) =>
  entry.section === "progress" || (!entry.section && entry.kind === "update");
export const isArchived = (entry: Entry) =>
  entry.details?.progress?.archived === true;
export function validProgressDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1 || (m !== undefined && (m < 1 || m > 12))) return false;
  if (
    d !== undefined &&
    (d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate())
  )
    return false;
  return true;
}
function displayDate(value: string) {
  if (!validProgressDate(value)) return "Date not recorded";
  const parts = value.split("-").map(Number);
  if (parts.length === 1) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    ...(parts.length === 3 ? { day: "numeric" as const } : {}),
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] || 1)));
}
export function progressDate(entry: Entry) {
  const start = entry.details?.event_date;
  const end = entry.details?.event_end_date;
  if (!start) return "Date not recorded";
  return (
    displayDate(start) + (end && end !== start ? " – " + displayDate(end) : "")
  );
}
export function validateProgress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Progress details must be an object.");
  const p = value as ProgressDetails;
  if (p.type !== undefined && !Object.hasOwn(progressTypes, p.type))
    throw new Error("Choose a valid progress record type.");
  if (p.status !== undefined && !Object.hasOwn(progressStatuses, p.status))
    throw new Error("Choose a valid activity status.");
  if (p.archived !== undefined && typeof p.archived !== "boolean")
    throw new Error("Archive state must be true or false.");
  if (p.as_of !== undefined && !validProgressDate(p.as_of))
    throw new Error("Use a valid source as-of date.");
  for (const key of ["term", "objective", "focus", "next_milestone"] as const)
    if (p[key] !== undefined && typeof p[key] !== "string")
      throw new Error("Progress summary fields must be text.");
  for (const key of ["accomplishments", "tasks"] as const)
    if (
      p[key] !== undefined &&
      (!Array.isArray(p[key]) || p[key]!.some((v) => typeof v !== "string"))
    )
      throw new Error("Progress lists must contain text.");
  if (
    p.activities !== undefined &&
    (!Array.isArray(p.activities) ||
      p.activities.some(
        (a) =>
          !a ||
          typeof a.label !== "string" ||
          typeof a.note !== "string" ||
          !Object.hasOwn(progressStatuses, a.status),
      ))
  )
    throw new Error(
      "Each engineering activity needs a label, valid status, and note.",
    );
  if (
    p.challenges !== undefined &&
    (!Array.isArray(p.challenges) ||
      p.challenges.some(
        (c) =>
          !c || typeof c.label !== "string" || typeof c.reason !== "string",
      ))
  )
    throw new Error("Each design challenge needs a title and explanation.");
}
