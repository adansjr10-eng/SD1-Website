# PBT

Passenger rail bearing tester and primary suspension engineering knowledge base, built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase.

For the new engineering sections, additive migration, private draft import, and editorial review workflow, see [docs/PROJECT_CONTENT.md](docs/PROJECT_CONTENT.md).

For the GitHub → Vercel deployment process, see [DEPLOYMENT.md](DEPLOYMENT.md). For local testing and the administrator acceptance workflow, see [PREVIEW.md](PREVIEW.md).

## Run locally

Use Node.js 24, matching the runtime pinned for Vercel.

```bash
npm ci
npm run dev
```

The development server listens on port 3000. For production, run `npm run build`, then `npm start`. The repository is already isolated in cloud tasks; use the existing checkout rather than creating a worktree.

Without Supabase variables, the site runs in **read-only demonstration mode**. Search, numeric filters, unit conversion, comparison, CSV export, technical notes, project documentation, and mobile navigation work. Sample tester records and concept drawings are explicitly illustrative, with unknown manufacturer ratings left blank. No browser-only edits are claimed as persisted. The project brief's 120 mph target, hydraulic loading, sensor selection, and LabVIEW are preliminary considerations; no wheel diameter, engineering calculations, manufacturer ratings, standards, or citations have been invented.

## Connect Supabase

1. Create a Supabase project. In its SQL editor execute `supabase/verify.sql` to inspect existing tables and policies. For a new database, execute `supabase/schema.sql` **once**. It creates tables, validation triggers, indexes, policies, and a private `research-files` bucket. Do not rerun it over an existing schema without reviewing a migration first. Then execute `supabase/admin-diagnostics.sql` to enable read-only configuration checks for authorized editors/admins; this additive migration can be rerun.
2. Optionally run `supabase/seed.sql` once to populate demonstration examples and the initial project brief. Skip this for an empty research library. Seed generation is available via `npm run seed:generate` when demonstration content changes.
3. Create an ignored `.env.local` on your computer, or use cloud/hosting environment settings. The required variable names are documented below; environment files are not committed. Set `NEXT_PUBLIC_SUPABASE_URL` to the **root** project HTTPS URL, such as `https://<project-ref>.supabase.co`, without `/rest/v1/`, a dashboard path, or a chat URL. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the same project's public anon/publishable key. These two values are intentionally public in the browser; **never use a service-role or secret key**. Do not commit `.env.local`.
4. In Supabase Authentication, disable public sign-ups and create or invite team users. Grant each authorized user membership through the SQL editor:

   ```sql
   -- Replace the UUID with the actual Authentication user ID.
   insert into public.members(user_id, role)
   values ('REPLACE-WITH-USER-UUID', 'editor');
   ```

   Alternatively, edit the explicit UUID and role in `supabase/grant-team-access.sql` and run it in the SQL editor. The unchanged template refuses to grant access.

   Supported roles: `viewer` reads published team content; `editor` and `admin` manage content. Membership changes deliberately require a trusted Supabase administrator. No browser client can grant itself membership. Password resets and invitations are handled in Supabase Authentication; configure its email delivery and redirect URLs for your deployment.

5. Restart the development server, or **rebuild** the production app after setting public variables. Next.js embeds public variables during build.
6. Sign in through **Admin workspace**, create a draft, edit its content, then publish when ready. Choose public or team-only visibility. Test with an anonymous window and a separate viewer account before deployment.

In restricted cloud networking, allow your exact `<project-ref>.supabase.co` hostname (or configured custom Supabase hostname) for authentication, REST, and storage. Package installation uses `registry.npmjs.org`. Publishing environment variables does not create database tables, storage buckets, or authorized team users. Check these separately before using the admin workspace. The application refuses malformed URLs and privileged browser keys instead of silently showing demonstration data for an invalid backend.

