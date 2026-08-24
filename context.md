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
- Latest email-auth deployment commit: `437152b`

## Authentication and credentials

The application UI sign-in uses `src/lib/workspaceAuth.ts`, not the Firebase Google popup. Clicking `SIGN IN` opens the incremental D-Bugger email auth modal, where a user can create an account or sign in with an email address and password. Successful accounts use D1-backed `auth_users` and opaque HttpOnly `auth_sessions` cookies; the account also restores its attached D-Bugger workspace ID. Existing guest workspace access remains available as a compatibility fallback. The flow does not open a popup or repeatedly request an email. Cloudflare Access can be added later if organization-level authentication is required.

Firebase remains in the repository because the original daemon service and data contract still reference it; do not remove it casually. The UI sign-in listener and Navbar actions intentionally bypass Firebase popup authentication because the Pages-origin popup flow was unreliable. Auth routes are under `functions/api/auth/`, including the Google token exchange at `functions/api/auth/google.ts`, and the schema migration is `d1/002_email_auth.sql`. The auth modal includes show/hide controls for password fields. Google redirect sign-in depends on the Firebase project having `dbugger.pages.dev` in its authorized domains and Google enabled as a sign-in provider. The scan playground and Manual Sweep use the preserved demo repositories when no live repository has been connected, so the scan action is testable instead of disabled by an empty target list.

User-owned OpenRouter and GitHub credentials are session-only. Use `dbugger_openrouter_key` and `dbugger_github_token`; legacy `repoheal_*` values may be read only as migration fallbacks. Never commit credentials or hardcode personal email addresses.

## Gridscape / Infinity Canvas research

D-Bugger now exposes a preserved-UI research modal labeled **Research with Gridscape**. Its Pages Function at `functions/api/research/gridscape.ts` reads the public `electric13k/Gridscape` repository context set (`context.md`, `metadata.json`, `functions/api/generate.ts`, `src/App.tsx`, and `src/utils/storage.ts`) and returns repository-grounded findings plus suggested research branches. If the Pages environment variable `GRIDSCAPE_RESEARCH_URL` is configured with a deployed Infinity Canvas base URL, the same route delegates synthesis to that app’s `POST /api/generate` contract; otherwise it clearly labels the result as a repository-grounded preview. No Gemini key is copied into D-Bugger.

Automatic fix cycles use `src/lib/autoResearch.ts` before patch synthesis. Manual scans, simulated bug ingestion, and D1-observed GitHub push reviews all gather Gridscape context first, then pass the bounded findings and source links into `DaemonService.triggerBugFix`. For non-demo repositories with a session-only GitHub token, the scan also reads the latest branch commit, changed-file patches, and source contents through `fetchRepositoryDebugSnapshot`; the live Pages fix endpoint receives that snapshot rather than only a canned scenario. The live Pages fix endpoint at `functions/api/ai/fix-bug.ts` instructs the selected model to diagnose the supplied changed code, repair broken behavior first, and apply only safe, testable improvements to functioning code. If Gridscape or GitHub is unavailable, the cycle continues with linked `contextAnalysis` or a local safety fallback and records the research mode in the agent console rather than blocking a repair. The agent console and AI Thoughts view expose the model-response status, concise reasoning summary, evidence file, research mode, and delivery result; private hidden chain-of-thought is not exposed. Sandbox simulations are explicitly labeled and never claim real GitHub mutation.

## Cloudflare and GitHub features

Pages Functions provide D1-backed workspace state loading/saving, working-style learning events, signed GitHub push webhook reception, webhook secret registration, recent push event polling, real AI repair at `functions/api/ai/fix-bug.ts`, and verified GitHub branch/commit/PR delivery at `functions/api/github/deliver-fix.ts`. `src/lib/cloudflareWorkspace.ts` is the browser client. `src/lib/repoContext.ts` analyzes a linked repository, creates or updates that repository's `context.md`, registers the GitHub push webhook, and uses `[dbugger-context]` commit messages to avoid webhook recursion. The connected GitHub token must have Contents write access for context handoffs and repository updates.

A repository is analyzed when linked and again when D1-observed push events arrive. The D-Bugger repository itself must retain this handoff file so future agents can understand the codebase without spending tokens rediscovering it.

## Validation

Run `pnpm lint && pnpm build` before committing. The original bundle has a non-blocking Vite size warning. Keep Pages Functions types in `functions/global.d.ts` and use the constant-time byte comparison in `functions/api/github/webhook.ts`; do not reintroduce unavailable `crypto.subtle.timingSafeEqual` typings.

## Branding and scope constraints

Use D-Bugger branding only. Do not restore or modify Security Patrol Ops or unrelated Supabase projects. Do not reintroduce legacy `fizxpoint`, `Fixpoint`, or personal `hussainamin` strings into user-visible source. Keep the existing UI hierarchy, behavior, and styles as the base for every future feature.
