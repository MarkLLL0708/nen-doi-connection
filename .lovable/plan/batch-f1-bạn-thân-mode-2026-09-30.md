# Batch F1: Bạn thân mode

## Step 0: what exists vs. what the brief assumes
Exists (will be upgraded, not duplicated): couples table, onboarding, pairing/invite, Home counter + streak, daily questions (packs), 4 games (Ai dễ, Chọn một, Đoán ý, Hỏi nhanh), date swipe ("Hẹn hò"), occasions, time capsules, coach templates, Settings, landing + demo, THỬ switcher.

Does NOT exist yet (from pending batches 2/3), so F1 will only prepare for them, not build them:
- The 10 named decks (Thời thơ ấu, Du lịch...) — questions currently use packs, no decks table
- Challenges, "Hôn ngón tay", "Thả thính" deck, "Nóng" level, long-distance mode, Nhập nhanh importer, Mình chưa bao giờ, Vẽ đấu, Đố vui, Thử thách

## Build
1. Database (additive only, no renames, no policy weakening)
   - `couples.kind` ('couple' | 'friends', default 'couple'), locked after creation by trigger.
   - `audience text[] default '{couple}'` on daily_questions, game_content, date_ideas, occasion_catalog.
   - `today_question()`, `start_round()` and date-idea reads filter by the space's kind.
   - `create_couple` gets a kind argument (old call keeps working as couple).
   - Capsule types and coach use cases filtered by kind in config (they are config, not tables).
2. Tagging: existing Ẩm thực questions and generic "Chọn một" items reviewed one by one; anything mentioning người yêu/love/dating/weddings stays couple-only. I will show you the excluded list. Everything else stays couple-only.
3. Onboarding: first question "Bạn dùng Nến Đôi cùng ai?"; friends path with address terms, stages, content styles, "Quen nhau từ", "Mời bạn thân" invite/share text.
4. Friends wording: Home "Đã là bạn của nhau X ngày", "Đi chơi" tab, "Hôm nay đi đâu?", friends occasions (Tết, Trung Thu, Giáng Sinh, birthdays, yearly ngày quen nhau), friends capsule types, coach tones/use cases, no romantic words in notifications and share cards.
5. Landing: "Người yêu | Bạn thân" switch + "Dành cho người yêu và bạn thân."; demo gets Linh & Trang.
6. Settings: space kind shown read-only; unpair note about starting a new space.
7. THỬ: "Tạo cặp thử" asks Người yêu / Bạn thân; "Xóa toàn bộ" clears either.

## Test
Both kinds with THỬ A/B: onboarding choices, content filtering (also direct database reads), romantic-word search of every friends screen, notifications and share cards, reveal rule in both kinds, couple space unchanged, Vietnamese clipping at phone width. Then stop and wait for "batch F2".

## Technical notes
- Friends labels live in i18n under a `friends` variant chosen by a `useSpaceKind()` helper; no hardcoded strings.
- Kind lock uses a BEFORE UPDATE trigger; filtering happens in the security-definer RPCs so the UI never decides what content is visible.
