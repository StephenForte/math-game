# 🧮 Math Practice Lab

A friendly, browser-based collection of short math quizzes. The app currently includes three practice modules:

1. **Times Table Practice** — ten multiplication questions using the 2–12 facts, with 30 seconds per question.
2. **Fluency Sprint** — twelve mixed multiplication and exact-division facts using factors 2–12, with a focused 15-second pace.
3. **Fraction Equivalence Lab** — eight untimed questions that use fraction bars and number lines to make equivalent amounts visible.
4. **Place Value & Rounding** — the legacy twenty-question challenge covering place values from millions through thousandths plus rounding to whole numbers, tenths, and hundredths.
5. **Geometry Lab** — the legacy ten-question challenge covering polygons, lines, rays, line segments, and angles in capital letters.

## How to run

Open `index.html` in a modern browser. No installation or build step is required.

For a local server, run:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

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
- Quiz metadata and problem generators live in the `QUIZ_MODULES` configuration at the top of `script.js`. This is the first step toward loading plug-and-play module definitions from Markdown later.
- Keyboard input, visible focus states, reduced-motion support, and responsive layouts are included.
- The opening screen uses a colorful, preteen-friendly “math mission” theme without changing the focused quiz interface.
- Times Table Practice uses factors 2–12 while limiting factors 10 and 11 to one appearance each per session.

## Google Sheets result logging

Every completed or early-finished session is queued in the browser and sent to Google Sheets when an endpoint is configured. If the network is unavailable, up to 25 results remain queued and are retried on a later visit.

For compatibility with existing Apps Script deployments, the learner's name is sent as `playerName` and through the legacy aliases `name`, `player`, and `studentName`.

1. Open the target Google Sheet and choose **Extensions → Apps Script**.
2. Paste in `google-apps-script.gs` and deploy it as a web app that executes as you and is accessible to anyone using the game.
3. Paste the deployment URL into `googleSheetsEndpoint` in `config.js`.

The repository did not contain the previous endpoint or logging schema, so `config.js` intentionally leaves the deployment URL blank rather than guessing it.

## Project files

- `index.html` — module picker, shared quiz interface, and results screen
- `script.js` — shared quiz engine and module-specific problem generators
- `config.js` — Google Sheets endpoint configuration
- `google-apps-script.gs` — Sheet-bound result logger for Apps Script
- `styles.css` — responsive styling and visual math models
- `README.md` — project overview and usage
