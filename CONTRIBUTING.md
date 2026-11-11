# Contributing to AWS Certification Practice Hub

Thank you for helping make this free AWS learning resource more accurate and useful. Contributions from learners, AWS practitioners, educators, and developers are welcome.

## What you can contribute

- Add well-written practice questions for supported exams.
- Add support for another AWS certification exam.
- Improve study guides, explanations, service references, or learning-roadmap content.
- Correct inaccurate, outdated, ambiguous, or misleading information.
- Fix bugs, broken links, accessibility issues, or usability problems.
- Improve tests, scripts, documentation, or developer experience.

## Content and accuracy standards

Accuracy matters more than quantity. Before contributing exam or learning content:

1. Verify technical claims against current AWS documentation and other authoritative sources.
2. Prefer original questions written for this project. Do not copy real AWS exam questions, memorized exam dumps, or copyrighted material.
3. Include a clear explanation for every answer, especially when distractors represent common AWS misconceptions.
4. Use the official AWS service and certification names consistently.
5. Flag information that may change over time, such as service features, limits, pricing, or exam objectives.
6. Do not include credentials, private information, restricted content, or unverifiable claims.

For corrections, explain what is wrong, why it is wrong, and provide a reliable source or suggested replacement where possible.

## Local development

### Prerequisites

- Node.js 20 or later
- npm

### Setup

```bash
git clone https://github.com/gazimaksudur2/aws-certification-prep.git
cd aws-certification-prep
npm install
npm run dev
```

### Validate changes

Run the production build before opening a pull request:

```bash
npm run build
```

The build generates learning data, type-checks the application, and creates the Vite production bundle.

## Adding or updating questions

Question banks are stored in [`src/data/exams/`](src/data/exams/). Follow the existing JSON envelope and field names:

```json
{
  "id": 1,
  "question": "Question stem text?",
  "options": [
    { "id": "A", "text": "Option A" },
    { "id": "B", "text": "Option B" }
  ],
  "correctAnswers": ["A"],
  "isMultiple": false,
  "topic": "Cloud Concepts"
}
```

When adding or changing a question:

- Keep IDs unique within the exam bank.
- Ensure `correctAnswers` contains only option IDs that exist in `options`.
- Set `isMultiple` consistently with the number of correct answers.
- Use an existing topic where appropriate.
- Review the question in the Question Bank and Guided Practice views.
- Update generated or source data using the existing npm script when the bank is script-generated.

For a new exam, follow the [Adding a new exam](README.md#adding-a-new-exam) instructions in the README.

## Making a pull request

1. Create a focused branch from the default branch.
2. Make the smallest complete change that addresses the issue.
3. Run `npm run build`.
4. Review the diff and remove unrelated changes.
5. Open a pull request with:
   - a concise summary of the change;
   - the exam, topic, or application area affected;
   - sources for new or corrected learning content;
   - validation steps and results;
   - screenshots for visible UI changes, when useful.

Please use a clear title such as `Add SAA-C03 networking questions` or `Correct IAM explanation in learning guide`.

## Reporting an issue

When reporting incorrect information, include the exam or page, the question or section, the issue you found, and a source or proposed correction. For bugs, include reproduction steps, expected behavior, actual behavior, and browser details when relevant.

Please do not report or publish sensitive information in issues or pull requests.

## Community expectations

Be respectful, constructive, and welcoming. Review feedback is intended to improve the learning resource. Maintainers may request clarification, sources, or revisions before accepting a contribution.

Thank you for helping other AWS learners prepare with confidence.
