# Connecting your web app

You do **not** need every service. Ask your connected AI to guide you through them when a feature needs one.

- GitHub stores your project's source code. Create a new repository and give your coding AI permission to edit that repository. Never paste a personal access token into the chat.
- Supabase supplies database, authentication and storage *if needed*. Connect its official integration in your AI app, select your project, and authorize project-scoped access. Require server-side access checks and RLS tests before handling real user data.
- Vercel deploys the application. Authorize the Vercel integration or import the GitHub repository into Vercel. This starter disables automatic Git deployments; use an explicit deployment only after release checks.
- Resend delivers transactional emails *if needed*. Verify your sending domain in Resend, configure the DNS records shown there, then provide the sending identity through your hosting provider's **server-side** environment settings. Do not paste API keys into frontend code.

See the repository docs for click-by-click guidance and restrictions.

## GitHub connection is part of the build

Don't finish the app with just a reminder to connect GitHub. Check the app's repository first; if none exists, ask the owner to approve private-repo creation. In a local coding agent use OpenBuilder's github status/create/connect commands; in a chat without repository-creation permission guide the user to https://github.com/new, then use the authorized GitHub connector to upload app source. The release gate requires an origin remote, but actual GitHub CI results still need verification. See https://github.com/KAVentures/openbuilder/blob/main/docs/GITHUB.md.
