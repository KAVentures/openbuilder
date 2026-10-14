# Publishing one-click GitHub app templates

GitHub's **Use this template** applies to an entire repository, not a subfolder. OpenBuilder currently stores its starters under **templates/web/** and **templates/game/**, so chat-only agents otherwise have to copy many files.

The GitHub connector in this session cannot create repositories or change their **template** setting. This repository provides a maintainer script to do that, but these public starter repositories **are not yet confirmed published**. Do not link to them or claim one-click creation already works.

## One-time maintainer setup

Install Git, Node.js 20+, and [GitHub CLI](https://cli.github.com/). Run **gh auth login** and authenticate as the KAVentures owner authorized to create public repositories. Configure Git author name and email.

~~~bash
git clone https://github.com/KAVentures/openbuilder.git
cd openbuilder

# Safe dry run: shows what would be created
node scripts/publish-template-repos.mjs

# Explicitly create and publish both repositories as GitHub templates
node scripts/publish-template-repos.mjs --publish
~~~

This creates PUBLIC repositories named **KAVentures/openbuilder-web-template** and **KAVentures/openbuilder-game-template**, pushes the scaffold as each repository's root, then enables GitHub's template flag. It refuses to overwrite an existing repository and doesn't ask for tokens in chat. If only one succeeds, inspect the partially completed state manually; it will not force-push or reset anything.

Verify the **Use this template** button on each repository, and generate a throwaway app through it. Its GitHub Actions must run independently: **npm ci**, audit, tests and build for web, and audit/tests for game. Automatic Vercel deployments should remain off.

## For ordinary AI chats

Once the starter repositories actually exist, an AI with GitHub write access can ask the user to choose **Use this template → Create a new repository**, or call a supported template-generation tool if available. Then modify the new app's files and use its CI. This replaces the fragile copy-every-file route. If they don't exist or tools cannot create from templates, the full-tree copy documented in GETTING_STARTED.md remains the fallback.

## Synchronizing future changes

The published template repos are independent. When modifying the source template subfolders in OpenBuilder, submit matching PRs to the public template repos. The one-time publishing script deliberately refuses to replace existing repos. Audit-copy consistency checks protect the toolkit, while each published repo needs its own post-sync CI.
