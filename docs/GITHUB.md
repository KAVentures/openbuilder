# GitHub handoff: connect or create the application repository

OpenBuilder must **not** finish an app build with only a note saying "you should connect GitHub." GitHub is part of the actual workflow. Handle it as early as possible, ideally before implementing code, and verify it again before release.

## Flow for normal ChatGPT, Claude and other chats

1. Check whether the AI can **read and write** GitHub and whether the current project has an app repository/URL. A GitHub READ connector might not permit creation or pushing.
2. If a user already provided a repo, verify it exists and is user-owned/authorized; work on a **feature branch and PR** rather than overwriting main.
3. Otherwise, check the **actual available tool catalog** for an action that can create a GitHub repository. Never assume a create-repo tool exists merely because the GitHub connector is connected.
4. If creation is supported, propose a short repository name and **private visibility by default**. Obtain explicit approval (repo owner/name, visibility and any initial push) before invoking the create action. Create the repository and transfer the generated app code with hidden workflows, lockfile, and tests; open the app PR and read its actual CI checks.
5. If the connector cannot create repos, immediately guide the user to **https://github.com/new**. Exact steps: choose owner, name, private/public, and click **Create repository**; keep it EMPTY (don't initialize README/LICENSE/.gitignore when copying the app starter); share its GitHub URL. Then use available GitHub WRITE actions to commit the app and open a PR. Do this **during build**, not as a sentence at the very end.
6. If the connector is read-only and cannot commit, explain that limitation and use a coding agent with write permission or give the user a download/import flow. Never pretend it saved the app to GitHub.
7. Before calling the build complete, verify the application source is in GitHub, the app-specific CI workflow was triggered, and provide an actual repository/PR link. "Code generated" is not the same as "published to GitHub."

GitHub's repository selection/creation is a user-owned operation. Never store GitHub tokens in the frontend, repository, or chat.

## Flow in Claude Code / Codex with shell access

OpenBuilder can automate this handoff using GitHub CLI (gh) and existing OAuth/session credentials.

~~~bash
# In the OpenBuilder toolkit, for an application in a sibling folder:
node bin/openbuilder.mjs github status --project ../my-app

# If the user already has a GitHub repo:
node bin/openbuilder.mjs github connect --repo MY-USERNAME/my-app --project ../my-app --confirm

# Or AFTER the owner explicitly approves creating a private repo:
node bin/openbuilder.mjs github create --name my-app --visibility private --project ../my-app --confirm
~~~

Default create is **private**, and the confirmed command commits/pushes the app unless --no-push is specified. The CLI uses authenticated GitHub CLI commands, not OpenBuilder-hosted API credentials.

If gh is missing, install [GitHub CLI](https://cli.github.com/), then run **gh auth login** through GitHub's supported login flow. No user token should be pasted into an AI chat.

The commands are safe to run for local projects *only after* authorization. They refuse a conflicting existing remote, an already-used repository name, uncommitted changes on an initialized repo, and detectable security blockers. Never force-push, overwrite or silently make a private app public.

### Existing Git remote

If origin is already configured, the CLI reports it and **does not create another repository**. Confirm that the URL refers to the intended user-owned project and that pushing to it is permitted.

### CI and production gates

The generated app's own GitHub Actions checks run after source is pushed. OpenBuilder's local release command checks for a GitHub origin remote and blocks if missing. This is a local check of configuration, **not** proof that a GitHub remote exists online or that its workflows passed. Confirm the actual GitHub URL and CI results before production deployment.

## Why ask early?

If the AI starts only in temporary chat memory, then finishes before connecting GitHub, it may have nowhere reliable to save source. Checking connection when the app is first planned avoids lost code and also makes GitHub Actions available for real validation.

## What remains unautomated

- A normal chat whose GitHub connector has no create-repo action cannot create one by itself; the user must do the one-time action on GitHub.
- Agents can automate creation only within **their actual tool permissions** and with user approval. Automatic unauthorised publishing would be unsafe.
- GitHub creation is not a substitute for Vercel deployment. Keep Vercel auto-previews disabled as configured; production hosting remains a later, separately approved step.
