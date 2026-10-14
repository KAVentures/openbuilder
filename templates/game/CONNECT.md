# Game setup

You can play this game locally with zero external accounts. From the OpenBuilder repository, run `node bin/openbuilder.mjs preview path/to/game`.

If you later want a public URL, connect GitHub and Vercel when your AI asks. Automated Vercel Git deployments are disabled in this template; the preview is local. Update the domain-specific sitemap and add a real privacy notice if analytics, accounts, advertising or other data processing is introduced.

Only connect Supabase for game features that actually need accounts, shared scores, or realtime data. Only connect Resend if the game needs transactional email.

## GitHub connection for sharing the game

GitHub isn't needed to play locally. When publishing, the agent must actively connect an existing authorized GitHub repo or request consent to create a private new one. If it has no repository-creation tool, guide the user to https://github.com/new **before finishing** and save the app there with the GitHub connector. See https://github.com/KAVentures/openbuilder/blob/main/docs/GITHUB.md.

## Design review

Use DESIGN.md and design-review.json when designing the game. SuperDesign can help with visual directions if it is actually executable; do not claim its use when unavailable. A Canvas UI runtime is not a requirement for a plain Canvas game. Run `npm run design:check` and review keyboard, touch, motion and low-powered hardware before launch.
