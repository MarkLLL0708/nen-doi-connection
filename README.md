# Nến Đôi Moments

Start a new project: a mobile-first web app (PWA) for Vietnamese couples called "Nến Đôi" (placeholder name, keep it in one config constant). It is a daily-connection app where two partners spend a few minutes a day on questions, games and photos and keep a shared streak. In THIS step, build ONLY the visual foundation. No backend, no real features yet.

STANDING RULES FOR THE WHOLE PROJECT
- The product is Vietnamese-first, with English as a second language via react-i18next (default vi). No hardcoded strings in components. All copy is natural, warm, young Vietnamese, never machine-translated.
- Never claim something works unless you actually tested it. At the end of every step, list clearly: what you tested and it passed, what failed, and what you did not test.
- Do not change existing database, security policies or content unless something is broken, and tell me if you do.
- Build only what the current prompt asks for. Do not add extra features. Ask if unsure.

DESIGN DIRECTION
The look must feel like a soft, playful, premium consumer app for Gen Z couples, in the mood of the Candle couples app: friendly, warm, tactile, full-screen, mascot-led. It must NOT look like a dashboard, a corporate template, a PowerPoint slide, or default shadcn.
1. One thing per screen. Big, simple, full-screen moments with one primary button.
2. Big confident typography: headlines 28–40px bold, body 16–18px. Use a rounded, friendly font with full Vietnamese diacritics support (Nunito or Be Vietnam Pro at heavy weights). Test all Vietnamese tone marks render correctly.
3. Lots of space: 24px screen padding, 20–32px between blocks, radii of 24–32px. No visible borders, no table-like layouts, no tiny grey text. Separate things with soft shadows, colour and space.
4. Colour as mood: base palette cream #FFF8F1, ember orange #E8590C, soft rose #F4A6A0, charcoal #2B2320, plus dark mode. Each content category gets its own soft gradient (Kỷ niệm: pink to peach, Ẩm thực: orange to yellow, Tết: red to gold, Yêu xa: blue to lilac, Sâu lắng: plum to rose, Vui vẻ: mint to sky). Keep text contrast accessible.
5. Personality: an original flame mascot (SVG, drawn by you) with 8 expressions: vui, yêu, dỗi, đói, nhớ, ngủ, mừng, buồn. Use friendly, glossy emoji-style icons instead of generic line icons.
6. Motion: spring animations on every tap, swipe cards with physics, confetti component, soft pulse on the flame, slide/scale page transitions. Respect reduced motion.
7. Sticker feel: pill buttons, sticker-style labels, small hand-drawn accents (hearts, sparkles), slightly rotated decorative elements. Tasteful, not childish.

BUILD NOW
- A single theme file with design tokens (colours, gradients, radii, shadows, spacing, type scale, motion).
- Reusable components: PrimaryButton (52px tall, pill), SecondaryButton, PillTag, BigCard, GradientScreen (full-screen with a chosen gradient), BottomSheet, AvatarPair (two overlapping avatars with a done/waiting state), FlameStreak (animated, with sizes), EmptyState (mascot plus a Vietnamese line), Confetti, SwipeCard.
- The mascot component with the 8 expressions.
- A floating rounded bottom tab bar with 5 tabs: Trang chủ, Chơi, Hẹn hò, Kỷ niệm, Cài đặt (each with a glossy emoji-style icon).
- A /styleguide page that shows every component, colour, gradient, type size and mascot expression on a 390px-wide screen so I can approve the look.
- On desktop, show the app inside a centered phone-width container with a soft background.

Stop after this. Do not build features. Wait for my feedback on the styleguide.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nen-doi-connection.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/302fb2ea-c3b6-4079-8e41-dab18b3fa418).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
