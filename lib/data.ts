import type { Citation, ProjectDetails, ReviewState } from "./project-content";
export type Kind =
  "tester" | "bearing" | "suspension" | "project" | "research" | "update";
export type Spec = {
  rpm?: number;
  speed?: number;
  load?: number;
  bearing?: string;
  loading?: string;
  drive?: string;
  suspension?: string;
  footprint?: string;
  sensors?: string;
  acquisition?: string;
  advantages?: string;
  limitations?: string;
};
export type Entry = {
  id: string;
  kind: Kind;
  title: string;
  organization: string;
  category: string;
  summary: string;
  body: string;
  specs: Spec;
  tags: string[];
  sources: { label: string; url: string }[];
  status: "draft" | "published";
  visibility: "public" | "team";
  demo: boolean;
  updated_at: string;
  section?: string;
  review_state?: ReviewState;
  provenance?: Citation[];
  details?: ProjectDetails;
};
export type Resource = {
  id: string;
  entry_id: string | null;
  name: string;
  caption: string;
  category: string;
  tags: string[];
  path: string;
  mime: string;
  size: number;
  visibility: "public" | "team";
  status: "draft" | "published";
  created_at: string;
  citation?: string;
  rights?: string;
};
const base = {
  organization: "Demonstration entry",
  status: "published" as const,
  visibility: "public" as const,
  demo: true,
  updated_at: "2026-10-21T12:00:00Z",
  sources: [],
  tags: [],
  body: "",
  specs: {},
};
export const demoEntries: Entry[] = [
  {
    ...base,
    id: "demo-1",
    kind: "tester",
    title: "Single-bearing test rig",
    category: "Component testing",
    summary:
      "An illustrative bench-scale arrangement for investigating a single railway bearing under controlled rotation and loading.",
    tags: ["Bearing testing", "Concept study"],
    body: "## Research scope\nA demonstration record for organizing research on a single-bearing test arrangement.\n\n## Information to collect\n- Verified load and speed ratings\n- Bearing and axle interfaces\n- Control and measurement architecture\n\nNo manufacturer or performance claims are associated with this example.",
    specs: {
      loading: "Under investigation",
      sensors: "Temperature, vibration (illustrative)",
      limitations: "Demonstration only; specifications unverified",
    },
  },
  {
    ...base,
    id: "demo-2",
    kind: "tester",
    title: "Axlebox endurance test bench",
    category: "Endurance testing",
    summary:
      "An example research record for an axlebox assembly test bench, with space for loading, lubrication, and instrumentation details.",
    tags: ["Axlebox", "Endurance"],
    body: "## Research scope\nUse this example to document an axlebox endurance test bench after consulting its manufacturer or research publication. Unknown ratings are intentionally blank.",
    specs: {
      bearing: "To be verified",
      limitations: "No verified source has been added",
    },
  },
  {
    ...base,
    id: "demo-3",
    kind: "tester",
    title: "Bogie suspension test stand",
    category: "System testing",
    summary:
      "A sample entry exploring how a primary suspension assembly could be represented in a bearing testing environment.",
    tags: ["Primary suspension", "System testing"],
    body: "## Research scope\nThis is an illustrative system-level testing record. It does not represent a real product. Add verified drawings and references before using it for design decisions.",
    specs: { suspension: "Arrangement under investigation" },
  },
  {
    ...base,
    id: "demo-4",
    kind: "bearing",
    title: "Understanding the axlebox assembly",
    category: "Bearing fundamentals",
    summary:
      "A starting point for documenting bearings, housings, seals, and the wheelset interface.",
    tags: ["Fundamentals"],
    body: "## Assembly and interfaces\nDocument the bearing, axle journal, housing, seals, and retention arrangement for the passenger vehicle under study.\n\n## Research checklist\n- Bearing type and geometry\n- Lubrication and sealing\n- Axle and housing fits\n- Maintenance requirements\n\n## Standards and inspection\nAdd applicable standards and manufacturer instructions after verifying their edition and scope. No standard is asserted here.",
  },
  {
    ...base,
    id: "demo-5",
    kind: "suspension",
    title: "Primary suspension configurations",
    category: "Suspension fundamentals",
    summary:
      "Explore the connection between the axlebox and bogie frame, and the implications for a representative test setup.",
    tags: ["Bogie", "Load paths"],
    body: "## Configurations to investigate\nCompare candidate coil spring, elastomeric, and guided axlebox arrangements using vehicle-specific sources.\n\n## Testing considerations\nRecord vertical load, displacement, alignment, and boundary conditions for each candidate. The project suspension arrangement has not been selected.",
  },
  {
    ...base,
    demo: false,
    id: "project-overview",
    kind: "project",
    title: "Passenger rail bearing tester",
    category: "Project overview",
    summary:
      "Design a single passenger rail bearing tester incorporating representative primary suspension, controlled bearing rotation, and vertical loading.",
    tags: ["Preliminary", "Senior design"],
    body: "## Problem statement\nDevelop a test rig concept for studying a passenger rail bearing with representative primary suspension and controlled loading.\n\n## Preliminary considerations\n- Rotation corresponding to passenger rail operation up to **120 mph**\n- Hydraulic vertical loading\n- Temperature, vibration, and displacement measurement\n- Data acquisition using LabVIEW\n\nThese are preliminary considerations, not finalized specifications. The exact suspension arrangement remains under investigation.\n\n## Design requirements\nTo be defined and reviewed by the team.\n\n## Functional decomposition\nRotate the bearing; apply and react load; represent suspension behavior; measure response; acquire data; provide safe operation.\n\n## Morphological chart\nCandidate drive, loading, suspension, and sensing approaches are awaiting team research.\n\n## Conceptual designs\nUpload concept sketches and document selection criteria.\n\n## Preliminary engineering calculations\nNo verified calculations have been recorded. Speed conversion requires an established wheel diameter.\n\n## CAD and component selection\nAwaiting candidate components and engineering drawings.\n\n## Future testing plans\nDefine commissioning, safety review, calibration, and validation procedures before operating a prototype.",
  },
  {
    ...base,
    id: "demo-6",
    kind: "research",
    title: "Building our research framework",
    category: "Research notes",
    summary:
      "A practical checklist for collecting traceable information about existing bearing test equipment.",
    tags: ["Research methods"],
    body: "## Capture the source\nSave the original manual, publication, or manufacturer page alongside each entry.\n\n## Keep uncertainty visible\nLeave unknown values blank. Distinguish proposed requirements from verified capabilities.\n\n## Compare consistently\nUse common units and review the original test conditions before comparing ratings.",
  },
];
export const specFields: { key: keyof Spec; label: string; unit?: string }[] = [
  { key: "rpm", label: "Rotational speed", unit: "RPM" },
  { key: "speed", label: "Operating speed", unit: "km/h" },
  { key: "load", label: "Load capacity", unit: "kN" },
  { key: "bearing", label: "Bearing types" },
  { key: "loading", label: "Loading system" },
  { key: "drive", label: "Drive & motor" },
  { key: "suspension", label: "Suspension arrangement" },
  { key: "footprint", label: "Dimensions & footprint" },
  { key: "sensors", label: "Instrumentation" },
  { key: "acquisition", label: "Data acquisition" },
  { key: "advantages", label: "Advantages" },
  { key: "limitations", label: "Limitations" },
];
export function displaySpec(
  key: keyof Spec,
  value: string | number | undefined,
  imperial: boolean,
) {
  if (value === undefined || value === "") return "Not documented";
  if (typeof value !== "number") return value;
  if (key === "speed")
    return `${(imperial ? value / 1.609344 : value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${imperial ? "mph" : "km/h"}`;
  if (key === "load")
    return `${(imperial ? value * 224.808943 : value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${imperial ? "lbf" : "kN"}`;
  return `${value.toLocaleString()} RPM`;
}
export function filterTesters(
  entries: Entry[],
  query: string,
  category: string,
  minLoad: string,
  minSpeed: string,
  sort: string,
) {
  return entries
    .filter(
      (e) =>
        e.kind === "tester" &&
        `${e.title} ${e.organization} ${e.category} ${e.tags.join(" ")} ${Object.values(e.specs).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!category || e.category === category) &&
        (!minLoad ||
          (e.specs.load !== undefined && e.specs.load >= Number(minLoad))) &&
        (!minSpeed ||
          (e.specs.speed !== undefined && e.specs.speed >= Number(minSpeed))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : sort === "load"
          ? (b.specs.load ?? -1) - (a.specs.load ?? -1)
          : Date.parse(b.updated_at) - Date.parse(a.updated_at),
    );
}
export function comparisonCsv(entries: Entry[], imperial: boolean) {
  const rows = [
    ["Specification", ...entries.map((e) => e.title)],
    ["Organization", ...entries.map((e) => e.organization)],
    [
      "System classification",
      ...entries.map((e) => e.category || "Pending classification"),
    ],
    ["Engineering review", ...entries.map((e) => e.review_state || "pending")],
    [
      "Content",
      ...entries.map((e) =>
        e.demo ? "Demonstration — unverified" : "Research entry",
      ),
    ],
    ...[
      ...new Set(
        entries.flatMap((e) => e.details?.rows?.map((r) => r.label) || []),
      ),
    ].map((label) => [
      label,
      ...entries.map(
        (e) =>
          e.details?.rows?.find((r) => r.label === label)?.value ||
          "Not documented",
      ),
    ]),
    ...specFields.map((f) => [
      f.label,
      ...entries.map((e) => displaySpec(f.key, e.specs[f.key], imperial)),
    ]),
  ];
  return rows
    .map((r) =>
      r
        .map(
          (c) =>
            '"' + c.replaceAll('"', '""').replace(/^[=+@\-\t\r]/, "'$&") + '"',
        )
        .join(","),
    )
    .join("\r\n");
}
export const allowedExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "ppt",
  "pptx",
  "step",
  "stp",
  "iges",
  "igs",
  "stl",
  "dwg",
  "dxf",
  "sldprt",
  "sldasm",
  "xlsx",
  "xls",
  "csv",
  "docx",
  "txt",
  "md",
];
export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedExtensions.includes(ext)) return "Unsupported file type.";
  if (file.size > 25 * 1024 * 1024) return "Files must be 25 MB or smaller.";
  if (file.size === 0) return "Empty files cannot be uploaded.";
  if (
    ["jpg", "jpeg", "png", "webp"].includes(ext) &&
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return "Image type does not match a supported format.";
  if (ext === "pdf" && file.type !== "application/pdf")
    return "PDF type is invalid.";
  return null;
}
