# Launch checklist (do these in order — nothing here has been changed yet)

1. **Turn test mode off.** Set the `TEST_MODE` secret to anything other than `true` (or delete it). Then verify:
   - calling any backend test function (`testSignIn`, `testStatus`, `testSetupCouple`, `testClearToday`, `testClearAll`) returns **403**;
   - the published build shows **no THỬ pill** on any page (it is compiled only into the preview/dev build via `import.meta.env.DEV`).
   Then follow `TEST_MODE_REMOVAL.md` to delete the test code itself.

2. **Remove or protect "Dùng thử ngay".** It creates a real guest account that can pair and write real data.
   - Option A: remove the button and turn off guest sign-in.
   - Option B: keep it behind a captcha plus a rate limit per device/IP.
   - **Recommendation: remove it.** Guest accounts can't be recovered (clearing the browser loses the couple's history), bots can create unlimited accounts, and a couples app has little reason to be anonymous. If a no-signup preview is wanted, show a read-only sample instead.

3. **Connect a proper email provider** for confirmation and magic-link emails (custom sending domain). Check the provider's daily/hourly sending limits against expected sign-ups, and test delivery to Gmail, Outlook and Yahoo.

4. **Review the signed-in-only functions flagged by the security check** (security-definer helpers such as `today_question`, `today_status`, `start_round`, `round_status`, `swipe_date`, `join_couple`, `refresh_invite`, `create_couple`, `has_answered`, `has_posted`, `has_responded`, `round_completed`, `can_see_response`). Confirm each one only acts on the caller's own couple, and revoke any that are no longer used.

5. **Update the saved project instructions** in Settings so they describe the real app (screens, Colour Block, reveal rule, rounds and daily limit) rather than the old style guide.

6. **Review all invented copy** and replace with approved wording: tone examples, privacy line, occasion notes, milestone lines, the six avatar shapes, the verdict lines for every game, and the empty/waiting messages.

7. **Delete the two test accounts and all test data** (`thu-a@nendoi-test.example.com`, `thu-b@nendoi-test.example.com`, their couple and everything under it, including photos in storage), and the optional `is_test_account` column.
