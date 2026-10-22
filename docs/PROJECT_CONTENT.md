# PBT project library and private editorial workflow

The existing Next.js application now has Home, Project Overview, Engineering Design, Passenger Bearing Research, Primary Suspension Research, Existing Railway Testers, Project Progress, Our Team, and Documents & Gallery. Engineering Design has the eleven requested topic tabs. Calculations and Compare Systems are also directly accessible. PBT remains the visible brand. No Vercel project settings or domains need changing.

The academic homepage shows reviewed, visible database records. It does not ship the owner's private brief or draft research in the browser bundle. An empty public homepage is expected until the team deliberately publishes content. Editors can see their private drafts while signed in; that does not mean anonymous visitors can see them.

## What has and has not been populated

The owner supplied a detailed project brief, including an October 2026 update. The three named original documents — SDI Midterm Slides, SDI Team 15 Suspension Project Proposal, and Fall 2026 Team 15 Tracking Report — were not attached to the implementation workspace. No pages, tables, source figures, meeting dates, approved scores, or manufacturer specifications have been extracted from those originals.

A local preparation run against the owner brief produced **51 private draft records**, including the project overview, working direction, eleven engineering topics, bearing/suspension research topics, six existing-system research leads, a procurement update, team directory, calculation index, and source register. Research topics without original evidence explicitly await source extraction. The generated bundle has not been uploaded to Supabase or published. It is intentionally excluded from this public repository and Vercel artifacts.

Each record attributes the owner brief and its section, rather than citing unread slide/page numbers. Month-only dates preserve the precision of the supplied update. The availability update does not assert physical delivery. Component candidates and speed considerations remain preliminary; unspecified ratings stay blank. Existing-system classifications distinguish single/four-bearing, full-bogie/spring testing, and configuration references.

## 1. Apply the additive migration

Back up the current Supabase database and Storage through your normal project workflow. In **Supabase → SQL Editor**, run only:

[`supabase/migrations/202610_project_content.sql`](../supabase/migrations/202610_project_content.sql)

Do not rerun `schema.sql` or `seed.sql` on the existing project. The migration is repeatable and does not import content, publish records, delete research, change memberships, or replace existing entries/resources RLS policies. It adds:

- Entry section, engineering review state, provenance, and structured detail fields, with an index and validation constraints.
- Resource citation and reuse-rights metadata.
- An editor-only import ledger and guarded `import_project_drafts` RPC.
- PPT/PPTX extension and MIME support for source presentations in the existing private `research-files` bucket. Its privacy and size limit are preserved; existing MIME entries remain allowed.

The importer enforces team-only drafts at the database level. Stable `pbt:` import keys claim records once. Reruns skip claimed keys, including entries subsequently edited or deleted; they never overwrite administrator changes or recreate deleted records. Each import call is atomic. Anonymous users and viewers cannot run imports or change the ledger. A failed batch does not leave partially imported entries.

The existing app remains usable without the migration, but structured editing and imports require it. If the schema notice remains after applying it, wait for the REST schema reload, then refresh the website. No secret/service-role key is needed in the browser or Vercel.

## 2. Prepare and import the brief privately

1. Open the website's **Admin workspace** and sign in with the existing editor/admin account.
2. Under **Prepare project drafts**, expand **Open import preparation**.
3. Paste the original project request (including its headings), or load its `.txt`/`.md` file. This parser handles the supplied owner-brief format; it is not a general PDF extractor. Original PDFs and presentations belong in the separate attachment uploader.
4. Select **Preview draft plan**. Processing happens locally in the browser. Inspect the record list and warnings before importing. Nothing is saved by previewing.
5. Select **Import … team-only drafts**. The website calls Supabase using your signed-in session. Rerunning the same import reports skipped records and preserves edits.
6. Review and edit the resulting drafts through the normal admin controls. Importing is separate from publishing.

An optional local preparation command produces the same review bundle without network access:

```bash
npm run content:prepare -- /absolute/path/to/owner-brief.txt
```

It writes `private-imports/project-drafts.json`. This directory is excluded by both `.gitignore` and `.vercelignore`. Do not place source files or generated private bundles elsewhere in this public repository. Loading a JSON bundle permits other document-extraction workflows to use the same validator and guarded importer; retain stable keys and explicit sources.

