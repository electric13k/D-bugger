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
- Latest sign-in deployment commit: `b39939a`

## Authentication and credentials

The application UI sign-in uses `src/lib/workspaceAuth.ts`, not the Firebase Google popup. Clicking `SIGN IN` creates or restores a stable anonymous D-Bugger workspace identity in the browser and changes the existing Navbar profile presentation to `Workspace Operator`. It does not ask for an email and does not open a popup. This is workspace access rather than secure organization identity. Cloudflare Access can be added later if organization-level authentication is required.

Firebase remains in the repository because the original daemon service and data contract still reference it; do not remove it casually. The UI sign-in listener and Navbar actions intentionally bypass Firebase popup authentication because the Pages-origin popup flow was unreliable.

User-owned OpenRouter and GitHub credentials are session-only. Use `dbugger_openrouter_key` and `dbugger_github_token`; legacy `repoheal_*` values may be read only as migration fallbacks. Never commit credentials or hardcode personal email addresses.

## Cloudflare and GitHub features

Pages Functions provide D1-backed workspace state loading/saving, working-style learning events, signed GitHub push webhook reception, webhook secret registration, recent push event polling, and related routes under `functions/api/`. `src/lib/cloudflareWorkspace.ts` is the browser client. `src/lib/repoContext.ts` analyzes a linked repository, creates or updates that repository's `context.md`, registers the GitHub push webhook, and uses `[dbugger-context]` commit messages to avoid webhook recursion. The connected GitHub token must have Contents write access for context handoffs and repository updates.

A repository is analyzed when linked and again when D1-observed push events arrive. The D-Bugger repository itself must retain this handoff file so future agents can understand the codebase without spending tokens rediscovering it.

## Validation

Run `pnpm lint && pnpm build` before committing. The original bundle has a non-blocking Vite size warning. Keep Pages Functions types in `functions/global.d.ts` and use the constant-time byte comparison in `functions/api/github/webhook.ts`; do not reintroduce unavailable `crypto.subtle.timingSafeEqual` typings.

## Branding and scope constraints

Use D-Bugger branding only. Do not restore or modify Security Patrol Ops or unrelated Supabase projects. Do not reintroduce legacy `fizxpoint`, `Fixpoint`, or personal `hussainamin` strings into user-visible source. Keep the existing UI hierarchy, behavior, and styles as the base for every future feature.
