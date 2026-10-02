# Welcome Screen, Auth Routing, Email Verification & Forgot Password — Design

## Context

The user shared a mockup ("Welcome to FileSmart" — bird-mark logo, tagline, illustration, Sign In / Create account buttons, a static "Features" list) and asked to wire it up as the entry screen users see when they click into the app, connect it to sign-up, surface an "activate your email" message, and add forgot-password.

None of this exists today. Investigation of `src/App.tsx` found:

- **No welcome/landing screen.** A brand-new user (no local Dexie profile) is forced straight into `Onboarding.tsx`, a 3-step signup wizard that collects email/password *and* full tax-profile info in one flow. There is no explainer screen first.
- **No real routes for auth.** `Login.tsx` (fully built, Supabase email/password sign-in) and the signup wizard are direct-rendered by `AppRoutes`' if/else gating on `hasProfile` (local Dexie) / `isUnlocked` (Supabase session) — there's no `/login` or `/signup` URL, and no way to navigate between them.
- **No forgot-password flow at all** — no page, no route, no `resetPasswordForEmail` call anywhere.
- **Email verification is a toast**, not a screen: `Onboarding.tsx` shows a "Check your email" toast when `signUp()` returns `needsEmailConfirmation: true`, then redirects to `/` (which lands on `Login` since there's no session).

**Scope, confirmed with the user:**
- **Keep the combined signup wizard.** `Onboarding.tsx` continues to collect email/password + profile info in one flow — the Welcome page's "Create account" button leads straight into it, unchanged. Splitting signup from profile collection is out of scope.
- **Dedicated full-screen "Check your email" page**, replacing the toast, so the message survives navigation/refresh and isn't easy to miss.
- **In-app `/reset-password` screen** for the password-reset landing (not Supabase's default hosted page), matching the rest of the app's branding.

## Routing architecture

Today's gating (`src/App.tsx`, `AppRoutes`) is an if/else direct-render chain, checked in this order: loading → `!hasProfile` (forces `/onboarding` only) → `!isUnlocked` (renders `Login` directly, no route) → main app. This changes to:

1. **Loading** → `LoadingScreen` (unchanged).
2. **`!hasProfile && isUnlocked`** (session exists, local profile missing — e.g. reinstall) → straight to `/onboarding`, unchanged. This case is unrelated to first-time discovery and is left exactly as it is today.
3. **`!isUnlocked`** (no session, regardless of `hasProfile`) → a real unauthenticated route table:
   - `/welcome`, `/login`, `/onboarding`, `/check-email`, `/forgot-password`, `/reset-password` all mount as actual `<Route>` entries.
   - Any unmatched path redirects to `/login` if `hasProfile` is true (a returning user on this device, already knows the drill — skip the pitch screen), otherwise to `/welcome`.
   - **Why gate on `!isUnlocked` alone, not `!hasProfile`, for reachability**: `hasProfile` is local-device state (Dexie). A user resetting their password from a different device, or after reinstalling, has no local profile but still needs `/forgot-password` and `/reset-password` to work. Nesting those routes under a `hasProfile` check would break that case.
4. **`isUnlocked && hasProfile`** → main app (unchanged).

This mirrors the existing pattern used for authenticated routes under `AppLayout` — a real `<Routes>` table rather than a new gating mechanism.

## Pages

**`src/pages/Welcome.tsx` (new)** — the mockup screen. Bird-mark logo (reuses the actual asset from the recent Login/header integration, commit `9b94165` — not the mockup's placeholder icon), "Welcome to FileSmart" heading, tagline, illustration. "Sign In" button → `/login`. "Create account" link → `/onboarding`. Features list ("Estimate your taxes", "Track your refund") rendered as static, non-interactive rows — there's no pre-auth destination for them, and inventing fake tap targets would be misleading.

**`src/pages/Login.tsx` (modified)** — add "New to FileSmart? Create account" link → `/onboarding`, and "Forgot password?" link → `/forgot-password`. No change to its existing sign-in logic.

**`src/pages/Onboarding.tsx` (modified)** — on `signUp()` returning `needsEmailConfirmation: true`, navigate to `/check-email` with the submitted email passed via router state, instead of the current toast + redirect to `/`. The `needsEmailConfirmation: false` path (confirmation disabled in the Supabase project) is unchanged — proceeds directly into the app since a session is already established.

**`src/pages/CheckEmail.tsx` (new)** — "Confirm your email to activate your account" messaging, referencing the address from route state (falls back to generic copy if state is missing, e.g. direct navigation). A "Resend email" button calling the new `resendConfirmationEmail` wrapper, with a short client-side cooldown (disable the button ~30s after send) to avoid hammering Supabase's rate limit. A "Back to Sign In" link → `/login`.

**`src/pages/ForgotPassword.tsx` (new)** — single email field. Submits to the new `resetPasswordForEmail` wrapper with `redirectTo: \`${window.location.origin}/reset-password\``. On success, shows a confirmation state (same screen, not a redirect — avoids leaking whether the email is registered by behaving identically either way). Link back to `/login`.

**`src/pages/ResetPassword.tsx` (new)** — lands from the emailed link. Supabase's client (`persistSession: true`, default `detectSessionInUrl: true`) picks up the recovery token from the URL and establishes a temporary recovery session automatically — this is verified against the actual `supabase-client.ts` config during implementation, not assumed. New password + confirm fields, client-side match/length validation, submits via the new `updatePassword` wrapper (`supabase.auth.updateUser({ password })`). On success: toast confirmation, then routed into the app if the recovery session leaves the user unlocked, or to `/login` otherwise. If the page loads without a valid recovery session (expired/reused link), shows an error state with a link back to `/forgot-password`.

**`src/lib/auth.ts` (modified)** — add three thin wrappers matching the existing `signUp`/`signIn` pattern:
- `resendConfirmationEmail(email: string)` → `supabase.auth.resend({ type: 'signup', email })`
- `resetPasswordForEmail(email: string, redirectTo: string)` → `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- `updatePassword(password: string)` → `supabase.auth.updateUser({ password })`

## Error handling

- **Forgot Password**: never reveals whether an email is registered (Supabase itself doesn't error on unknown emails for this call) — success state shown uniformly. Network/rate-limit errors surface as a toast, form stays filled.
- **Reset Password**: expired or already-used recovery link → explicit error state on the page itself (not a toast that can be missed), directing back to `/forgot-password` to request a new one.
- **Check Email / Resend**: resend failures (rate-limited, network) surface as a toast; button re-enables after the cooldown regardless of outcome so the user isn't stuck.
- **Onboarding**: unchanged existing error handling for the signup step itself; only the post-success routing on `needsEmailConfirmation` changes.

## Testing

One `.test.tsx` per new page, following the existing `Login.test.tsx` / `Onboarding.test.tsx` convention (render, key elements present, primary action calls the expected `auth.ts` function, error/success states). Tests for the three new `auth.ts` wrappers added to `auth.test.ts`, following its existing mocking pattern for `supabase.auth.*`.

## Out of scope

- Splitting Sign Up from profile collection (kept combined per the confirmed decision above).
- Capacitor deep-link handling for `/reset-password` on native mobile builds — the web redirect (`window.location.origin`) works for the web build; native deep-linking is a separate follow-up if the mobile app needs it.
- Any change to the `!hasProfile && isUnlocked` (reinstall) path.
- Rate-limiting/abuse protection beyond Supabase's own built-in limits on `resend`/`resetPasswordForEmail`.
