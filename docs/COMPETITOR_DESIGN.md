# OpenBuilder: competitor-led design research

**Required fallback when SuperDesign cannot run or the user declines it.** Use real web search and rendered-browser inspection to select a well-designed competitor as a visual reference, then independently implement a distinctive website. Do not improvise a generic AI theme.

> This is a **visual inspiration** workflow, not website mirroring, source copying, impersonation or pixel-for-pixel cloning. Reuse layout conventions, typography *ideas*, spacing systems, interactive behaviors and general aesthetic direction, not third-party protected expression or brand identity.

## 1. Discover real competitors with tools

Understand the proposed website's **industry, audience, region, business model and main conversion goal**. Automatically call the available web search tool, using at least two relevant searches (not merely drafting queries):

- `best [industry] companies [region] websites`
- `modern [industry] brands websites visual design [region]`
- Additional queries for beautiful or award-winning sites in the category, if helpful.

Collect **three to five** relevant, **distinct real company websites**. Search results are starting points; a high Google ranking means relevance to the search query, **not** aesthetic excellence. Don't pick the first result automatically.

Exclude directories, templates, image-search collections and competitors unrelated to the product. Don't infer current page appearance from cached text snippets.

## 2. Inspect actual rendered pages

Use a live browser or visual inspection tool to open each public homepage (and a key service/product page where useful), observing desktop and mobile layouts where possible. Record actual time and verifiable visual evidence, such as browser screenshot artifacts or a specific rendered-browser observation with captured reference. Do not fabricate timestamps, image captures, fonts or effects.

For every candidate write:
- **Layout:** hero structure, grid, visual hierarchy, content rhythm, section transitions, navigation
- **Typography:** visible font characteristics, hierarchy, weight and size; exact font family only when verified
- **Color:** observed relationships and approximate palette (exact values only if measured)
- **Motion:** *observed* hover, scroll, canvas and other interactions; don't infer motion from static source
- **Mobile:** menus, responsive composition, readable density, touch usability
- **Visual score (1–5):** explicitly subjective, based on cohesion, tasteful execution, usability, and fitness for this project's audience
- **Selection rationale:** concrete strengths and limitations

Only claim a browser screenshot if you actually captured one. Search snippets and SEO positions are **not** visual evidence. A site that blocks automated browsing must be marked uninspected and replaced, not guessed.

## 3. Choose a primary reference

Compare the candidates and select **one strongest aesthetic reference appropriate to the user**. Record the selected URL, search queries and why it was chosen. If another site received a higher visual score, document why your chosen reference is better for the intended audience or constraints. Secondary references can provide complementary patterns, but keep one coherent art direction.

Extract at least **three concrete implementation patterns**, such as: split hero with restrained asymmetry, editorial oversized serif headings paired with modern sans body text, alternating narrow/wide section rhythm, subtle button microinteractions, constrained use of translucent surfaces, or scroll-reveal with reduced-motion fallback.

## 4. Adapt the design ideas, not the identity

- Rebuild general layout patterns and interaction behavior with **new, maintainable code**. Do not copy a competitor's HTML, CSS, JavaScript, proprietary shader code or design files without a valid license or explicit permission.
- Use the new user's own **logo, brand, content, iconography, images and illustrations**. Never copy identifiable product trade dress or create a site likely to be mistaken for that competitor.
- Use legitimately licensed fonts, whether the same family (only if permitted) or a similar licensed substitute. Do not download proprietary font files from the reference site.
- Use original or properly licensed photos, video, effects and components. **Canvas UI** is an optional source for effects, subject to its MIT + Commons Clause conditions and performance checks; do not copy the competitor's custom effects implementation.
- Make intentional improvements: adapt accessibility, conversion flow, responsive behavior and performance to the user's project. Sometimes the highest-ranked or most visually striking reference is wrong for older users or healthcare settings.

The [U.S. Copyright Office](https://www.copyright.gov/help/faq/faq-protect.html) explains why general ideas and functional methods differ from protected creative expression. Other jurisdictions and trademark/unfair-competition issues may impose additional constraints. This playbook is not legal clearance for copying a complete page.

## 5. Record actual evidence

Fill `competitorResearch` in each app's `design-review.json`:
- `status: "researched"`, `industry`, `queries` (at least 2 real search queries)
- `candidates` (3+ distinct HTTPS competitor websites): `url`, actual `inspectedAt` (ISO datetime, checked within 90 days), integer `visualScore` 1–5, `visualEvidence`, `selectionRationale`, and `observations` with `layout`, `typography`, `color`, `motion`, `mobile`
- `selectedUrl` matching a candidate URL; `whyChosen` if you didn't pick the highest-rated design
- `adaptedPatterns` describing at least 3 clear choices based on observations
- `originality`: `distinctBrand`, `assetsAndFonts`, `effects`, `fit`, each with real decisions about differentiating and adapting the site.

Update `DESIGN.md`, build the site's frontend, and perform genuine visual review. Run `npm run design:check` in a generated app or `node bin/openbuilder.mjs design check --project ../my-app` from the toolkit. The automated check validates **record completeness**, not whether the research was actually performed, source assets were licensed or the website looks good.

## 6. When tools are missing

If SuperDesign is unavailable and your AI **cannot actually search and visually browse public websites**:
1. Explain that competitor visual research isn't possible in that session.
2. Ask for a browsing-capable AI environment or user-supplied reference websites and screenshots. Do not fake search tool calls.
3. Continue unrelated parts of implementation if sensible, but leave `competitorResearch.status="pending"` and don't claim a completed visual design or release.

No infinite retries, access-control circumvention, arbitrary remote script execution or automatically deploying Vercel previews to inspect competitor layouts.
