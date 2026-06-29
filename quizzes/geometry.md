# Geometry Lab

Explore shapes, line segments, rays, lines, and angles. This is a timed overall
challenge: the whole session shares one countdown.

## How to adjust difficulty / content

This module is a fixed pool of multiple-choice questions listed under
`questions` in the `config` block. To change the quiz, edit that list:

- Each question needs a `question`, a list of `choices`, and the `correct`
  answer (which must match one of the choices exactly).
- Add `"type": "shape"` to render the answer choices as drawn shapes. Valid shape
  choices are `Triangle`, `Square`, `Pentagon`, and `Hexagon`.
- Add `"diagram": "GEO_DIAGRAM_1"` or `"GEO_DIAGRAM_2"` to show a labeled figure
  above the choices. These diagrams are defined in `script.js`.
- `maxProblems` controls how many questions are drawn (shuffled) per session;
  keep it at or below the number of questions listed. `overallTimeLimit` is the
  total seconds for the session.

```json
{
  "id": "geometry",
  "title": "Geometry Lab",
  "icon": "📐",
  "description": "Explore shapes, line segments, rays, lines, and angles.",
  "meta": "10 questions · 3-minute challenge",
  "generator": "list",
  "inputType": "choice",
  "maxProblems": 10,
  "timeLimit": null,
  "overallTimeLimit": 180,
  "correctFeedback": [
    "Super! Your geometry vision is sharp. 📐",
    "Exactly! You saw the shape of the idea. ✨",
    "Great work—geometry power unlocked! 🟢"
  ],
  "questions": [
    { "type": "shape", "question": "Which shape below has exactly 5 line segments?", "choices": ["Triangle", "Square", "Pentagon", "Hexagon"], "correct": "Pentagon" },
    { "type": "shape", "question": "Which shape below has exactly 4 line segments?", "choices": ["Triangle", "Square", "Pentagon", "Hexagon"], "correct": "Square" },
    { "question": "Which of the following statements is true?", "choices": ["A line segment has no endpoints.", "A line has 2 endpoints.", "A ray has one endpoint.", "A line segment has one endpoint."], "correct": "A ray has one endpoint." },
    { "question": "Which of the following statements is true?", "choices": ["A line extends in only one direction.", "A ray has two endpoints.", "A line segment has exactly two endpoints.", "A point has length and width."], "correct": "A line segment has exactly two endpoints." },
    { "question": "Challenge: Which of the following statements is true?", "choices": ["The capital letter V contains two angles.", "The capital letter W contains two angles.", "The capital letter V contains one angle.", "The capital letter I contains one angle."], "correct": "The capital letter V contains one angle." },
    { "question": "Challenge: Which of the following statements is true?", "choices": ["The capital letter W contains one angle.", "The capital letter V contains three angles.", "The capital letter Z contains three angles.", "The capital letter W contains three angles."], "correct": "The capital letter W contains three angles." },
    { "question": "Use the diagram to answer: which of the following is a ray?", "diagram": "GEO_DIAGRAM_1", "choices": ["Ray BF", "Ray B", "Ray DE", "Ray DCB"], "correct": "Ray BF" },
    { "question": "Use the diagram to answer: which of the following is a line segment?", "diagram": "GEO_DIAGRAM_1", "choices": ["Line segment FB", "Line segment AF", "Line segment AC", "Line segment DE"], "correct": "Line segment AC" },
    { "question": "Use the diagram to answer: which of the following is a ray?", "diagram": "GEO_DIAGRAM_2", "choices": ["Ray PQ", "Ray RS", "Ray TV", "Ray QP"], "correct": "Ray PQ" },
    { "question": "Use the diagram to answer: which of the following is a line segment?", "diagram": "GEO_DIAGRAM_2", "choices": ["Line segment PQ", "Line segment RS", "Line segment TV", "Line segment RV"], "correct": "Line segment TV" }
  ]
}
```
