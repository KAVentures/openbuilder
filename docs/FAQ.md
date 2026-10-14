# OpenBuilder FAQ

### Is OpenBuilder an alternative to Lovable?

It aims to help people build and ship apps using **their existing coding-capable AI**, without requiring a separate OpenBuilder AI subscription. The current version is a repository-based workflow and local CLI, **not** a visual drag-and-drop builder comparable to Lovable.

### Is pasting the GitHub URL into ChatGPT enough?

It is enough to request the workflow. Your AI must be able to access the repository. Building and modifying the actual app requires file-write capabilities (for example, an authorized GitHub integration), and running it requires a terminal or sandbox. Different ChatGPT conversations may offer different tools.

### Do I need Claude Code or Codex?

No. They are the most straightforward local options, but you can work through a supported chat interface with appropriate tools. [See setup options](GETTING_STARTED.md).

### Is using an existing AI subscription unlimited?

No. Chat/model/tool usage limits and subscription rules are provider-specific. OpenBuilder doesn't bypass usage caps and doesn't supply free inference for AI features your deployed application uses.

### Do I need GitHub, Vercel, Supabase and Resend?

No. A local browser game can work with **none** of them. Add GitHub when you're ready for version control; Supabase for user data/auth, Resend for email and Vercel for a hosted URL. Other stacks are possible, though the templates focus on these defaults.

### Can it automatically deploy without Vercel preview charges?

The starters disable Git-triggered Vercel deployments by default, and the playbook prioritizes local checks. The current retry-budget CLI doesn't block a human or unrelated AI connector from deploying. Verify Vercel's **actual project settings**. An explicit release may still incur platform usage charges.

### Can it show my app inside a ChatGPT conversation?

Not universally. Embedded previews depend on the AI interface and whether it has a suitable sandbox/UI capability. The included preview is local to the machine running it; a phone cannot automatically reach your computer's localhost.

### Is the generated app ready to take payments or personal information?

Not just because tests passed. The web starter doesn't implement payments, auth, or Supabase RLS. Use the [production checklist](LAUNCH.md), add real tests and verify your deployed system. This toolkit is not a security or legal certification.

### Can I use OpenBuilder for a game?

Yes. The starter includes a playable 2D Canvas game. It is not yet a multiplayer game server, native iOS/Android framework or advanced 3D engine.

### What does MIT mean?

You can use, modify, copy and distribute the code—including commercially—while retaining the required copyright and license notice. The software comes without warranty. Read [LICENSE](../LICENSE) for the full text.

### Can I contribute?

Absolutely. Start with [CONTRIBUTING.md](../CONTRIBUTING.md), add a reproducible issue and propose a focused PR with tests.
