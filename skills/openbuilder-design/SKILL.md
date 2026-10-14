---
name: openbuilder-design
description: Required first stage for every app frontend: use SuperDesign to generate an actual draft where executable, evaluate Canvas UI effects, implement the design, and verify it before release.
---

# OpenBuilder Design Skill — Design → Code → Review

Read `docs/DESIGN.md` and `AGENTS.md` in the OpenBuilder repository. **Do not start building the website's frontend before completing a distinctive app-specific design brief.** Create the application's `DESIGN.md` and `design-review.json`.

1. **Use real SuperDesign when possible.** Check for a shell and installed skill; request authorization for installation, login and any generation credits. Follow the **maintained** upstream skill at https://github.com/superdesigndev/superdesign-skill, including initialization and a real design-draft command. Do not claim use merely because these instructions mention the tool. Prefer the skill's full design-draft flow; OpenBuilder's `design inspire` and `design draft` commands can invoke CLI actions but do not replace the upstream skill's preparation.
2. **Inspect results and implement them.** Translate the actual selected design into code (typography, responsive layout, navigation, spacing, colors, content and component hierarchy). Store real SuperDesign project/draft IDs and implementation notes. Never fabricate them.
3. **Evaluate Canvas UI during component selection.** Its MIT + Commons Clause code is not part of the OpenBuilder MIT template. Select and import a component from https://github.com/DavidHDev/canvas-ui only if visually appropriate, authorized, compatible and fast on mobile; otherwise record `not-suitable` with rationale. Respect reduced motion and browser fallback.
4. **Verify.** Browser/screenshot review where possible, keyboard/focus and contrast, mobile and performance. Fix weak layout/content instead of blindly adding effects. Record actual results in `design-review.json`; mark `status=ready` only when complete. Run `npm run design:check` within a generated app or `openbuilder design check` in the toolkit CLI before release.

**No shell/ordinary chat:** SuperDesign CLI is unavailable. **Automatically research competitors through actual web search and visual browsing tools**, following `docs/COMPETITOR_DESIGN.md`: inspect at least three distinct websites in the product field, compare their real layouts, typography, motion, palettes and mobile experience, choose a strong reference, and independently implement its successful general design patterns in the app's own original identity. Mark `superdesign.status=unavailable`, not `used`, and fill `competitorResearch` with actual URLs and visual evidence. Do not copy competitor text, logos, proprietary CSS/JS, distinctive brand identity or unlicensed fonts/assets. If visual browsing is unavailable, keep the review blocked; do not claim these sites were inspected.

Avoid needless preview deployments. External login, downloads, spending, and dependency additions require authorization.
