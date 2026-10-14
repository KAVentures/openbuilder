# OpenBuilder design workflow

OpenBuilder should produce considered, usable interfaces instead of generic AI boilerplate.

## Recommended external tools

1. SuperDesign: https://github.com/superdesigndev/superdesign-skill — the **maintained** design-agent skill for Claude Code, Codex and compatible coding environments. The older https://github.com/superdesigndev/superdesign IDE extension is historical and not actively maintained.
2. Canvas UI: https://github.com/DavidHDev/canvas-ui — **optional** WebGL/WebGPU and canvas components for glass, liquid, shaders and motion. Canvas UI is under **MIT + Commons Clause**, not unqualified MIT; do not copy its source into OpenBuilder's MIT-licensed templates or claim the resulting third-party component is MIT only.

## Design-first build order

1. Learn the purpose, users, brand, target devices and accessibility constraints. Make sensible defaults where the user hasn't given a style. Ask a question only when genuinely important.
2. Create/update DESIGN.md in the *application* repository with user journeys, visual direction, typography, color and spacing tokens, screens, breakpoints and interaction states.
3. Sketch primary routes and reusable components before implementing them. Use SuperDesign when it is actually installed, authorized and supported. Its skill requires command execution and may involve a separate product login.
4. Implement clear information hierarchy, good contrast, keyboard/touch accessibility, loading, error and empty states, meaningful microcopy, and responsive layouts. Avoid generic gradients or heavy dependencies without reason.
5. Treat Canvas UI as a selective *enhancement*. Install only an appropriate effect after user approval and license review. Verify mobile GPU performance, progressive fallback, SSR hydration, prefers-reduced-motion and touch devices. For a simple booking app, CSS may be better.
6. Inspect mobile and desktop rendering when a real preview/browser tool exists. If an ordinary AI chat has no shell or browser, follow the same design brief but don't claim design previews or external design CLI were run. Do not waste Vercel previews to assess simple CSS.

## Optional SuperDesign skill installation

For local coding agents with a shell, SuperDesign documents:

~~~bash
npx skills add superdesigndev/superdesign-skill
npm install -g @superdesign/cli@latest
superdesign login
~~~

Claude Code also supports its separately documented plugin installation path. These steps require the user's permission and may have independent account/cost implications. Normal chat without shell access cannot run the SuperDesign CLI and must instead use the design brief plus existing editing tools.

## Optional Canvas UI components

Canvas UI documents a shadcn-compatible registry. Only in a compatible project, after shadcn initialization and authorization, an example is:

~~~bash
npx shadcn@latest add @canvas-ui/liquid-react
~~~

This is not part of the default template. Review imported code, licensing and dependencies. Avoid unnecessary animation, preserve real interactive HTML, and provide reduced-motion alternatives.

## A simple design requirement

Design quality comes from thoughtful hierarchy, navigation, legibility and performance, not from applying glass/particle effects everywhere.
