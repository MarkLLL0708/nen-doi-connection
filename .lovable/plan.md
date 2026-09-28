# Nến Đôi visual foundation

## Build
- Create one central product-name configuration and a Vietnamese-first translation setup with complete English equivalents; keep all visible component copy in translation resources.
- Define a warm cream, ember, rose, and charcoal design system with category gradients, dark mode values, large rounded typography, generous spacing, soft shadows, and reduced-motion-safe animation tokens.
- Build the requested reusable controls and displays: primary/secondary buttons, tags, cards, gradient screen, bottom sheet, avatar pair states, animated streak, empty state, confetti, swipe card, eight-expression flame mascot, and five-tab floating navigation.
- Create `/styleguide` as the only product view for now, constrained to 390px on larger screens and showing every requested visual primitive and state. Redirect `/` there.
- Add installable-app metadata and a manifest, without service logic, storage, accounts, or real feature flows.

## Technical details
- Use `react-i18next` with Vietnamese as the fallback/default language and English resources ready for later switching.
- Use semantic Tailwind v4 tokens in the single global theme file and React/CSS animations that honor `prefers-reduced-motion`.
- Draw the mascot as an original reusable inline SVG with expression-specific face details.

## Verification
- Check compilation diagnostics.
- Open and inspect the style guide at mobile and desktop widths.
- Verify all eight expressions, components, gradients, type samples, Vietnamese diacritics, interactive sample states, and reduced-motion behavior.
