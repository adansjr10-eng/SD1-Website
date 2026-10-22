# Publish RAIL LAB with GitHub and Vercel

Repository: [adansjr10-eng/SD1-Website](https://github.com/adansjr10-eng/SD1-Website).

No ZIP download, local installation, Supabase service-role key, or Vercel token is required for this process. You will sign into GitHub, Vercel, and Supabase in your own browser.

## 1. Review and merge the website

Review the `feat/rail-lab-vercel-deployment` branch's pull request and merge it into `main`. The branch includes the complete Next.js application, Supabase schema and policy files, tests, and deployment configuration. It is based on the existing `main` history; no force-push is needed.

If a pull request could not be created automatically, visit the repository's **Pull requests → New pull request**, choose **base: main** and **compare: feat/rail-lab-vercel-deployment**, then create and review it. Use a title such as **Launch RAIL LAB research website with Supabase and Vercel**.

## 2. Import the repository into Vercel

1. Sign into [Vercel](https://vercel.com/new) using GitHub.
2. Choose **Add New → Project** and import **adansjr10-eng/SD1-Website**. If it is absent, use **Adjust GitHub App Permissions** to grant Vercel access to that repository.
3. Use the repository root as **Root Directory**. Keep the detected **Next.js** framework, Node.js **24.x**, `npm ci` installation, and `npm run build` build command. Leave **Output Directory** at the framework default.
4. Before selecting **Deploy**, add these environment variables for **Production** and **Preview**:

   | Name                            | Value to enter in Vercel                                    |
   | ------------------------------- | ----------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://nzdgesdofvjlspdqclox.supabase.co`                  |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The same Supabase project's **publishable** or **anon** key |

   Copy the public key from Supabase's API settings directly into Vercel. Do not put it in GitHub source, a pull request, or chat. Never use a `service_role` or `sb_secret_` key. Do not add your account password to Vercel. No `RAIL_TEST_PASSWORD` is needed for ordinary use or the signed-in acceptance test.

5. Select **Deploy**, then open the HTTPS URL Vercel returns. Do not guess the URL from the project name. If you later change either public variable, **redeploy**: Next.js embeds these values at build time. Missing/invalid variables fail the Vercel build with a setup message, rather than deploying a misleading demonstration site.

Vercel will build pull-request branches as preview deployments after its GitHub integration is installed, and deploy merged changes on the configured production branch (`main`). Cloud onboarding environment variables are not automatically copied into Vercel.

## 3. Finish Supabase authentication configuration

In **Supabase → Authentication → URL Configuration**, set **Site URL** to your actual Vercel production URL. Add the exact callback/site URLs you use for invitations or password recovery to **Redirect URLs**. Only add preview URLs you intend to use for those flows. Existing email/password sign-in does not redirect through a callback.

Confirm email/password authentication is enabled. Disable public account signup if the site should be invite-only. Your existing Supabase account and `members` admin role are reused: importing the website does not create new database users or reset memberships. A signed-in account without editor/admin membership cannot edit research.

## 4. Confirm private storage and persistence

1. Open **Admin workspace** on the Vercel site and sign in with the account you already granted admin membership.
2. Select **Check connection**. Confirm table access, session, policy checks, and the private **research-files** bucket report success.
3. Select **Run storage & persistence test**. It creates only temporary team-only records, edits/re-reads tester specifications, uploads a valid image and PDF, compares downloaded bytes, checks anonymous isolation, and deletes its own test records. It does not modify existing research. Review any cleanup message if a step fails.
4. Create your own test tester entry, upload an image and PDF linked to it, edit a caption/specification, then refresh the page and confirm the changes remain. Use **Documents & gallery** to preview and download the attachments.

The required bucket is **research-files**, **private**, with a **26,214,400-byte (25 MB)** limit and allowed image/PDF/attachment MIME types. Its Storage policies are defined in `supabase/schema.sql`; the tables use RLS. An empty anonymous bucket listing does not indicate a missing private bucket.

If a check fails, run `supabase/verify.sql` in the Supabase SQL editor to inspect the current configuration. Apply `supabase/admin-diagnostics.sql` if the diagnostic function is missing. Do **not** rerun the complete initial schema over your existing tables or turn off RLS/make the bucket public to bypass a failure.

## Validation and troubleshooting

The repository includes:

```bash
npm ci
npm test
npm run build
npm run typecheck
```

The production build includes TypeScript checking. Local tests exercise PostgreSQL RLS and application behavior; mocked browser tests are explicitly separate from live Supabase verification. Admin uploads are verified against your project only after the signed-in acceptance test actually passes.

- **Vercel cannot see the repository:** grant its GitHub App access to `SD1-Website`.
- **Vercel build says configuration is missing:** add both public variables to the deployment's Preview/Production scope and redeploy.
- **A demo workspace appears:** rebuild with the correct public variables; do not treat browser-only sample records as saved research.
- **Login works but editing is unavailable:** check the user's UUID and role in `public.members`; do not grant membership via a public signup form.
- **Upload or delete denied:** inspect the signed-in diagnostics and policies. Vercel does not need privileged database credentials; authenticated requests go directly to Supabase under RLS.
- **Changed source is not on the site:** merge the intended PR and check Vercel's latest deployment status and selected production branch.

Environment files, credentials, `.next`, `node_modules`, and `.vercel` local state are excluded from Git. The empty local environment template, if present in a workspace, is ignored as well. The committed documentation lists variable names without embedding the project's public key or private credentials.
