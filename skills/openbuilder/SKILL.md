---
name: openbuilder
description: Build and launch secure web apps and browser games with the user's existing AI tools, local-first previews, provider onboarding, and deterministic release gates.
---

# OpenBuilder skill

Load `AGENTS.md`, `docs/CONNECTORS.md`, `docs/GITHUB.md`, `docs/DESIGN.md`, `docs/LAUNCH.md`. Use the user’s own GitHub, Supabase, Vercel and Resend connections when required. Do not request or reveal API credentials.

When a user asks to build:
0. **Before frontend coding, run the design-to-code stage in skills/openbuilder-design/SKILL.md**; SuperDesign is preferred where its real CLI is executable and authorized; evaluate Canvas UI selectively. Record evidence in the app's design-review.json. The local release gate requires a completed design review for starter web/game apps.
1. Choose `web` (Next.js) or `game` (static Canvas) and explain why in plain language.
2. Establish the GitHub app repository early: connect an existing one, or request approval for a private new one through a supported tool. If repo creation isn't possible in chat, guide the user to https://github.com/new and resume after they share the app URL. Never merely mention the missing repo in a final footnote. Inspect tool availability, ask for authorization at the right stage, and never imply that installing a repository automatically installs AI connectors.
3. Create a branch, generate source code, apply changes, test through command execution or GitHub CI, then preview locally if supported.
4. Avoid Vercel build loops; use the `retry` command (2 identical preview errors, 5 total, 1 identical deploy error, 2 total) and stop when blocked.
5. Run the security audit `node bin/openbuilder.mjs check APP --strict`, fix objective blockers, and report warnings accurately.
6. Use `node bin/openbuilder.mjs release APP` for launch readiness. Never fake the evidence; request real verification of backups, access controls, delivery, performance and legal text as applicable.
7. Explicitly ask before production deploy or purchasing a domain. Continue feature implementation without deploying when gates are incomplete.
8. Provide clear links to the branch/PR or actual preview and a concise list of missing manual steps.

This skill is instructions, not an autonomous service. It cannot create a preview or deploy without a capable AI agent and available tools.

## No-shell / regular chat use

If local execution is unavailable, do not emit CLI commands as if they ran. First check whether an official standalone OpenBuilder template repository is actually published, and prefer GitHub's **Use this template** action if available. Otherwise copy the selected template file tree via GitHub **write** tools into a **different** app repository, including hidden `.github` files, exact lockfile and independent audit/check scripts. Open the app PR and read that app's CI checks. If GitHub is read-only, explain the exact missing permission and supply the files or guide the user to a capable coding agent. Keep retry failures in `.github/openbuilder/retries.json` on the app PR (not merely the chat). See `AGENTS.md` and `docs/GETTING_STARTED.md`.

**No-shell retry history:** append readable `at`, `kind`, `errorSummary`, `rootCause` and `source` fields to the app repository's `.github/openbuilder/retries.json` `attempts` list. Do not compute hashes. Read existing attempts before retrying and keep the documented hard limits. For local `release`, initialize and commit the **app** Git repo first.

## Design implementation

Read skills/openbuilder-design/SKILL.md and create DESIGN.md in the app. SuperDesign's maintained skill is optional and requires a capable environment; Canvas UI is optional and has an additional Commons Clause restriction. Neither justifies a broken dependency chain or failed preview loops.

## GitHub is part of completion

A built app isn't complete just because code was generated. Before completing, verify the intended user-owned GitHub repository/PR and its actual CI checks; if permissions block this, report the blocker explicitly and give exact one-time GitHub creation/link steps during the workflow.
