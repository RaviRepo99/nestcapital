<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/eacb0df0-0d7b-4b27-a757-c126be8af863

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase email verification

Copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`. Run `supabase/schema.sql` in the Supabase SQL
editor, then enable email authentication in Supabase Auth.

For a 6-digit code, set the Supabase **Confirm signup** email template to
include `{{ .Token }}`. Registration uses Supabase Auth, and the verification
page validates it with `verifyOtp({ type: 'email' })`. The page accepts both
6-digit and 8-digit tokens, depending on the Supabase Auth OTP length setting.

### When the confirmation email does not arrive

1. In Supabase Dashboard, open **Authentication > Providers > Email**, enable
   Email provider and **Confirm email**.
2. Open **Authentication > Email Templates > Confirm signup** and ensure the
   template contains `{{ .Token }}`. Do not use only `{{ .ConfirmationURL }}`
   when using the code input in this app.
3. Open **Authentication > URL Configuration** and add the deployed app URL to
   **Site URL** and **Redirect URLs**. For local development add
   `http://localhost:3000/**`.
4. Check **Authentication > Users** for the address. If an old unconfirmed
   record exists, delete it before registering again. Supabase rate-limits
   repeated requests, so wait for the resend timer and check Spam/Junk.
5. The default Supabase SMTP service is for testing and has low limits. For
   real users, configure a custom SMTP provider under **Project Settings >
   Authentication > SMTP Settings**.

The SQL diagnostic and cleanup queries are in
`supabase/email-verification.sql`. SQL can inspect/delete stale Auth users,
but it cannot configure SMTP or make an email provider deliver messages.
