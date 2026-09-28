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
- Real screens: `/` (session-aware entry), `/intro`, `/auth`, `/join`, and gated `/onboarding`, `/pair`, `/app` (tabs via `?tab=`); `/styleguide` and `/preview-home` stay as design references.
- The partner-reveal rule is enforced in the database (RLS + `has_answered/has_posted/has_responded`); the UI never decides visibility. Pairing and streaks go through security-definer RPCs (`create_couple`, `join_couple`, `refresh_invite`, `today_status`, streak triggers).
- Lunar dates use the local Hồ Ngọc Đức algorithm in `src/lib/lunar.ts` (UTC+7), not a Chinese-calendar library, because Vietnam's calendar differs in some years.
- Tailwind `--spacing-screen` is 20px, so `min-h-screen` is wrong here; use `min-h-dvh`.
- The design language is "Colour Block" (Unbounded + Plus Jakarta Sans, flat palette blocks, 2px icons, snappy springs); reusable motion lives in `src/components/visual/motion.tsx` and `SwipeDeck.tsx`. Dark mode follows the phone via a CSS media query, overridable with `.light`/`.dark` on <html>.
- `public/manifest.webmanifest` and the flame icon establish PWA presentation only; offline caching and functional flows are intentionally deferred.
