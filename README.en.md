# Scout System — Cipher & Semaphore Toolkit 🧭

> Scout Association of Hong Kong · Shau Kei Wan District helper
> Cipher conversion, printable exam papers, digital papers, a buzz quiz and a game-based training engine.

This is a static web app supporting 13 ciphers / signalling methods, plus a Canvas training game,
**Cipher Defense**. The interface is available in **Traditional Chinese and English** — see
[Language switch](#language-switch). The full Chinese documentation is in [README.md](README.md).

## Modes

### 1. Cipher Tools

- Morse, semaphore, pigpen, braille, grid cipher and phone T9
- Caesar shift, Atbash, reverse and the NATO alphabet
- Live conversion, highlighted reference tables, copy-to-clipboard and Morse audio
- Unfinished message drafts are kept in the browser

### 2. Exam Paper

- Add any message from the tools to the question bank
- Per-question cipher type, whole-message / carousel / audio display
- Per-question settings: semaphore print style (stick figures / Baden-Powell figures), carousel
  speed and direction (decode / reverse)
- Reverse mode shows the plain English and asks the member to write the cipher symbols
- Projection playback and A4 printing. Chinese title: 童軍密碼考核試卷; English title:
  **Scout Cipher Examination**
- **Every printed page** carries `© 2026 Scout System · 版權所有 / All rights reserved` at the
  bottom. The leader's answer key adds `CONFIDENTIAL · 領袖專用 / Leaders Only`.
- Questions are stored in `localStorage`

### 3. Buzz Quiz

- A leader opens a PeerJS room and shows a QR code
- Members join on their phone and buzz with a button or by shaking the device
- Shows the buzz order and the number of connected players

> The buzz quiz needs a network connection for PeerJS, QR codes and peer-to-peer connections.

### 4. Cipher Defense

Open `/training/` to start the game-based trainer:

- Six ciphers: Morse, pigpen, braille, SCOUT grid, phone T9 and semaphore
- Three paths: Rookie Lesson (12 questions, multiple choice), Defend the Base (20 questions,
  full A–Z keyboard, limited shields) and Endless Challenge
- Distractors are visually / structurally similar letters rather than random ones
- A wrong answer shows the solution and must be answered correctly before moving on
- Adjustable speed, shields and timer; per-cipher accuracy, weak letters and training advice
- On-screen A–Z keyboard for phones, haptics, sound toggle and keyboard support
- **Game feel / mobile immersion**: devicePixelRatio-sharp canvas, auto-pause when switching apps,
  hit-stop on a correct answer, easing score counter, combo meter, incoming-threat warning,
  fullscreen + Screen Wake Lock, and a portrait hint
- A "Game feel" setting turns particles / shake / flashes off; it defaults to the OS
  `prefers-reduced-motion` preference
- **Daily mission (practice, not a challenge)**: 3 stages a day, **ONE cipher per stage**,
  3 questions each; no lives lost, no timer, one threat at a time, plus an always-available
  reference sheet. Date-seeded, +20 ★, day streak and best time — all local, no invented global leaderboard
- **Three-step "How to play"** coach marks on first visit, re-openable with "? How to play"
- **Decode reveal** after a correct answer: the cipher lights up element by element (`.- → A`)

See [`docs/game-feel-reference.md`](docs/game-feel-reference.md) and
[`docs/astra-lab-reference.md`](docs/astra-lab-reference.md) for the reference reviews, and
[`CREDITS.md`](CREDITS.md) for assets and sources.

## Language switch

- Every page (main app, `/papers/`, `/training/`) has a **🌐 EN / 🌐 繁** button in the top-right;
  the main app also has one at the bottom of the sidebar.
- Switching translates all UI text, document titles, placeholders, `aria-label`s, projection
  overlays, exam-paper instructions, decoder sheets and answer keys — including content generated
  later by JavaScript (a `MutationObserver` watches the DOM).
- The choice is stored in `localStorage` under `skw_ui_lang` and survives navigation and reloads.
  Append `?lang=en` to a URL to share a link that opens directly in English.
- All translations live in [`js/i18n.js`](js/i18n.js). Add a new Traditional Chinese string to the
  `EN` map; use `PATTERNS` for sentences containing question numbers or counts.
- User-authored content (set names, answers, message drafts) is marked `data-i18n-skip` and is
  never rewritten.

## Local development

```bash
npm install
npm run dev
```

Vite opens the main app; the trainer is at `http://localhost:5173/training/`, digital papers at
`http://localhost:5173/papers/`.

## Checks and build

```bash
npm test        # leader verification, question sets, Worker simulation, UI and i18n (Node 22)
npm run check   # required HTML elements, duplicate IDs, JavaScript syntax
npm run lint    # same static integrity check
npm run build   # multi-page build: main app + training + papers
```

The production build copies the shared flag images and `/js/i18n.js` into `dist/`.

## Project structure

```text
├── index.html              # Main app
├── css/style.css           # Main app, responsive and print styles
├── js/app.js               # Encoding, exam paper, projection, buzzer
├── js/i18n.js              # zh-Hant / English dictionary and runtime switcher
├── papers/                 # Digital papers (leader + member)
├── training/index.html     # Cipher Defense (Canvas game)
├── images/                 # Semaphore images (a.png – z.png)
├── scripts/check-static.mjs
├── vite.config.ts          # Multi-page build
└── vercel.json
```

## Browser data

All of the following stay in the member's own browser:

- `skw_ui_lang`: interface language (`zh-Hant` / `en`)
- `skw_message_draft`: message draft
- `skw_test_questions`: exam questions (cipher type, direction, speed, semaphore style, …)
- `skw_cipher_training_settings`: game settings
- `skw_cipher_training_progress`: scores, milestones, weekly / monthly ranking, history
- `skw_cipher_training_achievements`: perfectionist badges (6 ciphers × 3 paths)

Clearing site data removes all of the above.

## Licence

This project keeps the original MIT licence notice: free to use, modify and distribute.
The printed papers and on-screen footers carry the `© 2026 Scout System · All rights reserved`
notice.

## Digital papers and leader mode

Open `/papers/` (or choose 電子試卷 from the main page): a leader can sign in, create up to 50
question sets (30 questions each), import from the existing exam paper, download a private backup,
and share fixed question / answer QR codes or JSON. Online activities support manual syncing and
answer publication.

Members scan a code, paste a link or import a file, answer on their phone and download a
submission file for manual marking — scores are never uploaded or graded automatically.
Semaphore and pigpen symbols can be displayed as images; reverse questions need a text
description, as handwritten / image answers are not supported. The grid cipher is fixed to SCOUT
and Caesar to a shift of 3; carousel, audio and projection settings are not imported.

**Online activities are read only when the member presses "Refresh questions & answers" — there is
no automatic polling.** Local data and private backups contain answers and the activity management
key; keep them safe. Leader sign-in lasts up to 24 hours and must be repeated after a reload.
Changing the password cannot recall downloaded content, and cipher questions can be decoded by
anyone, so this feature is not suitable for secrets or strict anti-cheating.

Full administrator steps, cost / privacy notes and an acceptance checklist are in the
[Cloudflare digital paper setup guide](docs/cloudflare-paper-setup.md) (in Chinese).
