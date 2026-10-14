# OpenBuilder

**Build, test, and launch websites and browser games with the AI you already use.** Open source (MIT), chat-native, local-first, with explicit safeguards against preview loops, leaked secrets, and premature deployment.

> **Status: v0.1 MVP.** Working Node CLI, two starter templates, bounded retry state, static audit, guarded release checklist, and guidance for using existing AI connectors. **Not** yet a hosted ChatGPT plugin, universal in-chat preview, automated provider provisioning, or a full security certification.

## Two ways to get started

**For existing AI chats:** Open this repository in a coding-capable ChatGPT, Claude, or other compatible agent with GitHub access. Ask:

> "Use https://github.com/KAVentures/openbuilder as my app-building playbook. Follow AGENTS.md and skills/openbuilder/SKILL.md. Build me a [describe your app/game]. Avoid Vercel previews while iterating. Guide me through connecting only the accounts we need and run the OpenBuilder checks before launch."

The AI must actually have the right file editing/execution and integration tools; a plain chat interface without tool access cannot execute local commands or host a preview. You can still use the instructions and have it create files through a GitHub connector.

**With the local CLI (Node.js 20+):**

```bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder
npm test
node bin/openbuilder.mjs init my-first-game --template game
node bin/openbuilder.mjs preview my-first-game
# or for a server-rendered web app:
node bin/openbuilder.mjs init my-first-web --template web
cd my-first-web && npm install && npm run dev
```

The templates are copied into new folders. You own all code and provider accounts. The builder never stores provider credentials.

## Commands

| Command | Effect |
|---|---|
| `init NAME --template web\|game` | Creates a Next.js web app or playable static browser game |
| `preview PATH [--port N]` | Local-only preview on 127.0.0.1, **no Vercel calls** |
| `check PATH [--json] [--strict]` | Detects common secret, Git and deployment risks; flags unverified areas |
| `retry allow\|record --kind preview\|deploy --signature TEXT --project PATH` | Durable retry budget; blocks repeated identical failures |
| `retry reset --reason TEXT --project PATH` | Explicit reset after investigating failure |
| `release PATH [--json]` | Runs static audit, project tests/build, and reads manually attested launch gates; **does not deploy** |

### Why no automatic Vercel previews?

Both templates include `vercel.json` with `git.deploymentEnabled: false`. Preview locally, build and test, then deploy explicitly after the release gate. Even Vercel's "Ignored Build Step" can count cancelled deployments, so preventing Git-triggered deployments is the more dependable default. If you use Vercel, verify the actual project settings independently.

### How the launch gate works

`release` is **blocked by default** until project tests, production build, and all applicable manual gates have evidence. Write local evidence in `.openbuilder/launch-evidence.json` (ignored by Git). Each attestation has `verified: true`, an ISO timestamp `at`, and useful `notes` (15+ characters), e.g.:

```json
{
  "checks": {
    "rollback": {
      "verified": true,
      "at": "2026-10-14T12:00:00Z",
      "notes": "Reverted a test deploy in staging and confirmed previous version."
    }
  }
}
```

Other required keys are printed by `release --json`. **Attestations are user claims**, not independent testing. The release command does not inspect live providers, perform penetration testing, guarantee legal compliance, or deploy. Do not fabricate evidence to make a gate green.

## What's built vs still to build

| Area | v0.1 |
|---|---|
| Chat-native skill and agent instructions | ✅ |
| Local web/game starter templates | ✅ |
| Local browser preview (desktop) | ✅ |
| Retry budget, audit, manual release gate | ✅ |
| Security + SEO checklists and onboarding | ✅ |
| GitHub Actions CI for toolkit | ✅ |
| Automatically provision Supabase/Vercel/Resend via chat tools | Not yet; agents use existing connected provider tools |
| Interactive preview embedded in normal AI chats | Not universal; subject to each host's UI/runtime support |
| Hosted multi-provider MCP orchestration server | Not yet |
| Browser-level end-to-end tests for generated apps | Later |
| Tested database restores, mail deliverability, production load tests | Must be run against real accounts |

## Important boundaries

- ChatGPT Plus / Claude and other chat subscriptions have provider-specific limits, tool availability and terms. This repository **does not** bypass rate limits or convert chat subscriptions into generic API access.
- Avoid using powerful database service-role keys in client applications. A Supabase publishable/anon key is different: it is designed for public clients **only when the database and storage policies are correctly locked down**.
- No provider signup, purchase, production push, payment, secret rotation or domain change happens automatically. Ask for consent where required.
- Security scanning is intentionally conservative and incomplete. High-risk projects need specialist review. The generated policy pages are visibly **placeholders**.

## Guides

- [Agent playbook](AGENTS.md)
- [Beginner connection instructions](docs/CONNECTORS.md)
- [20-point launch checklist and SEO checks](docs/LAUNCH.md)
- [Architecture and roadmap](docs/ARCHITECTURE.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Why this exists

The difficult part of AI-built software is often not writing the first component. It is connecting accounts, diagnosing errors without blindly retrying, keeping credentials out of Git, testing real user flows, and shipping responsibly. OpenBuilder packages those practices as reusable instructions plus executable guardrails.

MIT licensed. Built by contributors; not affiliated with OpenAI, Anthropic, GitHub, Supabase, Vercel or Resend.
