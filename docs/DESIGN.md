# OpenBuilder: execution-first visual design pipeline

**Goal:** build distinctive, attractive websites using a repeatable design-first process. **Beautiful every time is not objectively guaranteed**—taste, brand, content, photos and real visual review matter—but OpenBuilder must do more than just mention design libraries.

The default workflow is **SuperDesign draft → Canvas UI selection → real frontend implementation → visual QA → release gate**.

## 1. Actually use SuperDesign

The current supported upstream is https://github.com/superdesigndev/superdesign-skill, **not** its archived original VS Code extension. SuperDesign generates drafts/design-system material using a CLI and can use additional account/credits. Use it as the **preferred design generator** where a shell-capable coding agent and user authorization permit it.

After consent, upstream documents installing the agent skill (for a non-Claude coding agent) and CLI:

~~~bash
npx skills add superdesigndev/superdesign-skill
npm install -g @superdesign/cli@latest
superdesign login
~~~

For Claude Code, prefer the plugin-specific installation flow from SuperDesign's README instead of adding an unnecessary duplicate skill.

For an existing codebase, **follow the upstream skill**, including `superdesign init`, creating a design system at `.superdesign/design-system.md`, and preparing its required init context. Its project creation + design-draft sequence is the actual source of the design.

OpenBuilder provides helper commands run from the **toolkit** checkout:

~~~bash
# Inspect whether a design plan is complete and SuperDesign CLI appears installed
node bin/openbuilder.mjs design status --project ../my-website

# After installing/authenticating the CLI AND explicitly approving provider calls
node bin/openbuilder.mjs design inspire --project ../my-website --query "editorial healthcare website" --approve-external

# Follow the maintained upstream skill to perform SuperDesign init and create a project.
# Only after the six init context files and design-system.md exist, generate a real draft:
node bin/openbuilder.mjs design draft --project ../my-website --project-id REAL_SUPERDESIGN_PROJECT_ID --title "Homepage" --prompt "A calm, elegant mobile-first healthcare homepage with excellent typography" --approve-external
~~~

This invokes the **real SuperDesign search-prompts or create-design-draft** command. It neither simulates design generation nor buys credits automatically. Inspect the returned canvas and actual draft ID, implement its design, and record the result. Don't run multiple paid iterations just to increase variety.

**Critical:** A generated screenshot/draft is not a working website. The coding agent still needs to implement the design in React/CSS and test it. If the CLI is absent or authentication fails, explain the limitation rather than claiming it ran.

## 2. Evaluate Canvas UI during component design

Upstream: https://github.com/DavidHDev/canvas-ui. Canvas UI provides animated/glass/fluid/3D components, not a complete design system. It has **MIT + Commons Clause** terms. Respect them before including source in a commercial product and don't copy Canvas UI components into MIT starter templates by default.

Use Canvas UI when it improves the experience without compromising text legibility, accessibility or performance. Example: an immersive creative studio hero may benefit from a restrained canvas effect; a patient intake form generally shouldn't have an expensive fluid shader.

For a React app already configured for the shadcn registry, after approving the license and dependency changes, the OpenBuilder wrapper can invoke its actual install command:

~~~bash
node bin/openbuilder.mjs design canvas --project ../my-website --component liquid-react --approve-external --accept-canvas-license
~~~

This performs `npx shadcn@latest add @canvas-ui/liquid-react` and modifies the **application**, not OpenBuilder. It refuses to run if shadcn is unconfigured; consult Canvas UI docs for current compatibility. Other registry components can be selected and reviewed individually. Test the actual result and provide reduced-motion/mobile fallbacks.

## 3. Design record required in generated apps

Every starter includes two artifacts:
- `DESIGN.md`: readable design brief, aesthetic direction, page structure and tokens.
- `design-review.json`: structured status, actual SuperDesign and Canvas UI use, and evidence of visual/mobile/accessibility/performance checks.

Run inside the app:

~~~bash
npm run design:check
~~~

Or from OpenBuilder's toolkit:

~~~bash
node bin/openbuilder.mjs design check --project ../my-website
~~~

A blank `design-review.json` is **not release-ready**. The local `release` gate blocks for both starter web and game projects until valid design evidence is present. Completing the JSON does **not** independently prove visual quality; screenshots/real tests must substantiate claims.

## 4. Normal ChatGPT/Claude chat without a shell

A repository link alone does **not** execute SuperDesign or the Canvas UI installer. In no-shell chats:
1. Read the same design playbook and draft a concrete aesthetic and responsive screen architecture.
2. If real SuperDesign use is desired, guide the user to a coding agent or ChatGPT Work with shell access and install/authenticate according to current supported tools; do not fabricate API calls.
3. Write the actual application code through an authorized GitHub connector, including the design files and independent CI. Mark SuperDesign `unavailable` unless it was genuinely used.
4. Record the Canvas UI suitability decision; don't claim it was installed merely because a reference link appears.
5. Treat screenshots and UX review as unverified until real evidence is available.

## 5. Design quality bar

A good design has strong hierarchy, readable type, appropriate imagery, confident spacing, responsive layout, useful navigation, purposeful details, states for loading/empty/errors, inclusive keyboard controls and attractive **real content**.

Preview locally/sandbox-first; assess mobile (including a slower Android profile) and desktop. Iterate on problems. Use automated a11y and performance tools where available. GPU effects are not a shortcut to good typography or layout.

**Never fake external tool use, user approval, screenshot evidence or design quality certification.**
