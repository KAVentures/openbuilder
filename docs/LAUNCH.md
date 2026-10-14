# Production readiness checklist

This is a release policy, not a promise of automatic certification. An agent must identify which checks apply, run objective tests where possible, and mark every external/manual item **not verified** until genuinely confirmed.

## Security, reliability and product readiness (20 checks)

| # | Requirement | What counts as evidence |
|---|---|---|
| 1 | Hide all API keys | Scan source, Git tracked files, frontend bundles and public logs; privileged values server-only. |
| 2 | Rotate committed secrets | Revoke and rotate from provider, check history, verify old key no longer works. |
| 3 | Rate limit abuse | Test route quotas, abuse identities, persistence and service limits, not only client UI. |
| 4 | Authorize every protected route | Attempt direct API requests as unauthenticated and wrong user; deny on server. |
| 5 | Lock down database access | Supabase RLS and Storage negative tests with two distinct users. |
| 6 | Validate inputs server-side | Malformed, oversized, hostile and boundary inputs rejected on backend. |
| 7 | Set AI spending controls | Provider dashboard limit/alert where available **plus** app quotas and circuit breaker. |
| 8 | Prevent error detail leaks | Production 500 pages hide stack traces and server internals; logs stay server-side. |
| 9 | Error monitoring | Instrument failures; verify a synthetic exception generates an alert. |
| 10 | Backup and restore | Test restoring database in a separate environment; verify data integrity and Storage backup. |
| 11 | Good 404/500 pages | Exercise missing URL and deliberate 500 response on the real build. |
| 12 | Cheap Android compatibility | Test narrow touch screen and reduced hardware/network capabilities. |
| 13 | Reasonable speed | Browser/performance budget; verify real user flows and slow pages. |
| 14 | Share-friendly metadata | Per-page title, description, OG image and correct URLs on deployed domain. |
| 15 | Privacy policy and terms | Accurate editable legal documents reviewed by owner for actual data practices and jurisdiction. |
| 16 | Analytics | Privacy-conscious instrumentation and funnel verification if applicable. |
| 17 | Signup/payment/reset E2E | Real signup and reset test; sandbox payments/webhook replay where relevant. |
| 18 | Email delivery | SPF/DKIM/DMARC and delivery to multiple inbox providers; monitor bounces. |
| 19 | Contact method | Visible and monitored support email/form, checked end-to-end. |
| 20 | Rollback plan | Document and rehearse reverting app, migrations and env changes without data loss. |

### Optional features

Edit `openbuilder.json` feature flags so `release` requires the appropriate manual attestations. In particular `auth`, `database`, `email`, `payments`, `ai`, `personalData` and `indexed` should reflect **actual** behavior, not merely what the starter generated.

The static audit can only flag a subset of the above. Manual evidence goes to `.openbuilder/launch-evidence.json` (ignored by Git). Never record `verified: true` before a real test. Owners can also mark checked items in an external issue/tracker.

## SEO, crawlability and editorial quality

- Use SSR, static rendering, or progressive enhancement **where needed** to make public content crawlable. JS-only pages aren't automatically invisible to Google.
- Generate an accurate sitemap; submit it after verifying the site property in [Google Search Console](https://search.google.com/search-console/).
- Inspect the **deployed** `robots.txt`, `noindex`, HTTP status and canonical. Do not remove `noindex` from private dashboards, staging, account or checkout pages.
- Fix unintended redirect chains and broken pages; ensure canonical tags and real page-specific title/meta descriptions.
- Use clear page structure, meaningful headings (normally one primary H1), breadcrumbs where they help, internal links that fix orphan pages and alt text for informative images.
- Apply structured data only when eligible and accurate. **FAQ rich results have restricted eligibility**, so don't promise rich results.
- Optimize image sizes and formats (WebP/AVIF when appropriate); limit CLS and measure LCP, INP and other Core Web Vitals.
- Set realistic performance budgets and test on mobile. A guaranteed universal two-second load time isn't possible.
- Remove generic AI-written filler; publish useful original content. Include a **real** author/editor bio when appropriate and authorized — never manufacture credentials.
- Earn relevant editorial backlinks through legitimate outreach; do not create fake link networks.
- Confirm indexing *in Search Console* after deployment. Valid technical SEO never guarantees Google will index/rank a page.

## Release evidence schema

```json
{
  "checks": {
    "rollback": {
      "verified": true,
      "at": "2026-10-14T12:00:00Z",
      "commitSha": "REPLACE_WITH_CURRENT_GIT_COMMIT_SHA",
      "notes": "Rehearsed rollback to previous staging deployment."
    },
    "backup_restore": {
      "verified": false,
      "at": "2026-10-14T12:00:00Z",
      "notes": "Not tested yet; blocks release."
    }
  }
}
```

Pre-deployment required keys: `rollback`, `error_tracking`, `mobile`, `performance`, `contact`, `legal_review`, `backup_restore`. A **production smoke test is required after actual deployment** and cannot honestly be attested before the first production release. Conditional keys: `auth_routes`, `password_reset`, `rls_isolation`, `email_deliverability`, `payment_e2e`, `spending_limits`, `rate_limits`, `privacy_review`, `search_console`, `public_seo_review`.

`release` checks structure and runs configured tests/builds locally; it cannot prove claims were true or perform a real production smoke test before deployment. Treat post-deploy verification as a **separate mandatory step**. Never mark a staging test as verified production.

### Evidence freshness

The local `release` gate now requires every attestation to include the **current Git HEAD SHA** as `commitSha` and a timestamp `at` from within the past **seven days** (up to five minutes clock skew). Old evidence and evidence for another commit cannot pass. A new commit after attestation means relevant checks must be repeated. The checks remain **self-attestations** and are not independent proof.

On Windows, npm execution uses `cmd.exe`; on failure OpenBuilder surfaces redacted diagnostic output rather than a silent 'blocked' result.
