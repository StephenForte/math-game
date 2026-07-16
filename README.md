# 🧮 Math Practice Lab

A friendly, browser-based collection of short math quizzes. Every quiz is defined by a Markdown file in the `quizzes/` folder, so you can change difficulty, timing, and even add new quizzes without touching the JavaScript. The app currently includes these practice modules:

1. **Times Table Practice** — multi-digit multiplication at a rising 5th-grade level (2-digit × 1-to-2-digit by default), with adjustable difficulty.
2. **Fluency Sprint** — twelve mixed multiplication and exact-division facts using factors 2–12, with a focused 15-second pace.
3. **Fraction Equivalence Lab** — eight untimed questions that use fraction bars and number lines to make equivalent amounts visible.
4. **Simplify Fractions Sprint** — twenty worksheet-based problems with an untimed baseline round followed by a personalized 5–7 minute goal.
5. **Place Value & Rounding** — the legacy twenty-question challenge covering place values from millions through thousandths plus rounding to whole numbers, tenths, and hundredths.
6. **Geometry Lab** — the legacy ten-question challenge covering polygons, lines, rays, line segments, and angles in capital letters.

## How to run

Quizzes are loaded from the `quizzes/` folder at runtime, so the app needs to be
served over `http://` (not opened as a `file://` path, which browsers block).

Run the local dev server from the project folder:

```sh
python3 serve.py
```

Then visit `http://localhost:8000`. This server also powers the quiz admin console at `http://localhost:8000/admin.html`, where you can edit the Markdown quiz files in `quizzes/`.

For a plain static server without admin save support, `python3 -m http.server 8000` also works. GitHub Pages and other static hosts work for the game itself (not the admin editor). No build step is required.

## How to play

1. Enter the learner's name.
2. Choose a practice module.
3. Answer each question and use the immediate feedback to adjust.
4. Pause or finish a session at any time.
5. Review the final score, accuracy, and timing summary.

## Design notes

- Timed questions advance cleanly when time expires and count as attempts.
- The two legacy modules preserve their shared three-minute overall timer; the earlier modules retain their per-question or untimed pacing.
- A cheerful poop mascot gains stars at question 2, hearts at question 8, and transforms into a brain at completion. This is serious pedagogy.
- Finishing a quiz triggers a fireworks celebration.
- The finish screen reviews every answered question, including the correct answer and any incorrect choice or timeout.
- The fraction module is intentionally untimed so the learner can reason from the visual model.
- Fraction choices show both the written fraction and a shaded bar, reinforcing amount rather than a memorized numerator/denominator rule.
- Quizzes are data-driven: each one is a Markdown file in `quizzes/` with an embedded `json` config block, loaded at runtime. The shared engine in `script.js` only provides a few generic generators (`arithmetic`, `fractions`, `decimals`, `list`) that the Markdown files select and parameterize.
- Keyboard input, visible focus states, reduced-motion support, and responsive layouts are included.
- The opening screen uses a colorful, preteen-friendly “math mission” theme without changing the focused quiz interface.
- Times Table Practice now uses multi-digit factors (rising 5th-grade level); its difficulty is set entirely by the factor ranges in `quizzes/multiplication.md`.

## Quiz admin console

Open `http://localhost:8000/admin.html` while `serve.py` is running. It lists every quiz Markdown file, lets you edit the full file (including the JSON config block), and saves changes back to disk. Reload the game after saving to pick up new difficulty or timing settings.

The admin console only works with `serve.py` on your machine — it cannot write files on GitHub Pages or other read-only static hosts.

## Editing or adding quizzes (Markdown-driven)

Each quiz lives in its own Markdown file in `quizzes/`. The human-readable prose
explains the quiz, and a fenced ` ```json ` config block holds the tunable rules.
Edit a value, save, and reload the page — there is nothing to recompile.

`quizzes/manifest.md` controls which quizzes appear and in what order. To add a
quiz, create a new `.md` file and list its filename there; to remove one, delete
its line.

Common fields in a quiz config block:

- `title`, `icon`, `description`, `meta` — how the quiz appears on the menu card.
- `maxProblems` — questions per session.
- `timeLimit` — seconds per question (use `null` for untimed), or
  `overallTimeLimit` for a single timer covering the whole session.
- `generator` — which built-in engine runs the quiz:
  - `arithmetic` — `operations` (`multiply`, `divide`, `add`, `subtract`) plus
    `factorA` / `factorB` ranges (`{ "min": …, "max": … }`). Division is always
    built from a product, so answers stay whole.
  - `fractions` — `seeds` (starting fractions) and `maxDenominator`.
  - `simplifyFractions` — a worksheet-style `problems` pool of proper fractions,
    optionally mixed with generated reducible fractions using
    `generatedProblemChance` and the `generated...` difficulty limits.
  - `decimals` — `places` to ask about and a `rounding` mix.
  - `list` — a fixed `questions` array of multiple-choice items.
- `correctFeedback` — the encouraging messages shown on a correct answer.
- `timingMode: "baseline-then-goal"` — times the first completed round, then
  creates a personalized countdown constrained by `goalMinSeconds` and
  `goalMaxSeconds`.

For example, to make **Times Table Practice** harder, open
`quizzes/multiplication.md` and raise the factor ranges (e.g. set `factorB` to
`{ "min": 11, "max": 99 }` for full 2-digit × 2-digit problems); to make it
easier, lower the `max` values.

## Google Sheets result logging

Every completed or early-finished session is queued in the browser and sent to Google Sheets when an endpoint is configured. If the network is unavailable, up to 25 results remain queued and are retried on a later visit.

For compatibility with existing Apps Script deployments, the learner's name is sent as `playerName` and through the legacy aliases `name`, `player`, and `studentName`.

1. Open the target Google Sheet and choose **Extensions → Apps Script**.
2. Paste in `google-apps-script.gs` and deploy it as a web app that executes as you and is accessible to anyone using the game.
3. Paste the deployment URL into `googleSheetsEndpoint` in `config.js`.

The repository did not contain the previous endpoint or logging schema, so `config.js` intentionally leaves the deployment URL blank rather than guessing it.

## Tests

Python tests cover the local admin API in `serve.py` (path safety, config validation, and HTTP handlers). JavaScript tests cover shared quiz-engine helpers in `script.js` (parsing, shuffling, arithmetic decks, rounding, fractions).

```sh
# Python (serve.py)
pip3 install -r requirements-dev.txt
python3 -m pytest test_serve.py -v

# JavaScript (script.js helpers)
npm install
npm test

# Both
npm run test:all
```

## Project files

- `index.html` — module picker, shared quiz interface, and results screen
- `quizzes/` — one Markdown file per quiz plus `manifest.md` (the quiz definitions)
- `script.js` — shared quiz engine, generic generators, and the Markdown loader
- `config.js` — Google Sheets endpoint configuration
- `google-apps-script.gs` — Sheet-bound result logger for Apps Script
- `styles.css` — responsive styling and visual math models
- `test_serve.py` / `script.test.js` — automated tests for the server and engine helpers
- `README.md` — project overview and usage
