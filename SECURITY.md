# Security policy

Do not disclose exploitable vulnerabilities or leaked user secrets in a public issue. Contact the repository maintainers privately through GitHub's **Report a vulnerability** feature if enabled, or a private maintainer channel.

The CLI never requests or stores provider API tokens and performs no automatic deployment. Generated app templates are *starting points*, not security-certified production systems. The static scanner is incomplete and cannot guarantee all Git history or runtime credentials are safe.

Never paste real tokens into ChatGPT or other chats. If a credential has been leaked, **revoke and rotate it first**, then investigate the repository, logs, deployments and history.
