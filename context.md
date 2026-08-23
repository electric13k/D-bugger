# D-Bugger Repository Context

> **Read this file first in every future AI session.** It is the compact handoff for the current repository state and is intended to prevent unnecessary full-repository re-reading.

## Snapshot

| Field | Current value |
|---|---|
| Repository | `electric13k/D-bugger` |
| Local checkout | `/home/ubuntu/D-bugger` |
| Default branch | `main` |
| Latest commit | `3e44cdc172024fea29c20224e31aeb28c5330819` |
| Latest commit message | `refactor: use Cloudflare D1 for workspace state` |
| Framework | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Hosting | Cloudflare Pages project `dbugger` |
| Primary domain | https://dbugger.pages.dev |
| Latest verified deployment | https://df2afbf4.dbugger.pages.dev |
| Database | Cloudflare D1 database `dbugger-events` |
| D1 database ID | `5a680e0e-362a-4ee1-9f53-d29121005a60` |
| Pages binding | `DBUGGER_DB` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Co-author identity | `D-Bugger <agent@d-bugger.dev>` |
| Last verified | 2026-08-23 |

## Product purpose

D-Bugger is a code intelligence workspace for GitHub repositories. The intended flow is context-first: link a repository, analyze its tree and technology stack, register a signed push webhook, run a code check for the first commit and every later push, show the agent activity in a visible console, and save research briefs that can be opened in Gridscape.

The UI is a dark, animated command-center dashboard with five main sections: Overview, Repositories, Checks, Agent console, and Research. A generated visual asset is served from `public/dbugger-hero.png` and used in the Overview hero.

## Current architecture

D-Bugger is **Cloudflare-only** for persistence. Do not reintroduce an external SQL provider or email sign-in flow unless the user explicitly requests a new architecture.

The browser creates a stable anonymous workspace ID in `src/lib/cloudflare.ts`. The ID is stored in local storage and sent to Pages Functions as the `X-Workspace-Id` header. The browser uses Cloudflare D1 for shared state when Pages Functions are available and falls back to local storage when running locally or when D1 is unavailable. Provider API keys and GitHub tokens are intentionally stored only in `sessionStorage`; they are user-supplied and must not be hardcoded or committed.

Cloudflare D1 is not an identity provider. The current design gives users a persistent workspace without repeated email entry. If organization-level login is later required, put Cloudflare Access in front of Pages rather than adding an unrelated hosted SQL/auth dependency.

## Cloudflare Pages Functions

| Route | File | Purpose |
|---|---|---|
| `POST /api/github/webhook` | `functions/api/github/webhook.ts` | Verifies GitHub HMAC signatures and stores push events in D1 |
| `GET /api/github/events?repo=...` | `functions/api/github/events.ts` | Reads recent push events for dashboard polling |
| `POST /api/github/register` | `functions/api/github/register.ts` | Stores webhook secrets in D1 after GitHub hook registration |
| `GET /api/workspace/state` | `functions/api/workspace/state.ts` | Loads state for the current `X-Workspace-Id` |
| `PUT /api/workspace/state` | `functions/api/workspace/state.ts` | Persists repositories, checks, console events, research, and settings |
| `POST /api/workspace/learn` | `functions/api/workspace/learn.ts` | Stores user working-style events in D1 |

The D1 schema is in `d1/schema.sql`. Tables currently include `webhook_secrets`, `webhook_events`, `workspace_states`, and `working_style_events`.

## Important source files

| File | Responsibility |
|---|---|
| `src/App.tsx` | Main UI, dashboard state, repository linking, first check, push polling, settings, console, research, and modals |
| `src/types.ts` | Shared domain types for repositories, checks, research, console events, and settings |
| `src/lib/api.ts` | GitHub tree/commit access, webhook registration, provider-backed code checks, and research calls |
| `src/lib/cloudflare.ts` | Stable anonymous workspace ID and Cloudflare workspace label |
| `src/lib/storage.ts` | D1 state synchronization with local-storage fallback |
| `src/index.css` | Dark visual system, typography, fields, scrollbar, and base styling |
| `src/main.tsx` | React entrypoint |
| `functions/api/github/*` | Signed webhook and GitHub event routes |
| `functions/api/workspace/*` | D1-backed state and learning routes |
| `wrangler.toml` | Cloudflare Pages/D1 binding configuration |
| `d1/schema.sql` | D1 schema source of truth |
| `README.md` | User/developer setup and architecture overview |

## User credentials and data handling

Users enter their own credentials in Central Settings. The provider API key is used for OpenAI-compatible chat completions, and the GitHub token is used for repository tree/commit reads and webhook registration. Both are stored in `sessionStorage`, not in D1, local storage, source code, or deployment variables.

The workspace ID is not an authentication credential. It is a stable browser namespace. Do not describe it as secure account authentication. Do not add a server-side GitHub token or provider key.

## Repository linking and checks

The link flow accepts `owner/repository` or a GitHub URL. It fetches the recursive Git tree, detects a basic language/framework/package-manager profile, records critical modules and vulnerability hotspots, generates a webhook secret, registers the GitHub push webhook, stores the secret through `/api/github/register`, and immediately schedules the first check.

Checks fetch the latest branch commit, optionally call the user’s provider API, otherwise use the safe metadata fallback, record findings/pipeline/score, persist the result, and show the report in the Checks view. A browser polling loop checks `/api/github/events` every 30 seconds and starts a check when a newer push event is found.

The app is review-first. It does not push code, merge pull requests, or make automatic repository changes. Co-author attribution is shown in reports when enabled in the repository model.

## Gridscape research

Research is handled in `src/lib/api.ts`. The user’s provider key is used when available; otherwise the UI returns a clear local fallback brief. Saved notes include a Gridscape URL such as `https://gridscape.pages.dev/?q=...`. The Gridscape repository is `electric13k/Gridscape`.

## Commands

```bash
cd /home/ubuntu/D-bugger
pnpm install
pnpm lint
pnpm build
pnpm dev
```

Before committing, run `pnpm lint` and `pnpm build`, scan for stale branding, and check `git status`. Push changes to `origin main`; Cloudflare Pages is connected to GitHub and redeploys from pushes to `main`.

## Deployment facts

The Cloudflare Pages project is configured with build command `pnpm build`, output `dist`, and the D1 binding `DBUGGER_DB`. The last verified successful deployment was triggered by commit `3e44cdc172024fea29c20224e31aeb28c5330819` and used the D1 binding above.

When changing D1 schema, update `d1/schema.sql` and apply the migration to the existing D1 database through the Cloudflare API or Wrangler. Do not create or restore unrelated database projects. Do not modify other repositories or Cloudflare projects without explicit user instruction.

## Known limitations and next sensible improvements

The current workspace identity is anonymous-browser based rather than organization-authenticated. Cloudflare Access is the natural next step if real login, team membership, or protected repository access is required. The browser polling loop is intentionally simple; a future improvement could move check orchestration to a Cloudflare Queue or Durable Object. The code-check fallback is metadata-based when no provider key is supplied; semantic review requires the user’s own provider key.

## AI operating rules

Read this file, `README.md`, `package.json`, `wrangler.toml`, and the specific source files relevant to the requested change before editing. Preserve the Cloudflare D1 architecture. Keep credentials out of commits. Use the existing D-Bugger co-author attribution for commits when appropriate. Validate with `pnpm lint` and `pnpm build`. Update this file whenever architecture, deployment, routes, database schema, or major product behavior changes.
