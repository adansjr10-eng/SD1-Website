/** Local-only preparation; never connects to the live database. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildBriefBundle } from "../lib/brief-import";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: tsx scripts/prepare-project-drafts.ts /path/to/owner-brief.txt",
  );
const bundle = buildBriefBundle(readFileSync(source, "utf8"));
mkdirSync("private-imports", { recursive: true });
writeFileSync(
  "private-imports/project-drafts.json",
  JSON.stringify(bundle, null, 2) + "\n",
);
console.log(
  `Prepared ${bundle.entries.length} private draft records in ignored private-imports/project-drafts.json. Nothing was uploaded or published.`,
);
