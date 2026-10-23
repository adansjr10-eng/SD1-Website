import type { Entry, Resource } from "./data";
import { isArchived, isProgress, progressType } from "./progress";
export const projectTitle =
  "Design and Development of a Passenger Rail Bearing Tester";
export const projectIdentity = "Senior Design Team 15 — Sixth Gear";
export const university = "University of Texas Rio Grande Valley";
// Public project purpose supplied for the website; editable published records override it.
export const introductoryCopy =
  "Sixth Gear is developing a passenger rail bearing tester for the University Transportation Center for Railway Safety (UTCRS). The proposed system will incorporate a representative primary suspension arrangement to support future passenger rail bearing research under controlled loading and rotational speed conditions.";
export type PresentationDetails = {
  kind: "home" | "overview";
  why_intro?: string;
  why_cards?: { title: string; text: string }[];
  hero_image_id?: string;
  bogie_image_id?: string;
  bogie_caption?: string;
  bogie_note?: string;
  gallery_image_ids?: string[];
  featured_update_ids?: string[];
};
export type ProfileDetails = {
  group: "member" | "advisor";
  role?: string;
  biography?: string;
  linkedin?: string;
  photo_id?: string;
  order?: number;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function linkedinUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (u.hostname === "linkedin.com" || u.hostname.endsWith(".linkedin.com"))
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function validatePresentation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Presentation settings must be an object.");
  const p = value as PresentationDetails;
  if (!["home", "overview"].includes(p.kind))
    throw new Error("Choose Home or Project Overview presentation.");
  for (const key of ["why_intro", "bogie_caption", "bogie_note"] as const)
    if (p[key] !== undefined && typeof p[key] !== "string")
      throw new Error("Presentation descriptions must be text.");
  for (const key of ["hero_image_id", "bogie_image_id"] as const)
    if (p[key] !== undefined && !uuid.test(p[key]!))
      throw new Error("Choose an image from the uploaded resource library.");
  for (const key of ["gallery_image_ids", "featured_update_ids"] as const)
    if (
      p[key] !== undefined &&
      (!Array.isArray(p[key]) ||
        p[key]!.some((id) => typeof id !== "string" || !uuid.test(id)) ||
        new Set(p[key]).size !== p[key]!.length)
    )
      throw new Error("Featured selections must be unique resource/entry IDs.");
  if (
    (p.featured_update_ids?.length || 0) > 4 ||
    (p.gallery_image_ids?.length || 0) > 6
  )
    throw new Error("Feature at most four updates and six gallery images.");
  if (
    p.why_cards !== undefined &&
    (!Array.isArray(p.why_cards) ||
      p.why_cards.some(
        (c) => !c || typeof c.title !== "string" || typeof c.text !== "string",
      ))
  )
    throw new Error("Context cards need a title and description.");
}
export function validateProfile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Profile settings must be an object.");
  const p = value as ProfileDetails;
  if (!["member", "advisor"].includes(p.group))
    throw new Error("Choose team member or advisor.");
  for (const key of ["role", "biography", "linkedin"] as const)
    if (p[key] !== undefined && typeof p[key] !== "string")
      throw new Error("Profile fields must be text.");
  if (p.linkedin && !linkedinUrl(p.linkedin))
    throw new Error("Use an HTTPS LinkedIn URL or leave it blank.");
  if (p.photo_id !== undefined && !uuid.test(p.photo_id))
    throw new Error("Choose a profile photo from uploaded resources.");
  if (
    p.order !== undefined &&
    (!Number.isInteger(p.order) || p.order < 0 || p.order > 1000)
  )
    throw new Error("Profile order must be an integer between 0 and 1000.");
}
export function presentationEntry(
  entries: Entry[],
  kind: PresentationDetails["kind"],
  editable = false,
) {
  const candidates = entries.filter(
    (e) =>
      !e.demo &&
      (editable || e.status === "published") &&
      e.details?.presentation?.kind === kind,
  );
  if (candidates.length)
    return candidates.sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    )[0];
  if (kind === "overview")
    return entries.find(
      (e) =>
        !e.demo &&
        e.id !== "project-overview" &&
        (editable || e.status === "published") &&
        e.section === "overview",
    );
}
export function approvedImage(
  id: string | undefined,
  resources: Resource[],
  entries: Entry[],
  editable = false,
  profileId?: string,
) {
  if (!id) return undefined;
  const image = resources.find(
    (r) =>
      r.id === id &&
      ["image/jpeg", "image/png", "image/webp"].includes(r.mime) &&
      ["team-owned", "permission-granted"].includes(r.rights || "") &&
      (editable || r.status === "published"),
  );
  if (!image || (profileId && image.entry_id !== profileId)) return undefined;
  if (
    image.entry_id &&
    !entries.some(
      (e) => e.id === image.entry_id && (editable || e.status === "published"),
    )
  )
    return undefined;
  return image;
}
export function featuredProgress(entries: Entry[], ids?: string[]) {
  const eligible = entries.filter(
    (e) =>
      e.status === "published" &&
      !e.demo &&
      isProgress(e) &&
      !isArchived(e) &&
      ["milestone", "bogie"].includes(progressType(e)),
  );
  return ids?.length
    ? ids
        .map((id) => eligible.find((e) => e.id === id))
        .filter((e): e is Entry => Boolean(e))
        .slice(0, 4)
    : eligible
        .sort((a, b) =>
          (
            b.details?.event_date ||
            b.details?.progress?.as_of ||
            ""
          ).localeCompare(
            a.details?.event_date || a.details?.progress?.as_of || "",
          ),
        )
        .slice(0, 3);
}
export function profileEntries(entries: Entry[], editable = false) {
  return entries
    .filter(
      (e) =>
        e.section === "team" &&
        e.details?.profile &&
        !e.demo &&
        (editable || e.status === "published"),
    )
    .sort(
      (a, b) =>
        (a.details?.profile?.order ?? 1000) -
          (b.details?.profile?.order ?? 1000) || a.title.localeCompare(b.title),
    );
}
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
