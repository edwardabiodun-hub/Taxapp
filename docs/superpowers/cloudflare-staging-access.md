# Cloudflare staging and preview access

## Current FileSmart setup

The authenticated Cloudflare inspection confirmed:

- Pages project: `filesmartnaija`.
- Custom domains `filesmartnaija.com` and `www.filesmartnaija.com`: active with SSL enabled.
- Git repository setting: **Connect**, so the project is currently Direct Upload rather than Git-integrated.
- Latest deployment preview: `https://59d7aecd.filesmartnaija.pages.dev`.
- Preview response includes `X-Robots-Tag: noindex`.
- Unknown route on that deployment currently returns HTTP `200`, not `404`.

The hash-based `pages.dev` deployment URL is useful for inspection, but it is not a true branch preview environment because the project is Direct Upload. Create a separate staging Pages project or connect this project to Git only after deciding whether the deployment model should change.

## Preferred future path: Git-connected Pages preview

Use this when the Pages project is Git-integrated:

1. In Cloudflare, open **Workers & Pages → the FileSmart Pages project → Settings → Builds**.
2. Confirm the GitHub repository is connected and set the production branch to the intended production branch.
3. Set **Preview branch** to **Custom branches** and include the development/PR branch used for staging.
4. Push the reviewed branch or open a pull request from the same repository. Cloudflare Pages will create a hash-based preview URL and a branch alias such as `branch-name.<project>.pages.dev`.
5. Open the deployment details and copy the preview URL into the repository variable `CLOUDFLARE_STAGING_URL`.
6. Run `npm run verify:cloudflare -- https://<preview-url>` before treating the deployment as staging-ready.

Cloudflare preview deployments are intended to be separate from production and include `X-Robots-Tag: noindex` by default. Keep the preview protected if it contains anything beyond public demo content.

## Protecting the preview

In the Pages project, open **Settings → General → Enable access policy** for preview deployments. Allow only the owner's email address or approved team members. Do not expose taxpayer data, production credentials, or live payment credentials in a preview.

## Current safe path for Direct Upload

Direct Upload projects do not provide Git-connected branch previews. Use a separate staging Pages project, or create a controlled preview deployment with Wrangler using a scoped deployment credential. Do not point the production custom domain at the staging project.

For a deployment-only API token, use the account-scoped Cloudflare Pages permission with the minimum required access. `Pages Read` is sufficient for inspection; `Pages Write` is required to create or update deployments. Store the token only in the local secret store or CI secret manager; never commit it or place it in `.env` files tracked by Git.

## Access request to send to the Cloudflare account owner

> Please add me to the FileSmart Cloudflare account with the minimum access needed to inspect Pages deployments and preview URLs. For validation only, Pages Read is sufficient. If I must deploy the approved staging build, grant Pages Write scoped to the FileSmart Pages project or provide a short-lived, repository/CI-scoped token. Please do not grant Super Administrator access or share a personal API token.

## Required handoff values

- Cloudflare Pages project name.
- Preview URL.
- Production branch name.
- Preview branch name.
- Whether the project is Git-integrated or Direct Upload.
- Test-only environment variables, if the preview requires them.
- Confirmation that the preview is protected or intentionally public.
