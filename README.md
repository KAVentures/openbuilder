# OpenBuilder

**Build websites, web apps and browser games with the AI you already use.**

OpenBuilder is a free, open-source workflow for ChatGPT, Claude, Codex and other coding-capable AI assistants. It brings together app templates, plain-English onboarding, local previews, repeatable checks and release safeguards—so you can focus on what you want to build, not on configuring infrastructure.

[![CI](https://github.com/KAVentures/openbuilder/actions/workflows/ci.yml/badge.svg)](https://github.com/KAVentures/openbuilder/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-43853D)](package.json)
[![GitHub](https://img.shields.io/badge/source-GitHub-181717?logo=github)](https://github.com/KAVentures/openbuilder)

[**Get started in 60 seconds →**](docs/GETTING_STARTED.md) · [How it works](#how-it-works) · [Features](#whats-included) · [FAQ](docs/FAQ.md) · [Contribute](CONTRIBUTING.md)

> [!IMPORTANT]
> **Current status: early open-source MVP (v0.1).** OpenBuilder is an AI playbook plus a small local CLI—not yet a hosted plugin, a full Lovable-style visual editor, or an automatic one-click cloud deployment service. What it can do depends on which file-editing, terminal and provider tools your AI actually has.

## The easiest way: paste into your AI chat

Open ChatGPT, Claude or another AI that can read GitHub repositories. Connect **GitHub** to your AI if it asks for access, then paste this prompt:

~~~text
I want to build an app using OpenBuilder:
https://github.com/KAVentures/openbuilder

Read AGENTS.md and skills/openbuilder/SKILL.md in that repository
and follow their instructions. Help me build [DESCRIBE YOUR APP OR GAME].

Check which tools and account connections you actually have.
Explain any setup in simple steps, connect services only when needed,
work in a separate app repository, test before deployment, avoid
unnecessary Vercel previews, and never put secrets in frontend code.
Tell me clearly what you can and cannot verify.
~~~

**Example:** replace the bracketed part with *"a website where customers can book appointments and receive email confirmations"* or *"a mobile-friendly trivia game with a leaderboard."*

**No separate AI subscription required by OpenBuilder.** You use whichever supported AI you already have; plan allowances, tools and external infrastructure charges still apply.

**Important:** Pasting a URL is enough to *start*, not a guarantee of fully automated development. The assistant must be able to retrieve this repository and edit files. A terminal, GitHub write integration or capable coding environment is needed to actually build; ordinary chat may only be able to plan or draft changes. [Exact ChatGPT/Claude setup →](docs/GETTING_STARTED.md#1-use-openbuilder-in-an-existing-ai-chat)

## Prefer Claude Code or Codex?

If you already have either coding agent installed, you can run OpenBuilder directly in it. Both tools use instructions already included in this repository.

**Claude Code**

~~~bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder
claude
~~~

**Codex CLI**

~~~bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder
codex
~~~

Then ask: **"Use OpenBuilder to make me a mobile-friendly habit tracker. Put the app in projects/habit-tracker, not in the toolkit itself. Test locally and only deploy after the release checks."**

Need to install Claude Code or Codex first? See [the complete beginner guide](docs/GETTING_STARTED.md#2-use-claude-code-or-codex-on-your-computer). New projects under `projects/` are ignored by this toolkit's Git history; create a **separate GitHub repo for your app** before sharing it.

## Or run the local CLI yourself

Requires Git and **Node.js 20+**. No OpenBuilder account, OpenBuilder-hosted server, AI API key or database is needed for the included starter games.

~~~bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder
npm test

# Make a playable browser game
node bin/openbuilder.mjs init my-game --template game
node bin/openbuilder.mjs preview my-game
~~~

Open **http://127.0.0.1:4173** in the browser on the same computer. No Vercel preview is created.

For a Next.js web application:

~~~bash
node bin/openbuilder.mjs init my-web-app --template web
cd my-web-app
npm ci
npm run dev
~~~

Then open **http://localhost:3000**. The web starter contains a homepage, error/404 pages, starter SEO files and *clearly labelled placeholder* privacy/terms pages. It is **not** a finished production app.

[All commands and workflows →](docs/GETTING_STARTED.md#3-use-the-local-cli-without-an-ai-agent)

## How it works

~~~text
Your idea, in plain English
           |
           v
Your existing AI (ChatGPT / Claude / Codex / other capable agent)
           |
           v
OpenBuilder instructions + app templates + local checks
           |
           +--> GitHub   - your application's source code
           +--> Supabase - database / login, only if needed
           +--> Resend   - transactional email, only if needed
           +--> Vercel   - hosting / domain, when ready to launch
           |
           v
Test locally --> review security and launch requirements
           |
           v
Explicit deployment --> live smoke tests --> your app
~~~

Accounts and connected tools belong to **you**. OpenBuilder does not require giving it credentials, and it does not automatically provision or bill services.

## What's included

| Area | Included today |
| --- | --- |
| **AI playbook** | [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) and [portable agent skill](skills/openbuilder/SKILL.md) |
| **Templates** | Next.js/TypeScript web starter and a playable mobile-friendly HTML Canvas game |
| **Local previews** | Local dev server—no automatic Vercel deployment to view changes |
| **Retry limits** | A CLI-backed retry ledger that agents can consult; **does not intercept** unrelated provider calls |
| **Security audit** | Static checks for some credential exposures, tracked env files and unsafe configuration; not a full security audit |
| **Launch review** | Feature-aware checklist, local tests/build and manually supplied evidence; production checks remain separate |
| **SEO guidance** | Sitemap, metadata, indexing, crawlability, performance and editorial checklist |
| **Beginner onboarding** | Plain-language setup for [GitHub, Supabase, Vercel and Resend](docs/CONNECTORS.md) |
| **Open source** | [MIT license](LICENSE), contributor guide, security policy, and GitHub Actions checks |

## Keeping cloud previews and costs under control

OpenBuilder's starter templates disable automatic Git-triggered Vercel builds by default. Agents are instructed to check syntax, run tests and preview locally *before* triggering a deployment. The retry ledger stops an agent following it from repeatedly issuing the same failed preview/deploy action.

This is an **opt-in workflow**, not a guarantee that ChatGPT or Claude can automatically block every Vercel deployment. Check the actual Vercel project settings before relying on preview suppression. Domain purchases, production deployment, database changes and paid-provider setup should be explicitly approved.

## What it does **not** do yet

- No universally installed ChatGPT, Claude or Grok plugin; the GitHub repository is **not** itself a one-click plugin.
- No full Lovable-style visual canvas or guaranteed preview embedded in AI chat.
- No fully automated Supabase, Vercel, GitHub and Resend OAuth provisioning.
- No automatic security certification, compliance/legal review, SEO ranking, backup restore, email deliverability or payment end-to-end verification.
- No unlimited model usage. Your AI subscription and external cloud providers have their own limits and pricing.

We prefer clear, working functionality over green checkmarks for things that have not been tested. See [architecture and roadmap](docs/ARCHITECTURE.md).

## Documentation

- [Start here: ChatGPT, Claude Code, Codex and CLI](docs/GETTING_STARTED.md)
- [Connecting GitHub, Supabase, Vercel and Resend](docs/CONNECTORS.md)
- [Security, launch checklist and SEO](docs/LAUNCH.md)
- [Frequently asked questions](docs/FAQ.md)
- [Architecture and roadmap](docs/ARCHITECTURE.md)
- [Security policy](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)

## Contributing

OpenBuilder is community-driven. Bug reports, clearer onboarding instructions, reliable templates, provider adapters and **reproducible tests** are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 KAVentures and OpenBuilder contributors.

OpenBuilder is an independent open-source project and is not affiliated with or endorsed by OpenAI, Anthropic, GitHub, Supabase, Vercel or Resend.

## For chat agents without terminal access

OpenBuilder includes **self-contained GitHub Actions** in each generated app template. A write-capable GitHub connector can copy a template into a **separate app repository**, create a PR and let CI run the audit and build without local commands. The app's CI is independent of this toolkit's CI. See [GitHub-only step-by-step instructions](docs/GETTING_STARTED.md#5-no-shell-github-only-build-recommended-for-ordinary-chat).

Failed preview/deployment attempts use a tracked ledger (`.github/openbuilder/retries.json`) so later chats can see them. This is an auditable policy, not an enforcement mechanism for unrelated AI tools. Releases require fresh, commit-bound manual attestations and real external verification.
