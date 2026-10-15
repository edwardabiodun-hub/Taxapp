# Launch waitlist notification setup

The waitlist migration is already applied to the linked Supabase project. This Edge Function is the server-side sender for the existing `launch_waitlist` table; it sends only records with `status = 'pending'` and `notification_consent = true`, then marks accepted deliveries as `notified`.

## Required one-time setup

1. Create and verify a sender domain in Resend. Use a sender address on that verified domain for `LAUNCH_EMAIL_FROM`.
2. In Supabase Dashboard → Edge Functions → Secrets, set:
   - `LAUNCH_RESEND_API_KEY` — Resend sending-only API key scoped to the verified launch sender domain; keep it server-side. This is intentionally separate from any project-wide `RESEND_API_KEY` used by other services.
   - `LAUNCH_EMAIL_FROM` — verified sender, for example `FileSmart <launch@your-verified-domain.ng>`.
   - `APP_ORIGIN` — the production HTTPS origin only, with no path (for example `https://your-domain.ng`).
   - `LAUNCH_NOTIFICATION_SECRET` — a unique random secret of at least 32 characters. Do not reuse an API key or expose it in the frontend.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by Supabase Edge Functions at runtime; never copy the service-role key into frontend or local Vite variables.
3. Deploy this function from the repository root:

   ```powershell
   npx supabase functions deploy notify-launch-waitlist --project-ref YOUR_PROJECT_REF
   ```

   The function disables platform JWT verification because it uses its own bearer secret. Never invoke it from browser code; `LAUNCH_NOTIFICATION_SECRET` must remain private.

## Send the launch notice

Invoke the function manually only after filing is actually open and the sender/domain are verified. The default batch is 25; `batchSize` can be set from 1–50. Re-run it to process remaining pending records. Resend requests use a stable idempotency key per waitlist record to reduce duplicate sends if the database update fails after provider acceptance.

```powershell
$secretSecure = Read-Host "Function secret" -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
try {
  $secret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
  $headers = @{ Authorization = "Bearer $secret" }
  $body = @{ batchSize = 25 } | ConvertTo-Json
  Invoke-RestMethod -Method Post `
    -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-launch-waitlist" `
    -Headers $headers -ContentType "application/json" -Body $body
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  Remove-Variable secret, headers, body -ErrorAction SilentlyContinue
}
```

The function response contains only processed/sent/failed counts, not recipient addresses. Failed records remain pending for a later retry. Do not run a production invocation as a smoke test: it sends real messages. Use the automated tests instead.

## Current limitations

- This is a manually invoked launch batch, not a scheduled campaign or general-purpose marketing system.
- The current schema has no unsubscribe endpoint or preference center. The waitlist copy therefore promises only the requested launch notice and does not claim an opt-out flow exists.
- Provider delivery and inbox placement require verified sender-domain configuration; code deployment alone does not enable email delivery.

References: [Supabase Edge Function secrets](https://supabase.com/docs/guides/functions/secrets), [Supabase Edge Function configuration](https://supabase.com/docs/guides/functions/function-configuration), [Resend idempotency keys](https://resend.com/changelog/idempotency-keys).
