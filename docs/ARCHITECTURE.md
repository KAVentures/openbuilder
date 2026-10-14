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
- The Next.js template needs `npm install` on first use. Dependencies are semver-ranged; commit the generated lockfile for reproducible future builds and update for security fixes.
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
