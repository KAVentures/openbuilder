# Connect your accounts only when needed

OpenBuilder works with your existing AI interface. A connector is a secure way to let that AI interact with another service **without giving the AI your password**. The exact menus change; these are the intended steps. Always check current UI details before guiding a beginner.

## Start: GitHub (needed for cloud source editing)

1. Create a free account at https://github.com if you don't have one.
2. In your AI app, open its connectors/plugins/apps settings. In ChatGPT, open the current **Apps/Plugins/Connections** directory if available, search for a **GitHub** connection, and authorize it; confirm that write operations are supported when creating apps.
3. Sign in through GitHub's own authorization page and select only the relevant repositories. Do not share a personal access token in chat.
4. Tell your AI the new repository's URL; ask it to create a feature branch and PR. Confirm you can see the branch.
5. If a GitHub connector is not offered in your AI, download this toolkit and use a local coding-capable agent or GitHub website to add files.

## Supabase (only for DB, authentication, files or realtime)

1. Open https://supabase.com/dashboard and create an organization/project only if needed. Choose a region appropriate for your users and data requirements.
2. Connect **Supabase** in your AI's connector/plugin settings, select the correct organization/project, and approve only requested permissions. If the AI lacks a Supabase connector, follow Supabase's dashboard guides manually.
3. Have the agent create schema/migrations and **enable row-level security (RLS)** for all user-data tables. Authenticated-user policies must be tested with two accounts, including negative read/update/delete cases. Check Storage policies too.
4. Add any **server-only** credentials via your hosting provider's encrypted environment settings. Never send a service-role key in chat or put it in `NEXT_PUBLIC_`.
5. Before launch, decide backup/restore coverage and perform a restore drill to a separate environment. Storage objects may need separate backup.

## Vercel (only when ready to host)

1. Open https://vercel.com/dashboard and create an account. Link your GitHub account.
2. In the AI, connect **Vercel** if available. Import the target repository and choose its app directory. Confirm build settings and production branch.
3. Open **Project → Settings → Git** or the current build/deployment settings. **Verify that automatic Git deployments are disabled** while iterating. The templates also set `git.deploymentEnabled: false`.
4. Put server-side environment variables in Vercel's project settings under the correct environment, not source control. Use a separate preview environment for any risky testing.
5. Run local build/tests and the release gate. Explicitly ask the AI to deploy once, or use the Vercel dashboard/CLI for a controlled deployment.
6. Connect your domain under **Project → Settings → Domains**. Buy a domain only after confirming price and authorization. Configure DNS as Vercel instructs.
7. Verify the **production** URL, error pages, cookies, redirects, auth and rollback. Note: on-demand deployment and disablement vary by project configuration.

## Resend (only when the app sends email)

1. Open https://resend.com/domains; add a domain you own (or suitable subdomain).
2. Resend displays DNS records for verification, commonly SPF/DKIM. Copy the exact DNS values to your domain's DNS manager; do not guess.
3. Wait for verified status. Check DMARC and sender identity; send real messages to at least two major mailbox providers.
4. Connect the **Resend** connector to your AI if available. If not, create a scoped key inside Resend and store it **only** in Vercel's server-side environment variable settings; never paste it into the chat or commit it to Git.
5. Verify sender domain, signup/reset templates, bounce handling and spam placement. Deliverability isn't guaranteed.

## What if my AI cannot run a local preview?

A local server at `127.0.0.1` is reachable on that machine, **not automatically inside a mobile AI app**. If an agent has a secure sandbox, request its preview URL. If none is available, rely on CI/build checks while developing and make one controlled cloud deployment after verification. Embedding previews inside an AI chat requires that platform's supported widget capability; this repository does not provide a universal embedded preview.

## Accounts, billing and permission hygiene

- Your AI subscription is **not** the same as unlimited calls to an API. Model/tool limits and permitted subscription integrations vary.
- Hosting, DB storage, domains, email and application AI features can incur separate costs.
- Give connectors least-privilege access where feasible and review connected applications periodically.
- The builder should explain *why* each account is needed before asking you to connect it.
