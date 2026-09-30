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
- Daily questions are assigned per couple per day by the `today_question()` RPC (least-used first, so no repeats until the pool is used up); family/money packs join the pool only when both partners have a `pack_consents` yes. Pack keys: memory, family, tet, food, fun, money, distance, conflict, deep.
- Seed/content tables (daily_questions, game_content, photo_prompts, date_ideas, occasion_catalog) are editable by `admin` via `user_roles` + `has_role`.
- Test mode (TEST_MODE_REMOVAL.md): pill gated by import.meta.env.DEV, server fns gated by TEST_MODE secret; real sessions via magic-link tokens so RLS is exercised.

- One React copy: vite.config.ts dedupes react/react-dom/router/query and pre-bundles them plus every lazily-found library (optimizeDeps.include); a mid-session re-optimize once loaded two Reacts and blanked pages.
- Test pill parks in the top bar (never over content), draggable, collapses to a dot; off the Home tabs it is always a dot.
- Games run in rounds: `start_round(type)` RPC picks least-played cards, reads `round_size` and `daily_game_limit` from `app_settings`, and enforces the limit; round answers are readable only when both finished (`can_see_response`) and final once sent — so the UI never decides visibility or the limit.
- Reveal floods pick a contrasting colour via `src/lib/flood.ts` (`flood-auto` = ink on light, ember on dark) — same-colour floods were invisible.
- `/` is the public landing (signed-in users are sent to `/app`); `/demo` is a fully client-side demo (mock couple Linh & Minh, no backend calls); `/privacy`, `/terms`, `/contact` are draft legal pages. Test prices live in `src/config/pricing.ts`. Guest (anonymous) sign-in is removed and disabled in auth settings.
- Time capsules: recipient content comes through `list_capsules()`/`capsule_readable`, files through `capsule_file_readable`, and sealing/opening through RPCs; free seals serialize per sender before counting. Unlock notices run on app load.
- Thumb kisses (`/thumb`): live touch uses a per-pair realtime channel (broadcast for speed, presence for who is here); syncs logged only via `log_thumb_sync()` (one row per 5s), nudges via `send_thumb_nudge()` (1/min) — so clients cannot write rows directly.
- Explore categories: the pair's active_pack changes only via request_category/respond_category RPCs (a trigger blocks direct edits); today_question prefers the active pack and falls back to the full mix when it runs out — so neither partner can switch alone.
