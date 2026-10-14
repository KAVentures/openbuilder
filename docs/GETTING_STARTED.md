# Getting started with OpenBuilder

**Choose how you already use AI.** You don't have to download a new AI app or create an OpenBuilder account.

| I use… | Do this | What is required |
| --- | --- | --- |
| ChatGPT or Claude chat | [Paste the OpenBuilder prompt](#1-use-openbuilder-in-an-existing-ai-chat) | Ability to read this repository; file-editing or GitHub write tools for actual app creation |
| Claude Code | [Open the repository and run `claude`](#2-use-claude-code-or-codex-on-your-computer) | Git, Claude Code and its supported authentication |
| Codex CLI | [Open the repository and run `codex`](#2-use-claude-code-or-codex-on-your-computer) | Git, Codex CLI and its supported authentication |
| No coding agent | [Run the CLI](#3-use-the-local-cli-without-an-ai-agent) | Git and Node.js 20+ |

**Note:** OpenBuilder gives your AI a repeatable way to work. It does not provide AI inference, additional chat-plan allowances, hosted compute, or paid provider accounts.

## 1. Use OpenBuilder in an existing AI chat

### ChatGPT

1. Open a new ChatGPT chat.
2. If GitHub isn't connected and is offered for your account, open your ChatGPT **Apps/Plugins/Connections** directory where available, search for a GitHub connection, and authorize the repositories you intend to use. Names and available permissions vary by product and plan.
3. Paste this:

~~~text
Use the open-source OpenBuilder workflow:
https://github.com/KAVentures/openbuilder

Read AGENTS.md and skills/openbuilder/SKILL.md before doing anything.
I want to build [DESCRIBE MY WEB APP OR BROWSER GAME].

First, check your actual tool access. Use an app repository separate
from OpenBuilder. Ask me to connect GitHub, Supabase, Vercel or Resend
only when you need them. Explain each connection in plain language.
Use local/sandbox checks where possible; do not repeatedly trigger
Vercel previews. Check security and SEO appropriate to the app.
Report what you truly tested and what I must do myself.
~~~

4. If ChatGPT can read but cannot write to GitHub in that chat, move to a supported coding/agent environment or connect a write-capable tool. **Don't assume** an ordinary ChatGPT conversation can run shell commands, install dependencies, or serve a full-stack preview.
5. Approve only the required account connections. Ask the AI to provide an actual PR and tested URL (when available), not merely a description.

GitHub access and tools depend on your plan, model, workspace and chat surface. [Official GitHub–ChatGPT connection guide](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt).

### Claude chat and other AI chats

1. Open your usual AI chat.
2. Paste the **same prompt** above and ask it to read the linked repository.
3. If it cannot retrieve repository files, give it the contents of [AGENTS.md](../AGENTS.md) and [skills/openbuilder/SKILL.md](../skills/openbuilder/SKILL.md) directly, or use a supported repository connector.
4. If it cannot edit code or run tools, use Claude Code, Codex or another agentic environment for execution.

**Do not** provide passwords or secret API keys in the conversation. A repository URL is a *source of instructions*, not an install command or credential grant.

## 2. Use Claude Code or Codex on your computer

This is the most straightforward option when you want a real local preview, local builds and terminal-based checks.

### Install prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js 20+](https://nodejs.org/en/download) for OpenBuilder's CLI
- Either [Claude Code](https://code.claude.com/docs/en/quickstart) or [Codex CLI](https://developers.openai.com/codex/cli/) installed and signed in as supported by that tool

Clone once:

~~~bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder
~~~

**Claude Code:**

~~~bash
claude
~~~

**Codex:**

~~~bash
codex
~~~

Claude Code can follow the repository's `CLAUDE.md` and Codex uses `AGENTS.md`. The portable [skill](../skills/openbuilder/SKILL.md) gives additional context; mention it in your prompt.

### First prompt to use inside Claude Code or Codex

~~~text
Read AGENTS.md, CLAUDE.md (if relevant), and
skills/openbuilder/SKILL.md. Use OpenBuilder to create
a simple appointment booking website in projects/booking-app.

Explain the design in beginner-friendly language, create the app
using the web template, and test it locally. Work on the new app,
NOT on OpenBuilder itself. Avoid Vercel preview builds.
Ask me before using paid services or deploying to production.
~~~

The `projects/` directory is ignored by the OpenBuilder repository to prevent accidentally committing your own app into the toolkit. Your app still needs its **own Git repository** for source control and deployment. Ask your coding agent to help initialize and push it after you authorize GitHub.

The preview appears at a **local address on your computer**, not automatically inside the ChatGPT or Claude mobile chat window. Access from a phone needs a correctly secured shared preview environment, which the MVP does not supply.

### Want to use your subscription?

Many coding agents offer sign-in tied to an eligible existing subscription; support, tools, allowances and terms vary. OpenBuilder itself never asks for an OpenAI, Anthropic or Grok API key. Any AI calls made by your **deployed app** are separate from the subscription used to build it.

## 3. Use the local CLI without an AI agent

From your cloned OpenBuilder directory:

### Browser game (no cloud services needed)

~~~bash
node bin/openbuilder.mjs init my-first-game --template game
node bin/openbuilder.mjs preview my-first-game
~~~

Visit **http://127.0.0.1:4173** on the same computer. The game starter is HTML, CSS and JavaScript with touch and keyboard controls.

### Web app (Next.js)

~~~bash
node bin/openbuilder.mjs init my-first-web --template web
cd my-first-web
npm ci
npm test
npm run build
npm run dev
~~~

Visit **http://localhost:3000**. This is a scaffold for customization, not a finished booking/payment/auth application. The example legal pages are placeholders.

### Audit, retry, and release checks

From the original OpenBuilder checkout:

~~~bash
node bin/openbuilder.mjs check my-first-game --strict
node bin/openbuilder.mjs release my-first-game
~~~

Release is **blocked by default** until the required external checks are honestly attested. It never deploys automatically.

Retry tracking is voluntary for an AI/agent using the CLI:

~~~bash
node bin/openbuilder.mjs retry allow --kind preview --signature "build error" --project my-first-game
node bin/openbuilder.mjs retry record --kind preview --signature "build error" --project my-first-game
~~~

It is **not** a magical interceptor of third-party connector actions.

## 4. Connect other services only when your project needs them

- **GitHub:** version control and PRs (recommended for every serious project).
- **Supabase:** user accounts, persistent data, storage or realtime features.
- **Vercel:** deployment, custom domains and optional analytics when ready to launch.
- **Resend:** transactional email like password resets or confirmations.

OpenBuilder does not demand that you connect all four. See the [click-by-click connector guide](CONNECTORS.md).

## Troubleshooting

**"My AI says it can't open GitHub."** Connect a supported repository tool, paste [AGENTS.md](../AGENTS.md) and the [skill](../skills/openbuilder/SKILL.md), or clone locally. Don't assume URL retrieval works in every chat.

**"Where is my live preview?"** The included preview is served only from your computer. On a cloud/mobile chat without code execution, a local preview is not automatically available.

**"My app failed the release checklist."** That's expected until applicable production checks have been completed. Run `release --json` to view which evidence is missing. Never invent attestations.

**"Will this consume my ChatGPT/Claude API credits?"** The toolkit itself makes no AI inference calls. Your chosen AI surface determines subscription or usage allowances; deployed AI features may incur separate API charges.

More: [README](../README.md) · [FAQ](FAQ.md) · [Production checklist](LAUNCH.md).

## 5. No-shell GitHub-only build (recommended for ordinary chat)

Use this when your AI can **read and write GitHub** but cannot run commands. A user should only need to paste the OpenBuilder URL and describe the app.

1. Give the AI the `KAVentures/openbuilder` URL and ask it to read `AGENTS.md`.
2. Create **another empty GitHub repository for the app**, or ask the AI to create one if its GitHub integration permits it. Tell it that the OpenBuilder source repository is just the **toolkit**.
3. Tell the AI to retrieve the *entire file tree* from `templates/web/` or `templates/game/` and copy those files into your app repo's **root**. Do not forget hidden `.github/workflows/ci.yml` and `.github/openbuilder/retries.json`; those files carry the independently running checks and retry history. Preserve `scripts/check.mjs` and `scripts/audit.mjs`. For a web app personalize `package.json` and the root and `packages[""]` names in `package-lock.json`.
4. Ask it to implement the requested feature in a **pull request**. The new app repository's GitHub Actions run the tests and security heuristics automatically, without a shell in the AI conversation. Read the real CI results.
5. On each error, use the tracked retries ledger rather than endlessly creating fresh previews. Require a changed diagnosis after a repeat failure. Keep Vercel deployments off until a deliberate launch.
6. When CI passes, review the remaining security, privacy, domain, Search Console and external-service tasks. An app can pass CI and still be unsafe in production.

**Limits:** This is only possible if the AI can actually perform GitHub writes. Passing a URL to a text-only chat cannot grant permissions. The CI checks are static/build checks, not proof that external integrations, signup, checkout, auth policies or email deliverability work.

**Click-by-click setup:** In ChatGPT use the available **Plugins/Apps/Connections** directory rather than assuming a fixed Settings path. Search for a GitHub integration and inspect its permitted actions. Claude Code and Codex generally work from a local checkout; a plain Claude web chat may not have the same tools.