Password recovery is available through **Admin workspace → Forgot your password?**. See [the recovery setup and acceptance guide](docs/PASSWORD_RECOVERY.md) for the production redirect URL and testing steps.

## Check the Supabase connection

Open **Admin workspace → Supabase connection checks → Check connection**. Signed-in editors/admins can also use **Run storage & persistence test** to run the real upload and database verification with their current session; no separate test password needs to be shared. The panel reports configuration, research-table access, authentication state, and (for authorized editors/admins) RLS/policy presence and private bucket settings. Policy-name checks are configuration evidence; they do not replace access tests. Bucket checks do not write files or prove persistence. Anonymous users cannot inspect private bucket metadata.

```bash
# With public variables supplied through the environment:
npm run check:supabase
```

The command makes read-only API calls and never prints credentials or research records. For Node 24 behind the cloud proxy, run `NODE_USE_ENV_PROXY=1 npm run check:supabase`. Environment variable names and URL/key format are checked before any request. Local `.env.local` files are loaded by Next.js, but these standalone CLI scripts use exported process variables.

For a live end-to-end check, create a dedicated test account with editor membership, and supply `RAIL_TEST_EMAIL` and `RAIL_TEST_PASSWORD` securely in environment settings (not in chat, command arguments, or committed files), along with the public Supabase configuration:

```bash
NODE_USE_ENV_PROXY=1 npm run test:supabase
```

This opt-in test creates a uniquely tagged **team-only draft**, edits numeric specifications, re-reads them from PostgreSQL, uploads tiny image/PDF fixtures, downloads and compares the stored bytes, checks anonymous isolation, creates a signed link, and deletes its own files and records. Temporary fixture values are not engineering data. The test never lists/deletes existing research. If cleanup is blocked, it reports the test object paths and record IDs for a project administrator to remove. Missing test-account credentials or network access cause a failed/unrun workflow, not a passing result.

For a manual acceptance test, sign in as an editor, create a tester draft, enter known specifications, upload an image and a PDF, edit each caption, refresh the browser, preview/download both files, then delete the attachments and tester. In a private browser window, confirm the team draft cannot be read or downloaded. Repeat as a viewer and confirm there are no edit/upload/delete controls and database writes remain denied. Sign-out clears loaded team records and open editing/preview dialogs.

## Supabase setup checklist

- **Database:** `entries`, `resources`, and `members` exist with RLS enabled. `specs` stores editable technical data; entry kinds organize testers, bearing information, suspension, project notes, and updates.
- **Authentication:** email/password provider enabled; public sign-ups disabled for invite-only teams; intended users created/invited and given explicit membership. A successful sign-in alone does not authorize content management.
- **Storage:** `research-files` is private, has a 26,214,400-byte limit, permits image/PDF and supported attachment MIME types, and has the Storage policies from `schema.sql`.
- **Diagnostics:** apply `admin-diagnostics.sql` after the schema. It is a guarded metadata-only function, not a privileged content API.
- **Networking:** allow the exact project API hostname in cloud environment settings, save changes, and publish. Draft saves alone do not apply network changes.
- **Deployment:** set the root API URL and public key before rebuilding. Configure Supabase Site URL/redirect URLs and email delivery for actual invitation/password-recovery URLs when deploying.

For the dedicated progress page, review-draft import, milestone editing, and archive workflow, see [docs/PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md).

For Home/Overview descriptions, profile photos, selected imagery, and publication steps, see [docs/HOME_OVERVIEW.md](docs/HOME_OVERVIEW.md).

## Content management

