<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the product name in `src/config/product.ts`; placeholder branding must be changeable in one place.
- Keep visible copy in `src/i18n/index.ts` with Vietnamese default and English translations; this avoids scattered hardcoded text.
- Keep visual tokens in `src/styles.css` and visual primitives in `src/components/visual`; this provides one theme and a reusable foundation.
- `/styleguide` and the sample-data `/preview-home` are the only views; `/` redirects to `/styleguide`. This prevents premature feature screens.
- The design language is editorial "fun but classy" (Newsreader + Inter, line icons, muted duotones, slow eases); no mascot, emoji icons, confetti or springs. Later requests are translated into it.
- `public/manifest.webmanifest` and the flame icon establish PWA presentation only; offline caching and functional flows are intentionally deferred.
