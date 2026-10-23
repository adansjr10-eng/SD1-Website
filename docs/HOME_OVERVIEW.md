# Home, Project Overview, and team profiles

The existing `/`, `/project`, and `/team` routes now share an engineering portfolio presentation. Home is a short introduction with project/progress/team links and four previews. Overview has the longer introduction, three research-context cards, proposed functions, a bogie reference, objectives, published progress highlights, team/advisors, and a selected gallery. The sidebar, blue/white palette, PBT browser title, research sections, progress system, authentication, RLS, and Vercel project/domains are retained.

## Sources and initial content

The accessible attachment was the pasted Home/Overview request. These source materials were **not available** in the workspace:

- `SDI_MidtermSlides.pptx`
- `SDI T15 PROJECT SUSPENSION PROPOSAL (4).pdf`
- `2026 FALL SDI T15 TRACKING.pdf`
- Passenger bogie reference image

No original figures, CAD images, prototype photographs, team/advisor photographs, or document-page citations were extracted. The blue hero illustration is an original display of proposed functions, explicitly labeled as conceptual and not a final mechanical layout. It has no dimensions, equipment ratings, or bogie identification. The bogie section uses a compact review placeholder until an approved image is deliberately selected; it does not identify the acquired bogie or imply delivery.

The public project-purpose introduction supplied in the request provides a usable Home fallback. A published Home entry overrides it. Fuller descriptions, objectives, individual profiles, optional fields, and selected images use Supabase-backed records. No private brief or generated team directory is committed in the public repository.

Local preparation of the supplied brief generated **11 private review drafts**:

- One Home introduction and one Overview presentation.
- Six individual member profiles, with empty student roles, biographies, LinkedIn URLs, and photo selections.
- Three advisor profiles with only the names and roles supplied by the owner.

The Overview draft includes three context cards, five proposed functions, six objectives, and the bogie caption/note. Every draft attributes the owner brief and relevant section. Its source date remains blank because no date for this particular brief was established. The historical as-of date in the progress instructions is not reused as the brief's publication date.

No duplicate progress records are created. Both pages reuse **published**, non-archived milestone/bogie records from the existing Project Progress data. Passing dates do not change activity statuses. Administrators may select up to four highlights; otherwise the latest three eligible records appear. An explicitly selected draft or unavailable record is omitted, not automatically published.

## Prepare, review, and publish

1. Open the PR preview or merge the PR and wait for its normal Vercel deployment.
2. Sign in through **Admin workspace** as the existing editor/admin.
3. Expand **Prepare project drafts → Open import preparation**. Paste/load the complete Home/Overview request, including its Section A–H headings.
4. Preview the 11-record plan, then import as **team-only drafts**. Previewing saves nothing. Existing import keys skip reruns without overwriting prior edits/deletions. Existing project and team-directory records remain saved.
5. Review Home and Overview while signed in; a draft description is identified as an editorial preview. Edit the page through **Edit page content**. Title and Summary supply its heading/introduction. The presentation controls supply research-context cards, main/bogie images, captions/notes, selected gallery images, and featured updates. Existing objective and WHAT-function lists remain editable below.
6. Review each person on **Our Team** or the Overview team section. Use **Edit profile** for full name (entry Title), role, biography, LinkedIn URL, order, and photo selection. Leave unverified personal details blank.
7. Publish each approved entry with the intended **Team/Public** visibility. Home, Overview, individual profiles, and image resources are independent publication decisions. Review anonymously before announcing availability.

Optional local preparation uses the existing command:

```bash
npm run content:prepare -- /absolute/path/to/home-overview-brief.txt
```

It writes ignored `private-imports/presentation-drafts.json`, which can be loaded in the same importer. The full brief, generated bundle, and original source documents stay out of Git/Vercel artifacts. Existing broader-project and progress-brief preparation still work.

## Upload or replace a team photo

1. Save the individual profile first. Select **Upload photo** on its card; the related-entry field is preselected to that person.
2. Upload a supported raster image, add a caption/citation, and confirm **Team-owned and approved** or **Reuse permission confirmed** only after reviewing rights. Keep it draft/team-only during review.
3. Return to **Edit profile → Team member photo**. Choose the uploaded, approved image and save. Only images linked to that person's entry are eligible. Unselected/unapproved images never replace initials placeholders automatically.
4. Preview the result while signed in. To show it publicly, publish both the profile and its image resource with public visibility. A published profile does not publish its draft photograph.
5. For replacement, upload/check the new file, select it on the profile, then remove the old resource only when appropriate. Clearing the selection restores the initials placeholder without deleting the file.

No individual or advisor photographs are supplied by this change. Student responsibilities, biographies, and external profiles are not invented. LinkedIn fields accept only HTTPS LinkedIn URLs.

## Main imagery, bogie reference, and gallery

Upload images through Documents & Gallery, a related progress/design record, or **Upload reference for review** on Overview. Confirm captions, attribution, reuse rights, parent linkage, publication, and visibility. Then select them through **Edit page content**:

- **Main project image:** replaces the conceptual hero illustration for that page.
- **Passenger bogie reference image:** displays with the editable caption and pending-identification note. Do not describe it as the actual acquired bogie without source verification.
- **Featured gallery images:** explicitly select up to six approved images. Captions/citations come from resource metadata, and related-record links remain available.

The picker and renderer require approved reuse metadata. Public display also requires eligible published resources and parent records. Files remain in the existing private bucket and use authorized, short-lived signed URLs, including zoom previews. No public bucket or image optimization cache is introduced. Rights metadata records the editor's decision; it does not independently establish copyright permission.

## Deployment and acceptance

No new SQL migration is needed: optional presentation/profile data uses the current `details` JSON field. If a separate environment lacks the previous structured-content migration/RPC, apply only `supabase/migrations/202610_project_content.sql`; do not rerun the initial schema/seed. No live import, database write, membership change, or bucket-policy change was performed during implementation.

Review the PR and preview, merge into `main`, and wait for the existing Vercel production deployment. Verify Home's three hero links, Overview's sections, published progress reuse, six published member cards with neutral placeholders, advisors, image zoom/captions, mobile navigation, and Admin editing. Check desktop, tablet, and mobile. Confirm drafts and private photographs are absent anonymously, and that signed-in team access remains unchanged.

Automated validation separates local PostgreSQL/RLS tests and browser tests with mocked Supabase HTTP from live account/storage acceptance. Complete an actual signed-in save/upload/refresh test on the deployed site before relying on public publication.
