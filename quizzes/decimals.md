# Place Value & Rounding

Find decimal places from millions to thousandths and round with confidence. This
is a timed overall challenge: the whole session shares one countdown.

## How to adjust difficulty

- `places` lists which place-value names can be asked about (and also serves as
  the pool of wrong answers). Trim the list to focus on fewer places.
- `rounding` controls how many rounding questions of each kind appear. The keys
  are `whole` (nearest whole number), `tenth`, and `hundredth`.
- `overallTimeLimit` is the total seconds for the whole session. `maxProblems`
  sets how many questions are drawn from the deck.
- The deck preserves the configured mix and regenerates any exact question
  collision, so a session does not repeat a prompt.

```json
{
  "id": "decimals",
  "title": "Place Value & Rounding",
  "icon": "🔢",
  "description": "Find decimal places from millions to thousandths and round with confidence.",
  "meta": "20 questions · 3-minute challenge",
  "generator": "decimals",
  "inputType": "choice",
  "maxProblems": 20,
  "timeLimit": null,
  "overallTimeLimit": 180,
  "places": [
    "Millions", "Hundred-Thousands", "Ten-Thousands", "Thousands",
    "Hundreds", "Tens", "Ones", "Tenths", "Hundredths", "Thousandths"
  ],
  "rounding": { "whole": 4, "tenth": 3, "hundredth": 3 },
  "correctFeedback": [
    "Super! You found the right place. 🔢",
    "Exactly right—beautiful number sense! 🎯",
    "Nice rounding! That number landed perfectly. ⭐"
  ]
}
```