## 3. Review technical content and source precedence

Use the proposal for baseline purpose and requirements, later explicitly confirmed decisions for current direction, and the tracking report for historical progress. When sources disagree, retain the history and explain which later decision supersedes the earlier proposal. Do not treat publication as engineering approval.

The editor supports source document, date, page/slide/section, optional HTTP(S) URL, availability, and priority. Unknown dates may remain blank; never use the upload time as a meeting date. Progress records accept year, month, or day precision through **Milestone / activity date**. Structured tables, WHAT functions, HOW candidate options, decision history, team roles, development stage, objectives, and calculation selection are editable. Custom section identifiers are accessible through the research library.

Use these engineering states independently of publication and visibility:

| State                          | Meaning                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| Confirmed                      | Supported by approved evidence or a verified decision         |
| Preliminary                    | Proposed target, assumption, or candidate awaiting validation |
| Pending technical confirmation | Required details requested but not verified                   |
| Completed                      | An activity demonstrably finished                             |
| Planned                        | Future work, calculation, fabrication, or testing             |

The wheel-speed calculator uses `RPM = 1056 × mph / (π × wheel diameter in inches)`. Inputs start empty. It assumes pure rolling and bearing inner-ring rotation at axle speed; it does not size a motor, validate a bearing, account for slip/drive ratios, or approve a laboratory operating limit. Other calculation records remain work items until documented inputs and reviewed results are added.

## 4. Documents, images, and deliberate publication

Upload source PDFs, presentations, CAD, and images as **draft / team-only** attachments. Choose the category and related entry, add captions and a citation, and record reuse rights. Linked attachment visibility remains constrained by the parent entry's visibility and publication state under the existing RLS policies. Keep source documents internal until explicitly approved for release.

No source figures were extracted or published by this change. The team logo, group photo, bearing/tester photographs, suspension/CAD illustrations, morphological chart, and schedule figures still require the actual documents and a reuse review. Preserve original captions and attribution. For uncertain third-party rights, leave a source link/placeholder; do not upload a public copy. The public publication form requires team-owned or permission-granted rights. This editorial check does not replace a permissions review.

Images retain the existing zoomable preview and captions; PDFs use the existing private signed-link preview/download. Replace an attachment by uploading and checking its replacement before removing the old file. Documents are grouped by category and can be linked to the specific design record.

For a reviewed entry, choose **Published** and either **Team** or **Public** visibility, then save. A published preliminary record is still preliminary. A public resource needs its own deliberate publication and an eligible parent. Test anonymously in a separate browser before announcing public availability. Existing authenticated roles, private bucket, and signed-link expiry remain in effect.

## 5. Verify the Vercel rollout

1. Review the pull request and its Vercel preview using the existing Vercel project. Keep its production/preview Supabase public variables and domains unchanged.
2. After applying the additive migration, confirm an editor can see structured fields and preview/import a private brief. An anonymous window must not see those drafts; a viewer must not see draft/import/edit controls.
3. Edit a draft specification row, source citation, and milestone. Upload an image and PDF as private attachments. Refresh, then verify metadata and downloads persist. Use **Admin → Supabase connection checks** and the existing opt-in **Run storage & persistence test** for live Storage/RLS verification.
4. Confirm repeat import skips keys and preserves edits. Use actual research drafts only when ready; synthetic test fixtures should remain team-only and be cleaned up explicitly.
5. Merge the PR, wait for the normal production deployment, and check Home, Engineering Design, Compare Systems, Calculations, Documents & Gallery, admin login, and mobile navigation on the actual production URL.

Automated checks cover type safety, the production build, parser/calculator behavior, PostgreSQL RLS/import safety, demo-browser navigation/calculation/comparison, and mocked admin CRUD/uploads/import/reruns. PostgreSQL tests simulate Supabase auth/storage with PGlite; mocked browser checks do not establish live account or bucket access. No live migration or authenticated import was performed during implementation. Complete the signed-in acceptance workflow on your own deployment before relying on the new features for team research.
