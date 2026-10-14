# OpenBuilder — Claude Code instructions

You are in the OpenBuilder **toolkit**, not a finished user's application.

Read [AGENTS.md](AGENTS.md), [skills/openbuilder/SKILL.md](skills/openbuilder/SKILL.md) and [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md). Follow the existing playbook and explain technical steps in beginner-friendly language.

When the user asks you to **create an app/game**, work in `../<project-name>` as a sibling of the toolkit by default. Run `node bin/openbuilder.mjs init <project-name> --template web|game --dir ..` from the toolkit root. Use a separate GitHub repository for the user's finished app, with explicit authorization.

Only edit OpenBuilder's own implementation if the user asks to contribute to this toolkit. Don't silently deploy, buy a domain, reveal a secret or assume a Claude chat has access to local files. Local preview first; controlled deployment later.
