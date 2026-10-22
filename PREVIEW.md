# Launch and test RAIL LAB

The cloud onboarding runtime can run the app for internal validation but does not expose a shareable browser preview. A local development server or a Next.js hosting deployment provides an interactive site where you can use your own Supabase administrator account. Use the GitHub repository as the source; environment files, build outputs, and dependencies are excluded from commits.

## Simplest hosted preview: GitHub and Vercel

Follow [DEPLOYMENT.md](DEPLOYMENT.md). Review/merge the website pull request, import `adansjr10-eng/SD1-Website` in Vercel, add the two public Supabase variables, and deploy. No downloadable archive is needed. Vercel provides the actual HTTPS preview/production URL.

## Run on your computer (optional)

Clone the GitHub repository after merging the website changes and use Node.js 24. Create an ignored `.env.local` containing the variable names below, filling in the URL and public key from your Supabase project. Do not commit this file:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the root project API URL without `/rest/v1/`, and only a publishable/anon key. Then run:

```bash
npm ci
npm run dev
```

Open the development address printed by Next.js in a browser on that computer. Choose **Admin workspace** and sign in with your authorized Supabase account. Restart development or rebuild after changing public variables. Never use a service-role key in a public variable.

## Check storage with your signed-in administrator account

1. Open **Admin workspace → Check connection**. It should report the research tables and current session as reachable. The signed-in diagnostic RPC verifies RLS, expected policy names, and the private `research-files` bucket's settings. Anonymous bucket listings cannot prove a private bucket is missing.
2. Click **Run storage & persistence test**. This performs actual requests using your session: create/edit/re-read a temporary team-only tester; publish it for the team; confirm anonymous readers cannot access it; upload a small valid PNG and PDF; save and re-read their metadata; compare downloaded bytes; create preview links; delete only this run's test data. The button does not modify existing research. It displays cleanup instructions if a test fails and its data cannot be removed.
3. If diagnostic setup is incomplete, run `supabase/verify.sql` in the Supabase SQL editor. The site needs a **private** `research-files` bucket, a **26,214,400-byte** upload limit, allowed JPG/PNG/WebP/PDF and supported attachment MIME types, and the Storage policies defined in `supabase/schema.sql`. Do not rerun the entire schema over existing tables. Apply `supabase/admin-diagnostics.sql` if the diagnostic function is missing.

## Test your own research entry and refresh

1. Select **New entry**, choose **tester**, fill in title, organization, known specifications, research notes, and sources. Leave unknown values blank; save a **team-only draft** first.
2. Edit a field and save again. Refresh the browser and confirm the changed field remains saved. Navigate to **Bearing testers**, open the record, and inspect the specification table.
3. Use **Upload files**. Choose an image and PDF; select the tester under **Related research entry**; supply captions and choose team-only visibility. Save them as drafts or publish them to the team.
4. Open **Documents & gallery**, refresh, and confirm both attachments remain. Preview the image/PDF and download the originals. Edit each caption, refresh, and confirm it persists.
5. Open a private browser window without signing in. Confirm the team-only tester and attachments cannot be accessed. Public tester pages require both published status and public visibility; linked public files additionally require their parent entry to be public and published.
6. Remove any disposable attachments before deleting their tester. Real research is never deleted automatically by the acceptance test.

Supabase email/password authentication and all three application tables were reachable during the latest cloud check. Public signup was enabled; disable it under Supabase Authentication if access should be invite-only. Creating a new account does not itself grant editing permission: membership remains controlled by the `members` table and RLS. Live administrator uploads/storage verification require a signed-in session and have not been claimed based only on anonymous checks.
