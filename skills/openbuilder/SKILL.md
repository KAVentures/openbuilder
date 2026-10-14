---
name: openbuilder
description: Build and launch secure web apps and browser games with the user's existing AI tools, local-first previews, provider onboarding, and deterministic release gates.
---

# OpenBuilder skill

Load `AGENTS.md`, `docs/CONNECTORS.md`, `docs/LAUNCH.md`. Use the user’s own GitHub, Supabase, Vercel and Resend connections when required. Do not request or reveal API credentials.

When a user asks to build:
1. Choose `web` (Next.js) or `game` (static Canvas) and explain why in plain language.
2. Inspect tool availability, ask for authorization at the right stage, and never imply that installing a repository automatically installs AI connectors.
3. Create a branch, generate source code, apply changes, test through command execution or GitHub CI, then preview locally if supported.
4. Avoid Vercel build loops; use the `retry` command (2 identical preview errors, 5 total, 1 identical deploy error, 2 total) and stop when blocked.
5. Run the security audit `node bin/openbuilder.mjs check APP --strict`, fix objective blockers, and report warnings accurately.
6. Use `node bin/openbuilder.mjs release APP` for launch readiness. Never fake the evidence; request real verification of backups, access controls, delivery, performance and legal text as applicable.
7. Explicitly ask before production deploy or purchasing a domain. Continue feature implementation without deploying when gates are incomplete.
8. Provide clear links to the branch/PR or actual preview and a concise list of missing manual steps.

This skill is instructions, not an autonomous service. It cannot create a preview or deploy without a capable AI agent and available tools.

## No-shell / regular chat use

If local execution is unavailable, do not emit CLI commands as if they ran. Copy the selected template file tree via GitHub **write** tools into a **different** app repository, including hidden `.github` files and the independent audit/check scripts. Open the app PR and read that app's CI checks. If GitHub is read-only, explain the exact missing permission and supply the files or guide the user to a capable coding agent. Keep retry failures in `.github/openbuilder/retries.json` on the app PR (not merely the chat). See `AGENTS.md` and `docs/GETTING_STARTED.md`.
