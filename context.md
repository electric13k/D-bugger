# D-Bugger Repository Context

## Purpose

D-Bugger is the restored original D-Bugger application for automated GitHub code review, bug remediation, repository monitoring, and rollback workflows. The original uploaded UI is the source of truth: preserve its `Homepage`, `Navbar`, `StatsBar`, `RepoList`, `FixRunsList`, modal suite, terminal log view, and parchment/ink editorial visual system. Make future changes incrementally; do not replace or re-theme the application without an explicit request.

## Current production

- Repository: `electric13k/D-bugger`
- Branch: `main`
- Cloudflare Pages project: `dbugger`
- Production URL: `https://dbugger.pages.dev`
- Pages build command: `pnpm build`
- Pages output directory: `dist`
- D1 binding: `DBUGGER_DB`
- D1 database: `dbugger-events` (`5a680e0e-362a-4ee1-9f53-d29121005a60`)
- Latest deployed commit: `36e71b3` (`fix: align product copy with verified behavior`)
- Previous interaction repair commit: `09eb3e4` (`fix: make agent activity and actions verifiable`)
- Latest successful Pages deployment for the final commit: `fa5350b3-bf73-4619-87fc-39c783912c28` (`fa5350b3.dbugger.pages.dev` preview)

## Authentication and credentials

The application UI sign-in uses `src/lib/workspaceAuth.ts`, not the Firebase Google popup. Clicking `SIGN IN` opens the incremental D-Bugger email auth modal, where a user can create an account or sign in with an email address and password. Successful accounts use D1-backed `auth_users` and opaque HttpOnly `auth_sessions` cookies; the account also restores its attached D-Bugger workspace ID. Existing guest workspace access remains available as a compatibility fallback. The flow does not open a popup or repeatedly request an email. Cloudflare Access can be added later if organization-level authentication is required.

Firebase remains in the repository because the original daemon service and data contract still reference it; do not remove it casually. The UI sign-in listener and Navbar actions intentionally bypass Firebase popup authentication because the Pages-origin popup flow was unreliable. Auth routes are under `functions/api/auth/`, including the Google token exchange at `functions/api/auth/google.ts`, and the schema migration is `d1/002_email_auth.sql`. The auth modal includes show/hide controls for password fields. Google redirect sign-in depends on the Firebase project having `dbugger.pages.dev` in its authorized domains and Google enabled as a sign-in provider. Manual Sweep targets only connected live repositories. When no repository or GitHub token is available, it opens the dashboard, logs a warning, and performs no analysis.

User-owned OpenRouter and GitHub credentials are session-only. Use `dbugger_openrouter_key` and `dbugger_github_token`; legacy `repoheal_*` values may be read only as migration fallbacks. Never commit credentials or hardcode personal email addresses.

## Gridscape / Infinity Canvas research

D-Bugger now exposes a preserved-UI research modal labeled **Research with Gridscape**. Its Pages Function at `functions/api/research/gridscape.ts` reads the public `electric13k/Gridscape` repository context set (`context.md`, `metadata.json`, `functions/api/generate.ts`, `src/App.tsx`, and `src/utils/storage.ts`) and returns repository-grounded findings plus suggested research branches. If the Pages environment variable `GRIDSCAPE_RESEARCH_URL` is configured with a deployed Infinity Canvas base URL, the same route delegates synthesis to that app’s `POST /api/generate` contract; otherwise it returns findings derived from the fetched Gridscape repository files. No Gemini key is copied into D-Bugger.

Live fix cycles use `src/lib/autoResearch.ts` before patch synthesis. Manual scans and D1-observed GitHub push reviews gather Gridscape context, read the latest branch commit, changed-file patches, and source contents through `fetchRepositoryDebugSnapshot`, and pass that evidence into `DaemonService.triggerBugFix`. The live Pages fix endpoint at `functions/api/ai/fix-bug.ts` requires a real repository snapshot, the selected current OpenRouter model, and the user’s session-only key. It returns only the actual model response; if research, GitHub, the key, the model, or structured output is unavailable, the cycle aborts without creating a run or patch. The agent console and AI Thoughts view expose the model-response status, concise reasoning summary, evidence file, research mode, validation status, and delivery result; private hidden chain-of-thought is not exposed. `functions/api/ai/follow-up.ts` uses only the selected user model and session-only OpenRouter key with run evidence. Seeded repositories, playground injection, deterministic patch generation, and the deleted legacy Express simulation server are not supported.

## Cloudflare and GitHub features

Pages Functions provide D1-backed workspace state loading/saving, working-style learning events, signed GitHub push webhook reception, webhook secret registration, recent push event polling, user-key AI repair at `functions/api/ai/fix-bug.ts`, evidence-grounded follow-ups at `functions/api/ai/follow-up.ts`, verified GitHub branch/commit/PR delivery at `functions/api/github/deliver-fix.ts`, and verified GitHub PR-close/branch-delete rollback at `functions/api/github/undo-fix.ts`. `src/lib/cloudflareWorkspace.ts` is the browser client. Hydration discards disconnected/seeded repository records and runs that lack the new real OpenRouter response marker, so removed simulated history cannot return after reload. `src/lib/repoContext.ts` analyzes a linked repository, creates or updates that repository's `context.md`, registers the GitHub push webhook, and uses `[dbugger-context]` commit messages to avoid webhook recursion. The connected GitHub token must have Contents write access for context handoffs and repository updates. `src/lib/repoContext.ts` resolves a configured branch through the repository’s default branch when the configured name does not exist, so repositories such as `electric13k/cueflow` (default branch `master`) no longer fail when an old record says `main`; it reads the resolved commit SHA and persists the resolved branch. Browser GitHub reads use `cache: 'no-store'`. Same-origin API/auth/workspace requests send `credentials: 'include'`, and private Pages responses use `Cache-Control: no-store` with `Vary: Cookie`. Delivery and undo remain unavailable unless the token, real repository snapshot, complete patch, and GitHub response evidence are all present.

A repository is analyzed when linked and again when D1-observed push events arrive. The D-Bugger repository itself must retain this handoff file so future agents can understand the codebase without spending tokens rediscovering it.

## Validation

Run `pnpm lint && pnpm build` before committing. The original bundle has a non-blocking Vite size warning. Keep Pages Functions types in `functions/global.d.ts` and use the constant-time byte comparison in `functions/api/github/webhook.ts`; do not reintroduce unavailable `crypto.subtle.timingSafeEqual` typings. `src/lib/cloudflareWorkspace.ts` normalizes legacy workspace records and logs: unverified PR/commit metadata, fabricated agent traces, and old delivery tool logs are removed or marked review-only during hydration. No remote CI/test runner is integrated; pipeline fields must remain unverified unless explicit evidence is stored.

## Branding and scope constraints

Use D-Bugger branding only. Do not restore or modify Security Patrol Ops or unrelated Supabase projects. Do not reintroduce legacy `fizxpoint`, `Fixpoint`, or personal `hussainamin` strings into user-visible source. Keep the existing UI hierarchy, behavior, and styles as the base for every future feature.
