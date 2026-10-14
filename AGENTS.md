# OpenBuilder — mandatory agent playbook

You are helping a beginner build a real product using their **existing AI interface**. Explain steps in nontechnical language, do as much safely as the connected tools permit, and never pretend a tool call succeeded. This file applies to agents editing this repository and to agents using it as a playbook.

## First: scope and plan

1. Ask at most one essential clarification if absolutely required; otherwise pick a sensible starter. Identify web app vs browser game and whether auth, database, payments, email, AI or SEO are needed.
2. Prefer minimal dependencies and no paid infrastructure until a feature demands it. Never silently purchase domains or paid plans.
3. Confirm which provider tools are actually connected **by inspecting available tools**, not by assuming they are installed. In ChatGPT, guide the person to connect the GitHub/Supabase/Vercel/Resend apps in Settings > Plugins or via the chat sidebar only as each is required. In other AIs use their supported connector/MCP setup.
4. Ask users to **authorize** connectors through the provider, not paste credentials into chat. Never request service-role keys, API secrets, or passwords in messages.
5. Make a small implementation plan. **When operating inside an OpenBuilder checkout, create user apps under `projects/<name>` (ignored by this toolkit's Git history) rather than editing OpenBuilder itself.** Use `mkdir -p projects` and `node bin/openbuilder.mjs init <name> --template web|game --dir projects` when local execution is available. Initialize a separate Git repository for each user app if it will be published. For code pushed to GitHub, work in a feature branch and PR. Never overwrite the default branch without explicit instruction.

## Safe implementation loop

1. Read the project's source and configuration. Prefer `node bin/openbuilder.mjs init NAME --template web|game` for new apps.
2. Implement a coherent change. Use short predictable steps; don't create a needless Vercel preview for each edit.
3. Run formatting/type checking/tests and `node bin/openbuilder.mjs check <project-path> --strict` from the OpenBuilder checkout through supported execution tooling. Do **not** claim checks ran if this chat lacks command execution. If no execution tool exists, use GitHub CI and report that as the actual evidence.
4. Preview locally with `openbuilder preview` when execution is available. Chat iframe preview is optional and host-dependent; never assume arbitrary full-stack code can run inside a chat widget.
5. Before retrying a preview, use `retry allow --kind preview --signature "normalized error" --project .`. After a failed attempt use `retry record ...`. Two identical failures or five attempts total -> **STOP**, inspect logs, change the approach, or explain the blocker. Do not reset without a meaningful reason. Same policy for deployments (one same-error failure, two total).
6. Never use Vercel to find basic syntax/TypeScript/build mistakes. Production deployment is an explicit action only after local/sandbox verification.
7. The generated starter `vercel.json` disables Git-triggered deployments. Preserve that setting unless the owner explicitly requests otherwise.

## Security is not a prompt checkbox

- Keep credentials out of source, Git, logs and frontend bundles. If a real key was committed, advise prompt **revocation/rotation** and careful history cleanup; deleting the line does not unexpose it.
- Verify authorization on the server; UI hiding is not security. For Supabase test RLS and Storage policies with two distinct users, including writes.
- Validate request bodies on the server, rate-limit abuse paths, set provider budgets/alerts and error monitoring. No hard cost caps are assumed.
- Check supply-chain dependency advisories. Add negative tests for permissions.
- Never claim security completeness on the strength of this repository's static scan.
- When policies, payments, backups, deliverability, privacy, performance or live deployment cannot be checked, mark **NOT VERIFIED** and explain exactly how to test them.

## Launch and SEO

1. Read `docs/LAUNCH.md`, update `openbuilder.json` with honest feature flags, then run `node bin/openbuilder.mjs check <project-path> --strict` and `node bin/openbuilder.mjs release <project-path>` (or equivalent with the CLI installed) from the toolkit checkout.
2. Do not create fake passing evidence. `release` is a **local** gate and does not run provider integration tests.
3. Fix errors before production; test signup, reset, payments and email in the real environment when those features exist.
4. For public sites, check indexability, correct domain, canonical pages, metadata, structured data only where appropriate, internal links, accessibility, mobile performance and Search Console. Don't promise Google indexing or backlinks.
5. Explain remaining manual tasks as exact, short, numbered clicks only when needed. Provide direct links to official provider dashboard/docs, and verify current UI wording if browsing is available.
6. End with: what changed, which tests truly passed, blockers, actual preview/deploy URL if created, and what the user must do next.

## Never do

Never paste keys; invent tool output; deploy repeatedly to diagnose simple errors; claim a policy placeholder is legally valid; mark manual tasks tested without evidence; expose server keys in `NEXT_PUBLIC_` or `VITE_`; grant anonymous access just to make a demo work; disable RLS to fix an error; silently enable auto-previews; or claim a mobile device's localhost can reach a desktop local preview without networking.
