# Fluency Sprint

Build automatic recall with mixed multiplication and exact division. Edit the
`config` block below to change the quiz — no rebuild required.

## How to adjust difficulty

- `operations` controls which fact types appear. Use any of `"multiply"`,
  `"divide"`, `"add"`, `"subtract"`. Division problems are always built from a
  product, so they never have remainders.
- `factorA` / `factorB` set the size of the numbers (for division they become the
  two factors whose product is divided).
- `timeLimit` is the seconds allowed per question — lower it for a faster sprint.

```json
{
  "id": "fluency",
  "title": "Fluency Sprint",
  "icon": "⚡",
  "description": "Build automatic recall with mixed multiplication and exact division.",
  "meta": "12 questions · 15-second pace",
  "generator": "arithmetic",
  "inputType": "number",
  "maxProblems": 12,
  "timeLimit": 15,
  "operations": ["multiply", "divide"],
  "factorA": { "min": 2, "max": 12 },
  "factorB": { "min": 2, "max": 12 },
  "correctFeedback": [
    "Super! That fact came back fast. ⚡",
    "Boom! Instant recall. 🚀",
    "Excellent! Your math brain is flying. 🌟"
  ]
}
```
