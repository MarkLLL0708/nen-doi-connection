# Removing test mode before launch

Test mode lets one person act as "Thử A" and "Thử B" on one phone. Delete all of this before launch:

1. **The pill**: `src/components/app/TestPill.tsx` and its line in `src/routes/__root.tsx`.
2. **Client helpers**: `src/lib/testmode.ts`, `src/i18n/test.ts` (and the `test:` lines in `src/i18n/index.ts`).
3. **Test-only branches**: search the code for `testmode` — the sample-photo picker in `src/routes/_authenticated/photo.tsx` and the fake hour in `src/routes/_authenticated/app.tsx`.
4. **Sample images**: `src/assets/sample-1.jpg` … `sample-6.jpg`.
5. **Backend functions**: `src/lib/testmode.functions.ts` (testSignIn, testSetupCouple, testClearToday, testClearAll, testStatus).
6. **The secret**: delete `TEST_MODE` (or set it to anything other than `true` — every test function then returns 403).
7. **Test accounts and data**: press "Xóa toàn bộ dữ liệu thử" first, then delete the users `thu-a@nendoi-test.example.com` and `thu-b@nendoi-test.example.com`.
8. **Optional**: drop the `profiles.is_test_account` column and the `protect_test_flag` / `protect_test_flag_insert` triggers.

## How it is gated
- `TEST_MODE_ENABLED = import.meta.env.DEV`. The preview runs the development server (true); the published site is a production build where it is `false`, so the pill code is removed at build time.
- The backend functions check the `TEST_MODE` secret on every call and return 403 unless it equals `true`. The secret is shared by preview and the published site, so switch it off whenever you are not testing.
- Check the published site: no yellow "THỬ" pill or dot appears in the top bar.
- The pill remembers its spot and dot state in `nendoi.test.pillPos` / `nendoi.test.pillDot` (browser storage, harmless leftovers).
