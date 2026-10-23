# Project Progress editorial workflow

This change focuses on `/progress`: a current-status summary, source-dated interactive timeline, recent bogie update, engineering activity tracker, design challenges, and upcoming tasks. Existing research pages, authentication, memberships, RLS, private Storage, and Vercel project/domains are retained. Progress-specific fields live in the existing entry `details` JSON object.

## Available source material

Only the pasted owner progress brief was available during implementation. The named files `SDI_MidtermSlides.pptx`, `SDI T15 PROJECT SUSPENSION PROPOSAL (4).pdf`, and `2026 FALL SDI T15 TRACKING.pdf` were not attached to the workspace. No information is attributed to having read these originals. No page numbers, source figures, Gantt charts, prototype photographs, procurement receipts, or test results have been invented.

A local preparation run produced **12 private review drafts** from the owner brief: seven weekly milestones, a current-status summary, a bogie information/delivery update, an engineering tracker, design challenges, and next steps. These files are ignored by Git and excluded from Vercel. They have not been imported to live Supabase or published. The generic importer is committed; the actual private brief and generated research content are not.

Every draft cites **Project owner progress brief**, its explicit as-of date, and the relevant heading/date range. Activity dates remain separate from source dates and edit times. Unspecified meeting/delivery dates remain unset. Statuses do not change automatically when a date passes. A partially completed week or dry run does not establish that a later presentation occurred. Demonstration prototypes remain distinct from functioning test hardware.

When the original documents are available, reconcile the tracking report's historical activities/dates, the proposal's purpose/background, and the midterm slides' later design status. Add exact page/slide references only after checking them. Use later explicitly documented decisions when sources conflict and retain the earlier history. Source illustrations need captions, attribution, and a reuse review before publication.

## Import the review drafts

1. Review the PR's Vercel preview, or merge it and wait for the normal deployment.
2. Sign in through **Admin workspace** with the existing editor/admin account.
3. Expand **Prepare project drafts → Open import preparation**. Paste the complete Project Progress request, including headings, dated milestones, and the explicit as-of date; or load its `.txt`/`.md` file.
4. Select **Preview draft plan**. The progress brief is recognized separately from the broader project-library brief. Check the 12 records and warnings.
5. Select **Import 12 team-only drafts**. This uses the existing guarded `import_project_drafts` RPC and your own Supabase session. The database forces drafts/team visibility. Previewing alone saves nothing.
6. Open **Project Progress** while signed in and review each section. No imported record is automatically public.

Stable `pbt:progress:` keys make reruns skip existing imported records, including records subsequently edited or deleted. Reimporting never updates administrator edits. Existing overlapping updates from earlier imports remain untouched; review and archive superseded records yourself. For future revisions, edit the saved entries or create a new explicitly dated update instead of changing import keys to bypass the ledger.

Optional local preparation:

```bash
npm run content:prepare -- /absolute/path/to/progress-brief.txt
```

It writes `private-imports/progress-drafts.json`. Do not move private briefs, bundles, or source documents into committed/public directories. The original broader brief still produces `private-imports/project-drafts.json` through the same command.

## Add and maintain future updates

- **New milestone:** on Project Progress, select **Add milestone**. Enter a title, concise summary, research notes, start/end dates, activity status, accomplishments/design notes, and source provenance. Save as a draft first. Dates support ranges; invalid or reversed ranges are rejected.
- **Current status:** use **Edit update** in the top status panel. Update development stage, academic term, objective, focus, next milestone, and source as-of date. The newest source-dated, non-archived summary is shown first; older summaries remain accessible.
- **Engineering tracker:** edit activity labels, status, and notes. Retain qualifications such as initial research continuing, preliminary design, or unverified CAD completion.
- **Design challenges and next steps:** edit explanations and planned tasks in their progress-specific controls. Add/remove activities and challenges without replacing unrelated entry content.
- **Additional section records:** use the section's **Add update** button, or Admin → New entry → Project section `progress` → Progress record type. A milestone can also be edited through Admin's standard entry list.
- **Archive:** edit a record and select **Archive this progress record**. It remains saved; **Show archived updates** reveals it on the progress page. Archiving is not a privacy restriction: a previously published public record remains available in history/direct links. Unpublish or choose team visibility when access should change.

Activity status, engineering review state, and publication status have different meanings. **Completed** describes a specific activity. **Preliminary design** does not mean hardware was purchased, fabricated, assembled, or tested. **Published** controls availability, not technical maturity. There is no numerical project-completion percentage.

## Images and supporting documents

Select **Attach progress files** on the relevant update. Its related-entry field is preselected. Upload images, CAD screenshots/drawings, PDFs, or supported CAD files, add a caption/citation and reuse-rights metadata, and retain draft/team visibility until review. Linked files appear under that milestone's expandable evidence panel or the section's supporting-material disclosure. Existing signed-link preview, image zoom, download, metadata editing, and replacement workflow are reused.

Do not publish sensitive meeting records or private contact information. No stock imagery or unreviewed third-party figures were added. Public attachments require a separate deliberate publication decision and an eligible public/published parent under the existing RLS policies.

## Database and deployment

No new SQL migration is needed for this feature. The existing structured fields were reachable through the live read-only API check. If another environment lacks them or the importer RPC, apply only the earlier additive `supabase/migrations/202610_project_content.sql`; do not rerun the initial schema or seed over existing data. This change introduces no new tables, roles, grants, or storage policies.

After reviewing a draft, choose **Published** and the intended **Team/Public** visibility, then save. Review the same page in an anonymous browser before announcing public availability. The production site uses the existing Vercel project, public Supabase variables, and domains; merging the PR triggers the normal deployment.

## Validation and limits

Automated tests cover deterministic progress preparation, safe private defaults/stable keys, source precision, mixed activity states, date ranges/validation, and existing PostgreSQL RLS/import safety. The expanded admin browser test uses mocked HTTP to check draft import/reruns, populated sections, status filtering, summary edits, changed dates, archiving, linked image/PDF uploads/preview/refresh, new planned milestones, anonymous isolation, and mobile overflow. These are separate from live authenticated Supabase acceptance.

On the actual preview/production site, sign in yourself, import the brief, edit one draft, attach a test image/PDF, refresh, and verify the saved information and signed downloads. Confirm anonymous visitors cannot read private drafts/files. No live research import/write or authenticated persistence test was performed during implementation.
