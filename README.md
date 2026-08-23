# D-Bugger

D-Bugger is a code intelligence workspace for GitHub repositories. It indexes repository context before the first review, runs a check on demand or after a push event, keeps the agent’s console visible, and stores research briefs that can be opened in Gridscape.

## Cloudflare-only architecture

The application is deployed as the `dbugger` Cloudflare Pages project at [dbugger.pages.dev](https://dbugger.pages.dev). Cloudflare D1 is the application database. It stores signed GitHub webhook secrets, push events, workspace state, and working-style events. Pages Functions under `functions/api` provide the server-side routes.

There is no external hosted SQL dependency, email sign-in flow, or external team account requirement. On first open, the browser creates a stable anonymous workspace ID and sends it as `X-Workspace-Id`. The workspace ID lets the same user return to the same D1-backed state without repeatedly entering an email. For stronger organization-level identity, Cloudflare Access can be layered onto the Pages project later without changing the application data model.

## Product flow

1. A user opens D-Bugger and receives a persistent Cloudflare workspace identity automatically.
2. The user adds their own GitHub token and provider API key in **Central settings**. Credentials remain session-only in the browser and are never hardcoded into the repository.
3. Linking a repository reads the default branch tree, detects the stack, records likely hotspots, and registers a signed GitHub push webhook.
4. The webhook stores a compact event record in Cloudflare D1. The open dashboard consumes that event and runs the next check with the user’s own GitHub and provider credentials.
5. Each check is stored with a score, findings, changed files, pipeline stages, and optional `Co-authored-by: D-Bugger <agent@d-bugger.dev>` attribution.
6. D-Bugger generates or refreshes `context.md` in the connected repository with a compact AI handoff, then saves research briefs in the workspace and can open them as topics in Gridscape.

## Repository context handoff

For every connected repository, D-Bugger writes `context.md` through the GitHub Contents API. The file includes the latest indexed commit, detected technology profile, architecture summary, critical modules, vulnerability hotspots, AI working rules, and the D-Bugger integration marker. It is created during initial linking and refreshed after later push events. Refresh commits use `[dbugger-context]` so D-Bugger does not recursively check its own generated file.

The GitHub token must have repository contents write permission. Context refresh runs in the user’s browser because D-Bugger intentionally does not store user GitHub tokens server-side. If the browser is closed when a push arrives, the webhook is still stored in D1 and the refresh runs the next time the dashboard is open.

## Local development

```bash
pnpm install
pnpm dev
```

The browser falls back to local storage when the Pages Functions or D1 binding is unavailable, so the UI remains usable during local development. In production, the Pages project binds `DBUGGER_DB` to the D1 database configured in `wrangler.toml`.

## Cloudflare D1

The D1 schema is in `d1/schema.sql`. It creates `webhook_secrets`, `webhook_events`, `workspace_states`, and `working_style_events`. The existing D1 database is named `dbugger-events` and is bound to Pages with ID `5a680e0e-362a-4ee1-9f53-d29121005a60`.

## Safety defaults

D-Bugger starts new repositories in review-required mode. It analyzes and reports first; it does not push code changes or merge pull requests automatically. The only automatic repository write is the managed `context.md` AI handoff, created or refreshed after the user explicitly links a repository and provides a GitHub token with contents write access. Co-author attribution is visible in each check report and can be disabled in the settings model before a repository is linked.
