# PBT password recovery

Production: https://sixthgearsdt15-pbt.vercel.app

## User workflow

1. Open **Admin workspace → Forgot your password?**, or visit `/forgot-password`.
2. Enter the email for the existing team account and select **Send recovery email**. The confirmation deliberately does not reveal whether an account exists.
3. Open the newest email's recovery link. PBT verifies the callback with Supabase, removes credentials from the address bar, and shows **Choose a new password**.
4. Enter and confirm a password of at least eight characters. Supabase still enforces the project's configured password policy. Save, then continue to the admin workspace. Memberships and roles are unchanged.

A verified reset screen can be refreshed in the same browser tab. PBT records only the recovery user's ID in session storage; the Supabase SDK manages the authenticated session. An ordinary signed-in session without a recovery marker does not open the reset form. Session loss or an account change returns to the email request form.

Expired, invalid, and already-used recovery links show a clear message and a way to request another email. Old links cannot be revived by changing the website. Do not forward recovery links or paste them into chat/issues; they contain account-access credentials.

## Supabase settings to verify

No database migration, role change, Storage policy change, service-role key, or reduced security setting is required for this fix.

In **Authentication → URL Configuration**, keep the production **Site URL** set to:

```text
https://sixthgearsdt15-pbt.vercel.app
```

Ensure the following exact URL is permitted under **Redirect URLs**:

```text
https://sixthgearsdt15-pbt.vercel.app/reset-password
```

The website requests recovery emails with `/reset-password` on its current origin. If testing email delivery from an approved Vercel preview or localhost, explicitly allow that environment's exact reset URL too. Production recovery links also work when Supabase falls back to the root Site URL, provided the callback includes `type=recovery`. No Vercel project/domain changes are needed.

The default Supabase **Reset Password** email template should keep its `{{ .ConfirmationURL }}` link, which redeems the email token at Supabase before redirecting to PBT. Do not replace it with a plain website link. The website also supports an existing custom template using `/reset-password?token_hash={{ .TokenHash }}&type=recovery`; changing to that format is optional. PKCE `code` callbacks on `/reset-password` require the original browser's verifier; a missing/expired verifier offers a new email instead of accepting an unrelated session.

If a newly requested link is already expired, check email delivery delays, whether an older email was opened, whether the link was already redeemed, and whether email security software prefetches links. Verify the template and delivery provider in Supabase. Do not increase expiry or disable security checks to compensate for an application error. Keep the existing account/password policies.

## Verification

Automated checks use the real browser SDK with mocked Supabase HTTP responses. They cover implicit recovery tokens, one-time PKCE and token-hash exchanges, expired/malformed redirects, an existing unrelated login, refresh, password confirmation/policy errors, password update, unchanged admin controls, recovery email requests/rate limiting, URL cleanup, and mobile layout. They send no real email, change no live password, and write no live research.

```bash
# Terminal 1, using test placeholders only:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-public-placeholder npm run dev -- --port 3001
# Terminal 2:
npm run test:browser:recovery
node tests/admin-browser.mjs
```

Use `RECOVERY_BASE_URL` to change the recovery test's website URL. Do not run these mocked tests against production: their fake auth endpoint is intentionally local.

For live acceptance after the PR preview/production deployment, use a dedicated existing team test account. Request one new recovery email from the actual site, open it, refresh the verified reset form, choose a new password, and confirm it saves. Sign out and sign in with the new password; verify the account has the same role and research access. Open an expired email to confirm the replacement-email workflow. Do not reset another teammate's password for testing. No live account/password or Supabase dashboard settings were changed during implementation.
