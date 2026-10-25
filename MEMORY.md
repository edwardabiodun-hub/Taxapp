# FileSmart project memory

## Global Memory

Read ~/.Codex/AGENTS.md for memory rules and topic files.

## Project notes

- 2026-10-25: `taxapp/main` is the canonical app integration base. The fuller website checkpoint is `ded1a53` on `codex/full-website-checkpoint-20261025`; do not merge it wholesale because it predates Supabase authentication and the newer app features.
- 2026-10-25: The public website is `https://www.filesmartnaija.com/`; `https://filesmart-demo.netlify.app/` is the app demo. Keep their build and release decisions separate.
- 2026-10-25: The 2026 Nigeria Tax Act PIT calculation is the applicable estimate for 2026 onward. Rent relief is 20% of qualifying rent with the **relief** capped at ₦500,000. Ambiguous income cases withhold numeric estimates while allowing preparation to be saved.
- 2026-10-25: Launch waitlist gating is opt-in through `VITE_FILING_LAUNCH_PHASE=true` for the public website; the app demo defaults to its filing workflow. This frontend flag is a product gate, not a security control for any future submission API.
- 2026-10-25: Never commit `.env` or generated `dist`/cache files. Supabase Edge Function secrets stay server-side.

See [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) for setup, verification, release gates, and current risks.
