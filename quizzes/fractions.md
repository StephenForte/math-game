# Fraction Equivalence Lab

Compare shaded bars and number lines to see why fractions are equal. This module
is intentionally untimed so the learner can reason from the visual model.

## How to adjust difficulty

- `seeds` is the list of starting fractions (`[numerator, denominator]`). Add or
  remove pairs to focus on particular fractions.
- `maxDenominator` caps how large an equivalent fraction can get. Raise it for
  harder comparisons, lower it for gentler ones.
- `maxProblems` sets how many questions a session has.

```json
{
  "id": "fractions",
  "title": "Fraction Equivalence Lab",
  "icon": "🟰",
  "description": "Compare shaded bars and number lines to see why fractions are equal.",
  "meta": "8 visual questions · untimed",
  "generator": "fractions",
  "inputType": "choice",
  "maxProblems": 8,
  "timeLimit": null,
  "maxDenominator": 12,
  "seeds": [
    [1, 2], [1, 3], [2, 3], [1, 4],
    [3, 4], [2, 5], [3, 5], [4, 5]
  ],
  "correctFeedback": [
    "Super! Those fractions show the same amount. 🌟",
    "Exactly! Different pieces, equal amount. 🎯",
    "Wonderful! You saw the equivalence. ✨"
  ]
}
```
