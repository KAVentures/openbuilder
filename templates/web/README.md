# OpenBuilder web app starter

A basic Next.js/TypeScript project scaffolded from [OpenBuilder](https://github.com/KAVentures/openbuilder). **Not a finished production app.**

Use **npm ci** to install locked dependencies, **npm run dev** to develop, and **npm run check**, **npm test**, **npm run build** before release. This starter includes independent GitHub Actions for chat agents without a terminal.

The generated Vercel configuration disables automatic Git deployments; confirm provider settings separately. Set **NEXT_PUBLIC_SITE_URL** to your real HTTPS canonical URL before public indexing. Legal and contact pages are placeholders.

See [CONNECT.md](CONNECT.md), [OpenBuilder instructions](https://github.com/KAVentures/openbuilder/blob/main/AGENTS.md), and the [launch checklist](https://github.com/KAVentures/openbuilder/blob/main/docs/LAUNCH.md).

## The required design stage

Before building pages, read [OpenBuilder's design workflow](https://github.com/KAVentures/openbuilder/blob/main/docs/DESIGN.md). Use the maintained SuperDesign skill **for an actual design draft** when the coding agent has execution and authorization. Review Canvas UI for a suitable effect, but don't add shaders merely to decorate. Implement a unique app-specific `DESIGN.md`, then record real design results in `design-review.json`. Run `npm run design:check`; the local OpenBuilder release gate blocks unfinished design reviews. A completed record is not independent visual QA.
