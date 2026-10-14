# Game setup

You can play this game locally with zero external accounts. From the OpenBuilder repository, run `node bin/openbuilder.mjs preview path/to/game`.

If you later want a public URL, connect GitHub and Vercel when your AI asks. Automated Vercel Git deployments are disabled in this template; the preview is local. Update the domain-specific sitemap and add a real privacy notice if analytics, accounts, advertising or other data processing is introduced.

Only connect Supabase for game features that actually need accounts, shared scores, or realtime data. Only connect Resend if the game needs transactional email.