- **New entry** supports testers, bearing information, suspension, project sections, research notes, and project updates. Categories are editable free text with suggestions from existing entries; tags are comma separated.
- The research-note editor provides Markdown bold, italic, headings, lists, links, and preview. HTML is disabled. References must be HTTP(S) URLs.
- Unknown technical specifications should stay blank. Numeric values are stored as RPM, km/h, and kN. Comparison display supports mph and lbf. Dimensions/footprint is free text: record explicit units such as mm or inches; automatic dimension conversion is not performed.
- Drafts are visible only to editors/admins. Viewers can access published team records. Anonymous visitors see published public records.
- Project sections can be separate entries, or headings in the original project brief. Add `update` entries for dated progress notes; published updates appear on the design timeline. The progress timeline uses activity dates entered by the team; unknown dates remain unspecified.
- Upload multiple images, PDFs, presentations (after the project-content migration), CAD, spreadsheets, or notes; set captions, category, tags, linked entry, visibility, and publication status. Attachment metadata can be edited from its row in the resource library.
- Files persist in Supabase Storage; metadata persists in PostgreSQL. Images open in a zoomable preview and PDFs in a browser frame. Other attachments are downloaded. Browser support determines PDF rendering.
- Replace a file by uploading its replacement, checking it, then deleting the outdated attachment. Removing an entry with attachments is blocked until attachments are explicitly reassigned or deleted.
- A linked attachment is publicly readable only when **both** the attachment and parent entry are public and published. Do not unlink a confidential file and publish it as public accidentally.
- CSV exports include demonstration warnings, unknown-value markers, quoted values, and spreadsheet formula neutralization.

## Security and storage

Authorization is enforced by PostgreSQL row-level security and Storage policies, not by hiding controls. Browser access uses the user's Supabase session and public key. The private bucket serves short-lived (120-second) signed URLs only after policy authorization. Already-issued links remain usable until expiry. Bucket uploads are limited to 25 MB and supported MIME types; storage paths additionally enforce allowed extensions and UUID prefixes. SVG, HTML, executables, and ZIP files are not accepted. Common CAD formats with unknown browser MIME use `application/octet-stream`.

Uploads validate file size, extension, and supported image/PDF MIME types. This is not malware scanning or binary content inspection. Downloaded CAD/Office files are untrusted attachments; additional scanning can be added if needed by the institution. Keep regular Supabase database and bucket backups. Do not make the bucket public or disable RLS.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

`npm test` covers search, unknown-value filters, conversions, CSV escaping, file validation, and the migration's RLS policies. The policy integration test runs PostgreSQL in PGlite with minimal simulated Supabase auth/storage schemas. It checks anonymous vs. viewer vs. editor access, draft isolation, linked-file protection, membership escalation rejection, and forbidden uploads. It does not replace a live Supabase test.

Browser checks use system Chromium, or `CHROMIUM_PATH`:

```bash
# Terminal 1: production server with Supabase variables unset
npm start
# Terminal 2
npm run test:browser
```

This exercises dashboard rendering, search, filters, comparison, real CSV download, detail and library pages, backend configuration empty state, mobile navigation, overflow, and browser errors. `BASE_URL` changes the target; screenshots are saved under `/tmp/rail-desktop.png` and `/tmp/rail-mobile.png`.

The admin UI contract test uses mocked HTTP responses, not a real backend:

```bash
# Separate dev server; these values are test placeholders, not credentials.
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-public-placeholder npm run dev -- --port 3001
# Another terminal
node tests/admin-browser.mjs
```

It checks login, draft creation, edits, publishing, multi-file upload requests, image preview/zoom, deletes, connection diagnostics, sign-out, and viewer UI restrictions. Do not use these placeholder variables for your main app. After configuring a real Supabase project, verify the same flow including downloading the stored file after a browser reload and checking access as an anonymous visitor and viewer.

## Structure

- `components/workspace.tsx`: application navigation, library, comparison, editors, authentication, uploads.
- `components/diagram.tsx`: local illustrative schematic; no external image dependency.
- `lib/data.ts`: domain types, clearly labeled demo records, filtering, conversions, CSV and upload validation.
- `lib/supabase.ts`: optional browser client.
- `supabase/schema.sql`: database and private Storage policies.
- `supabase/seed.sql`: optional initial content.
- `tests/`: domain, PostgreSQL policy, and browser workflow checks.
