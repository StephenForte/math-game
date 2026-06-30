# Times Table Practice (Rising 5th Grade)

Multi-digit multiplication to get ready for 5th grade. Edit the values in the
`config` block below to change the quiz — no rebuild required, just save and
reload the page.

## How to adjust difficulty

The two numbers in each problem are drawn from `factorA` and `factorB`. Each has
a `min` and `max`.

- **Easier:** lower the `max` values (for example `factorA.max: 12` and
  `factorB.max: 9` gives single/low-double-digit facts).
- **Harder:** raise the `max` values (for example set `factorB` to
  `{ "min": 11, "max": 99 }` for full 2-digit × 2-digit problems).
- **Pace:** raise or lower `timeLimit` (seconds allowed per question), or change
  how many questions a session has with `maxProblems`.

The current defaults give 2-digit × 1-to-2-digit multiplication, which is a solid
rising-5th-grade level.

```json
{
  "id": "multiplication",
  "title": "Times Table Practice",
  "icon": "✖️",
  "description": "Multi-digit multiplication to get ready for 5th grade.",
  "meta": "10 questions · multi-digit",
  "generator": "arithmetic",
  "inputType": "number",
  "maxProblems": 10,
  "timeLimit": 60,
  "operations": ["multiply"],
  "factorA": { "min": 8, "max": 99 },
  "factorB": { "min": 2, "max": 12 },
  "correctFeedback": [
    "Super! You nailed it. 🎉",
    "Fantastic! That fact is getting strong. 💪",
    "Yes! Beautiful multiplication. ⭐",
    "The Force is strong with you. 🌌"
  ]
}
```
