# Nến Đôi production-readiness audit

Updated: 2026-10-10  
Scope: repository source and migration review through GitHub. This is not a live penetration test and does not prove the deployed Supabase project matches the checked-in migrations.

## Changes made on `codex/production-ux-pass`

- CI now uses the existing Bun lockfile (`bun install --frozen-lockfile`) instead of `npm ci`, which had no matching `package-lock.json`.
- The quality workflow lints changed TypeScript files and runs the production build. The repository currently has a substantial pre-existing Prettier backlog, so whole-repository lint was not a usable release gate.
- PWA `start_url` changed from `/styleguide` to `/` so an installed app opens the product entry point, not the component showcase.
- Authentication submit and OAuth handlers now catch thrown errors and always clear the busy state.
- `fetchMe()` now checks Supabase errors and scopes membership/partner queries to the signed-in user's couple rather than selecting every membership row and choosing any non-self row.
- Avatar signed-URL failures are handled without an unhandled rejected promise.
- `.gitignore` now ignores future local `.env` files. The existing `.env` is already tracked, so it remains tracked until environment values are moved into deployment configuration and the file is explicitly removed from version control.

## Findings / risks

### Fixed in this branch

1. **CI package-manager mismatch** — the original workflow used `npm ci`, but the repository has `bun.lock` and no `package-lock.json`.
2. **Incorrect PWA entry point** — installed app opened `/styleguide`.
3. **Authentication loading-state failure path** — rejected auth calls could bypass `setBusy(false)`.
4. **User context query robustness** — profile/membership/couple/streak query errors were silently ignored; partner lookup was not explicitly scoped to the current couple.

### Requires verification before go-live

1. **Database and storage policies:** reviewed migration definitions, but have not queried the live Supabase project's deployed policies or tested cross-couple access with two separate accounts. Do not treat source migrations alone as proof of live security.
2. **Security-definer RPCs:** functions such as `join_couple`, `create_space`, capsule operations, category changes and round/game functions need adversarial tests for authorization, replay, rate limits and unexpected IDs.
3. **Test mode and test data:** follow `TEST_MODE_REMOVAL.md` and `LAUNCH_CHECKLIST.md`; confirm backend test endpoints return 403 in production, remove test accounts/data and inspect storage for leftover test files.
4. **Guest sign-in:** launch checklist identifies recoverability and abuse concerns. Remove it or implement appropriate anti-abuse controls before public launch.
5. **Email/OAuth configuration:** test confirmation and password sign-in emails, Google/Apple OAuth callback URLs, and delivery limits in the actual production project.
6. **Environment configuration:** migrate tracked `.env` values to deployment variables/secrets, add a value-free `.env.example`, and confirm production build/deployment receives the required Supabase URL and publishable key. No service-role key was found among the tracked `.env` variable names inspected.
7. **Automated tests:** repository has no dedicated test script. Add repeatable tests for sign-up/sign-in, onboarding, invite joining, couple isolation, daily answer/photo/game flows, and capsule authorization.
8. **Release environment:** production domain, HTTPS, SPA/SSR routing, monitoring/error reporting, backups/restore, privacy/terms copy and account deletion still need verification against the actual deployment.

## Release decision

**Not yet certified production-ready.** Merge only after CI is green and the live-project checks above are completed. Do not apply speculative database changes directly to production; add reviewed, reversible migrations and test them against a staging project first.
