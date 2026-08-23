# D-Bugger

D-Bugger is a code intelligence workspace for GitHub repositories. It indexes repository context before the first review, runs a check on demand or after a push event, keeps the agent’s console visible, and stores research briefs that can be opened in Gridscape.

## Product flow

1. A user signs in once with a Supabase magic link or continues in local guest mode.
2. The user adds their own GitHub token and provider API key in **Central settings**. Credentials are kept in the browser session and are never hardcoded into the repository.
3. Linking a repository reads the default branch tree, detects the stack, records likely hotspots, and registers a signed GitHub push webhook.
4. The webhook stores a compact event record in Cloudflare D1. The open dashboard consumes that event and runs the next check with the user’s own GitHub and provider credentials.
5. Each check is stored with a score, findings, changed files, pipeline stages, and optional `Co-authored-by: D-Bugger <agent@d-bugger.dev>` attribution.
6. Research briefs can be saved in the user’s workspace and opened as a topic in Gridscape.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app can run without Supabase variables in guest mode. For cloud persistence and magic-link authentication, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the selected Supabase project.

## Supabase

Apply `supabase/migrations/202608230001_dbugger_core.sql` to the project used for this deployment. The migration creates user-scoped tables and row-level security policies for preferences, repositories, checks, research notes, and working-style events.

## Cloudflare Pages and D1

The Pages project is named `dbugger` and builds with `pnpm build` into `dist`. The D1 binding is `DBUGGER_DB`; its schema is in `d1/schema.sql`. The Pages Functions under `functions/api/github` handle webhook verification, secret registration, and recent event reads.

For a new account, update the `database_id` in `wrangler.toml` and attach the same binding to both preview and production deployments. The deployed site is intended to use `https://dbugger.pages.dev`.

## Safety defaults

D-Bugger starts new repositories in review-required mode. It analyzes and reports first; it does not push code or merge pull requests automatically. Co-author attribution is visible in each check report and can be disabled in the settings model before a repository is linked.
