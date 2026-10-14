# Architecture / scope

```
User's existing ChatGPT / Claude / other capable AI
    ↳ AGENTS.md + skills/openbuilder/SKILL.md
    ↳ user-authorized provider connectors (GitHub, Supabase, Vercel, Resend)
    ↳ optional local CLI (Node 20+) for scaffolding, preview, audit, retry and gate
    ↳ generated app's GitHub PR, tests, local/sandbox preview and controlled deployment
```

## Why a playbook plus a small CLI?

A universal remote MCP server must be deployed, authenticate individual users to their accounts, and securely hold or proxy scoped provider tokens. That is a much bigger security and operating burden. v0.1 therefore **does not** centralize provider secrets. AI agents use provider-native connected tools where available. The CLI runs locally without provider API keys or telemetry.

## Templates

- `web`: Next.js App Router + React + TypeScript, route errors/404, safe-by-default robots until real HTTPS canonical domain exists, sitemap, explicitly labelled draft legal pages and no automatic Vercel Git deployments.
- `game`: self-contained playable Canvas game, mobile pointer controls, static HTML/JS/CSS with no backend; Vercel deployment optional.

## Boundaries

- `check` is a heuristic **static** scanner. It does not read Git's entire history or substitute for secret scanners, type checkers, DAST, pentesting or provider audits.
- `retry` records failed attempts the agent reports; it cannot intercept GitHub/Vercel actions taken through an unrelated connector. Adapters should call it consistently.
- `release` is local execution plus honest attestation. It does not deploy. A production launch should also use follow-up smoke tests and monitoring.
- The Next.js template includes an exact-version package manifest and committed npm lockfile; use `npm ci` for reproducible installs. Each starter includes weekly Dependabot checks for npm and GitHub Actions.
- An in-chat preview is only possible if the host platform supports secure embedded components or provides a browser/sandbox environment. Ordinary chat cannot execute arbitrary web servers.

## Roadmap, in priority order

1. Real agent integration smoke tests in ChatGPT, Claude and other providers; document differences.
2. Repeatable end-to-end fixtures for auth, RLS, registration, reset, payments, SEO and actual deployment.
3. Provider adapters with least-privilege OAuth and auditable external actions.
4. Safe temporary remote preview service for mobile/chat, with strict sandboxing and cost budgets.
5. Optional UI built on the same workflow, never a parallel builder with different safety behavior.
6. Signed attestations/provenance and reproducible release audit reports.

## Threats to consider

Prompt injection from repositories, dependency scripts, supply-chain packages, untrusted web content, preview code exfiltration, incorrect auth policies, silent provider billing, token scope escalation, secrets in CI logs, concurrency bypasses for retry budgets, and fabricated test outcomes. Use separate sandbox accounts and human authorization for irreversible operations. Keep untrusted generated app code away from the builder's cloud credentials.

## Cross-session retry tracking

Generated apps include a **tracked** `.github/openbuilder/retries.json` file. It contains human-readable `attempts` objects (`at`, `kind`, `errorSummary`, optional `rootCause`) that no-shell chat agents can append to without hashing. CLI retries write to the same list. GitHub-connected chat agents should update it in the app PR whenever they attempt a preview or deployment, and re-read it in later sessions. A dishonest agent can ignore or reset it, and concurrent writes are not transactional: it is a shared audit trail, **not a universal enforcement hook**. Vercel automatic Git deployments are separately disabled by template configuration.

## No-shell app CI

Each template has its own `.github/workflows/ci.yml`, `scripts/audit.mjs` and `scripts/check.mjs`. The web project has a committed npm lockfile and runs `npm ci`; the game is dependency-free. When copying a template through GitHub's connector, include dotfiles and hidden workflows. Toolkit CI and generated app CI are separate.

## Single source for audit checks

The main audit is `lib/audit.mjs`, copied verbatim to each template at `templates/{web,game}/scripts/audit.mjs`. `tests/template-integrity.test.mjs` fails CI if these copies diverge. Any audit update must update all three. Individual generated repositories receive a standalone copy because they cannot depend on the OpenBuilder source tree.

## Template repositories

A maintainer can publish the web and game starters as separate **GitHub template repositories** using `scripts/publish-template-repos.mjs` with explicit approval. See `docs/PUBLISH_TEMPLATES.md`. This cannot be completed through GitHub's file-editing connector alone. Once published, ordinary chat users can create a new app repo using **Use this template**, without a multi-file transfer. Future template updates still require synchronization PRs.

## Design sources and GitHub publishing

Read docs/DESIGN.md for the maintained SuperDesign skill (optional CLI) and Canvas UI (optional MIT + Commons Clause components). The default app templates are not tied to their CLI or GPU runtimes.

OpenBuilder's local **github** command inspects the current app's Git state and GitHub CLI authentication, then can attach an existing authorized remote or create a private repo after explicit confirmation. Normal chats use the GitHub connector when it provides a relevant write/create operation; otherwise https://github.com/new is a one-time user action **during the build**. The release gate detects missing GitHub origin. A configured remote alone does not prove the remote is accessible or its CI passed.

## Design pipeline and reliability

OpenBuilder's `lib/design.mjs` invokes the actual SuperDesign CLI for prompt search and draft generation **only after explicit consent** and upstream initialization. It can invoke Canvas UI's shadcn registry install only after a separate license acknowledgment, explicit consent and existing shadcn configuration. `lib/design-review.mjs` checks whether an app-specific design decision/review record exists, and starter projects contain a copy of this module for standalone CI/CLI checks. A non-executing chat takes an honest fallback path and cannot claim external generation occurred. Neither a completed record nor an automated check guarantees an aesthetic outcome; human visual QA remains essential.
