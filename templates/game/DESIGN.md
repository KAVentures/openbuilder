# Application design brief

This is a **starter** brief. Replace it with the product's own decisions before building multiple screens.

## Product and audience
Describe the core user task, target devices, intended accessibility and branding.

## Design system
Specify typography, colors, contrast-safe foreground/background, spacing rhythm, layout grid, content hierarchy and reusable components. Avoid bland all-purple gradients unless requested.

## UX states
Document navigation, error/loading/empty states, form feedback, keyboard interactions, touch targets, mobile layout and real copy.

## Animation
Start with subtle CSS. Honor prefers-reduced-motion. Optional Canvas UI canvas/WebGL effects must have lightweight fallbacks and must not block reading or navigation.

## References
See https://github.com/KAVentures/openbuilder/blob/main/docs/DESIGN.md for optional maintained SuperDesign skill integration and Canvas UI effects. Neither is required or automatically installed.

## SuperDesign-unavailable competitor fallback

If SuperDesign cannot execute, search and visually inspect three or more relevant competitor websites using actual tools. Compare layouts, typography, effects, color and mobile behavior, and select the most suitable well-designed reference. Implement the **underlying ideas**, not the competitor's exact brand, copy, photos, proprietary scripts or unlicensed fonts. Record evidence in `design-review.json` under `competitorResearch`. No browser means no truthful visual comparison; don't mark it complete. See https://github.com/KAVentures/openbuilder/blob/main/docs/COMPETITOR_DESIGN.md.
