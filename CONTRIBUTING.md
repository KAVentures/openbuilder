# Contributing to OpenBuilder

OpenBuilder is an open-source toolkit under the [MIT license](LICENSE). We welcome bug fixes, tests, accessibility improvements, clearer beginner instructions and safe integrations.

## Before opening a PR

1. Search [existing issues](https://github.com/KAVentures/openbuilder/issues) and open a focused issue for larger changes.
2. Fork OpenBuilder or create a feature branch from `main`. Never include your own generated `projects/` app in a toolkit PR.
3. Use **Node.js 20+**, then run the checks below.
4. Add regression tests for changes to scaffolding, previews, credential detection, retries or release gating.
5. Describe the actual checks you ran and any external behavior you *didn't* verify.

~~~bash
npm run check
npm test
~~~

If you change the web template, also run:

~~~bash
cd templates/web
npm install
npm test
npm run build
~~~

## Principles

- **Don't hide failures.** Tests and CI should catch real bugs; no fabricated test evidence or security claims.
- **Keep it beginner-friendly.** Prefer simple explanations and sensible defaults over a maze of settings.
- **No unapproved cloud actions.** Keep local iteration separate from user-authorized deployment.
- **Privacy and least privilege.** Do not include real keys, personal data, customer screenshots or private files in issues, fixtures or logs.
- **Portable workflows.** Don't hard-wire the playbook to a single AI provider or chat interface.
- **Be respectful and specific.** Describe reproducible technical problems, not personal criticisms.

For sensitive security reports, follow [SECURITY.md](SECURITY.md) rather than opening a public issue. For project scope, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
