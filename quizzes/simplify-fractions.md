# Simplify Fractions Sprint

Simplify proper fractions to their lowest terms. The problem pool is taken from
the supplied **Simplifying Proper Fractions (A), (B), and (C)** worksheets.
Each session draws 20 unique problems - half of one worksheet page - with a
small number of equivalent, JavaScript-generated examples mixed in.

## Teacher timing plan

The first completed session is a **baseline round**: the clock counts up while
the learner completes 20 problems. Afterward, the app saves that result in the
browser and creates a practice goal rounded to the nearest 30 seconds, with a
minimum of 5 minutes and a maximum of 7 minutes.

Later sessions count down from that personalized goal. To run a fresh baseline,
clear this site's browser storage entry named
`math-practice-baseline-simplify-fractions`.

## How to adjust the quiz

- `maxProblems` should remain 20 to represent half of the 40-problem page.
- `goalMinSeconds` and `goalMaxSeconds` define the teacher's 5-7 minute window.
- `goalRoundingSeconds` controls how precisely the baseline becomes a goal.
- `problems` contains all 120 worksheet examples, written as
  `numerator/denominator`. Exact duplicates are shown only once per session.
- `generatedProblemChance` controls the share of newly generated examples.
- The `generated...` limits keep new examples at the worksheets' easy level.

```json
{
  "id": "simplify-fractions",
  "title": "Simplify Fractions Sprint",
  "icon": "➗",
  "description": "Reduce proper fractions to lowest terms using three easy worksheet sets and fresh examples.",
  "meta": "20 problems · baseline, then 5–7 min",
  "generator": "simplifyFractions",
  "inputType": "fraction",
  "maxProblems": 20,
  "timeLimit": null,
  "timingMode": "baseline-then-goal",
  "baselineStorageKey": "math-practice-baseline-simplify-fractions",
  "goalMinSeconds": 300,
  "goalMaxSeconds": 420,
  "goalRoundingSeconds": 30,
  "generatedProblemChance": 0.25,
  "generatedMaxDenominator": 120,
  "generatedMaxSimpleDenominator": 12,
  "generatedMinMultiplier": 2,
  "generatedMaxMultiplier": 10,
  "problems": [
    "7/14", "4/20", "14/21", "12/21", "12/18",
    "5/50", "30/72", "4/40", "12/30", "30/55",
    "24/33", "24/40", "40/110", "36/40", "2/18",
    "10/120", "8/96", "50/60", "10/45", "8/64",
    "9/27", "7/56", "45/54", "30/55", "20/35",
    "30/36", "10/24", "10/20", "35/56", "4/8",
    "8/56", "27/99", "4/12", "3/6", "9/54",
    "9/18", "3/24", "6/16", "24/42", "15/21",

    "2/4", "14/21", "10/100", "6/8", "6/30",
    "33/36", "6/24", "21/28", "9/18", "6/27",
    "30/70", "28/44", "110/120", "3/15", "72/80",
    "35/50", "24/32", "2/4", "50/80", "5/60",
    "45/63", "20/24", "50/60", "64/72", "10/30",
    "2/14", "16/24", "6/9", "90/100", "5/10",
    "8/24", "10/90", "30/48", "5/60", "9/54",
    "24/32", "2/4", "42/54", "3/24", "12/27",

    "42/60", "18/21", "3/9", "20/35", "4/6",
    "35/50", "2/8", "9/36", "8/88", "27/72",
    "10/12", "12/30", "27/45", "8/80", "40/44",
    "63/72", "9/27", "35/42", "6/9", "30/36",
    "2/12", "48/54", "54/63", "10/24", "6/30",
    "8/96", "21/27", "21/28", "18/60", "21/24",
    "3/18", "8/12", "9/36", "30/100", "32/56",
    "3/12", "9/27", "15/20", "10/20", "49/56"
  ],
  "correctFeedback": [
    "Super! That fraction is in lowest terms. 🌟",
    "Exactly right - beautifully simplified! 🎯",
    "Nice reducing! Your fraction skills are growing. 💪"
  ]
}
```
