/** Local-only preparation; never connects to the live database. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildBriefBundle } from "../lib/brief-import";
import { isProgressBrief, buildProgressBundle } from "../lib/progress-import";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: tsx scripts/prepare-project-drafts.ts /path/to/owner-brief.txt",
  );
const text = readFileSync(source, "utf8");
const progress = isProgressBrief(text);
const bundle = progress ? buildProgressBundle(text) : buildBriefBundle(text);
const output = progress
  ? "private-imports/progress-drafts.json"
  : "private-imports/project-drafts.json";
mkdirSync("private-imports", { recursive: true });
writeFileSync(output, JSON.stringify(bundle, null, 2) + "\n");
console.log(
  `Prepared ${bundle.entries.length} private draft records in ignored ${output}. Nothing was uploaded or published.`,
);
