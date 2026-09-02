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
page validates it with `verifyOtp({ type: 'email' })`.
