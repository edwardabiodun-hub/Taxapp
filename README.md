# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

### Read-only tax support assistant deployment

Apply `supabase/migrations/20260929000000_support_chat_contract.sql` to the target Supabase project before deploying the `support-chat` Edge Function. Deploy the function and verify its configuration before publishing the frontend (including a Netlify preview). The assistant is available only to authenticated users; a browser session supplies the caller's Supabase bearer token.

Configure the following in the Supabase Edge Function environment. These are configuration names, not values to put in this repository:

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Target Supabase project URL. |
| `SUPABASE_ANON_KEY` | Public Supabase key used with the caller bearer token for account summary RPCs. |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge-Function-only key for approved public knowledge retrieval and rate-limit counters. Never use it for caller summaries, expose it to Vite/Netlify frontend variables, send it to the browser, or commit it. |
| `APP_ORIGIN` | The exact HTTPS frontend origin permitted by the function's CORS policy. Configure the preview origin separately when testing a preview environment. |
| `RATE_LIMIT_SALT` | Private salt for account and IP rate-limit keys. |
| `LLM_API_URL` | HTTPS chat-completions endpoint for the server-side provider adapter. |
| `LLM_API_KEY` | Provider credential; Edge Function only. |
| `LLM_MODEL` | Model identifier accepted by that endpoint. |
| `LLM_ALLOWED_HOSTS` | Comma-separated allowlist of exact provider hostnames for `LLM_API_URL`. Use hostnames only: no schemes, ports, paths, IP literals, wildcards, or subdomain matching. |

At the network boundary, verify that Edge Function egress/firewall rules block private, loopback, and link-local destinations even if an allowlisted hostname's DNS answer changes. The exact-hostname application allowlist is necessary but does not prevent DNS rebinding; a one-time DNS lookup is insufficient. Confirm that the provider endpoint cannot redirect requests to another destination.

The frontend build uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase access. Keep model and service-role credentials out of all `VITE_*` variables, frontend build settings, browser bundles, and browser requests. Complete the [support assistant QA checklist](docs/superpowers/plans/2026-09-29-read-only-tax-support-assistant-qa.md) on the deployed preview before any production release decision.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
