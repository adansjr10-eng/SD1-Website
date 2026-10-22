import { writeFileSync } from "node:fs";
import { demoEntries } from "../lib/data";
const quote = (v: string) => "'" + v.replaceAll("'", "''") + "'";
const rows = demoEntries.map(
  ({ id, ...e }) =>
    `insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo) values (${[e.kind, e.title, e.organization, e.category, e.summary, e.body].map(quote).join(",")},${quote(JSON.stringify(e.specs))}::jsonb,ARRAY[${e.tags.map(quote).join(",")}]::text[],${quote(JSON.stringify(e.sources))}::jsonb,${quote(e.status)},${quote(e.visibility)},${e.demo});`,
);
writeFileSync(
  "supabase/seed.sql",
  "-- OPTIONAL: run once after schema.sql. Examples are not verified equipment records.\nbegin;\n" +
    rows.join("\n") +
    "\ncommit;\n",
);
