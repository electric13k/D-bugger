# D-Bugger Repository Context

> Read this first in future AI sessions. This file is the compact handoff for the current repository state.

## Current snapshot

| Field | Value |
|---|---|
| Repository | `electric13k/D-bugger` |
| Local checkout | `/home/ubuntu/D-bugger` |
| Base restored from | User-provided `d-bugger.zip` |
| Baseline restore commit | `8b661d8` |
| Deployment | Cloudflare Pages project `dbugger` |
| Main URL | https://dbugger.pages.dev |
| Database | Cloudflare D1 `dbugger-events` |
| D1 ID | `5a680e0e-362a-4ee1-9f53-d29121005a60` |
| D1 binding | `DBUGGER_DB` |
| Current branch | `main` |

## Important architecture rule

The current UI and component hierarchy are the original program from `d-bugger.zip`. Do **not** replace `src/App.tsx` with a new dashboard and do not redesign the original screens wholesale. Extend the existing components, modals, service layer, and visual system incrementally.

The original program remains the presentation layer: `Navbar`, `Homepage`, `StatsBar`, `RepoList`, `FixRunsList`, `DaemonTerminalLogs`, `CodeDiffModal`, `ReviewPipelineInspector`, `AIThoughtStreamModal`, `EmailReportModal`, `UndoCenterModal`, `SettingsModal`, `BugPlaygroundModal`, `AddRepoModal`, and `ApiKeyPromptModal` are all preserved.

## Current additions on top of the original program

| File | Purpose |
|---|---|
| `src/lib/cloudflareWorkspace.ts` | Stable anonymous browser workspace ID, D1 load/save helpers, working-style event helper, session credential helper |
| `src/lib/repoContext.ts` | GitHub tree/commit analysis, context.md generation, GitHub Contents API write, webhook registration, D1 webhook secret registration |
| `functions/api/workspace/state.ts` | Cloudflare D1 workspace state GET/PUT route |
| `functions/api/workspace/learn.ts` | Cloudflare D1 working-style event route |
| `functions/api/github/events.ts` | D1-backed recent push-event feed |
| `functions/api/github/register.ts` | D1-backed webhook secret registration |
| `functions/api/github/webhook.ts` | Signed GitHub push webhook receiver |
| `d1/schema.sql` | D1 schema for workspace state, learning events, webhook secrets, and push events |
| `wrangler.toml` | Pages build and D1 binding configuration |

## Connected repository behavior

When a user adds a repository through the original `AddRepoModal`, D-Bugger preserves the existing form and then, if a GitHub token is available, fetches the branch tree and latest commit, records a basic technology profile and risk map, writes or updates `context.md` in that repository, and registers a signed push webhook. The generated file is intentionally a compact AI handoff containing the latest commit, branch, detected stack, architecture summary, critical modules, vulnerability hotspots, working rules, and D-Bugger integration notes.

The original daemon heartbeat also polls the D1 event feed. For a newer user push, it refreshes the connected repository’s `context.md` before invoking the original bug-fix/review pipeline. Generated context commits use `[dbugger-context]` and are ignored by the push loop so the app does not recursively trigger itself.

The automatic context write is the only managed repository write. D-Bugger does not automatically push code patches or merge pull requests. GitHub Contents write permission is required for repository context synchronization.

## Credentials and privacy

The user supplies their own GitHub token and OpenRouter/provider key through the original settings and API-key modals. New D-Bugger keys are stored in `sessionStorage`; old `repoheal_*` values are read only as a migration fallback. Do not hardcode credentials, personal email addresses, or server-side provider tokens. Alert email remains optional and is not required for repository linking.

The workspace ID is an anonymous browser namespace, not secure account authentication. Firebase imports remain in the restored original auth/service layer for compatibility with the original UI; future work should migrate those specific interfaces carefully rather than replacing the UI. Cloudflare D1 is the durable state path for the newly added workspace and event routes.

## Validation and deployment

```bash
cd /home/ubuntu/D-bugger
pnpm install
pnpm lint
pnpm build
```

`pnpm build` is the Cloudflare Pages build and runs `vite build`. `pnpm dev` runs Vite for the preserved front end. `pnpm dev:server` runs the original Express development backend locally. Cloudflare Pages is connected to `main` and uses `dist` as its output directory.

When changing D1 schema, update `d1/schema.sql` and apply the migration to the existing D1 database. Do not restore or modify unrelated Supabase projects. When changing context behavior, update this file and preserve the `[dbugger-context]` recursion guard.

## Next safe improvements

The next safe work should be incremental: add a small context-sync status badge to the existing `RepoList`, add a research panel as another original-style modal or dashboard tab, improve webhook retry handling, and migrate the original Firestore service methods one at a time to Cloudflare D1. Avoid a new app shell or a new global theme unless explicitly requested.

## AI operating rules

Read this file, `README.md`, `package.json`, `wrangler.toml`, and only the relevant original component/service files before editing. Preserve the uploaded program’s UI and component contracts. Run `pnpm lint` and `pnpm build` before committing. Use `Co-authored-by: D-Bugger <agent@d-bugger.dev>` when making repository commits for this project.
