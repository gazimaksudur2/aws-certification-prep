# AWS Certification Practice Hub

A browser-based study app for AWS certification exams. Take timed practice quizzes that mirror exam pressure, use untimed guided practice with instant feedback, browse the full question bank, and review AWS services in a structured reference — all without signing in. Progress from timed quizzes is stored locally in your browser.

[![Live](https://img.shields.io/badge/Live_-aws--certification--prep.netlify.app-0088cc?style=for-the-badge&logo=netlify)](https://aws-certification-prep.netlify.app/)

Built with **React 18**, **TypeScript**, **Vite 5**, **React Router 6**, and **Tailwind CSS 3**.

---

## Table of contents

- [Features](#features)
- [Getting started](#getting-started)
- [User guide](#user-guide)
  - [Home](#home)
  - [Timed quiz](#timed-quiz)
  - [Guided practice](#guided-practice)
  - [Results and review](#results-and-review)
  - [Question bank](#question-bank)
  - [Learning reference](#learning-reference)
- [Available exams](#available-exams)
- [How it works](#how-it-works)
  - [Routing and pages](#routing-and-pages)
  - [Quiz session state](#quiz-session-state)
  - [Scoring and pass threshold](#scoring-and-pass-threshold)
  - [Attempt history](#attempt-history)
  - [Question data model](#question-data-model)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Adding a new exam](#adding-a-new-exam)
- [Deployment](#deployment)

---

## Features

| Feature | What it does |
| --- | --- |
| **Multi-certification support** | Practice CLF-C02 and SAA-C03 from a single app; the catalog drives the UI automatically. |
| **Timed quiz** | Exam-style run with a countdown of **120 seconds × number of questions**. Answers are hidden until the quiz ends. |
| **Guided practice** | Untimed mode with instant correct/incorrect feedback after each question and a **Learn more** link to Google for deeper explanation. |
| **Topic filtering** | Narrow a run to one domain/topic or use the full pool. |
| **Configurable length** | Choose 5 to all available questions in the filtered pool. |
| **Results summary** | Score, pass/fail against the exam threshold, time spent, topic breakdown, and per-question review. |
| **Attempt history** | Timed quiz attempts are saved in `localStorage` (up to 10 per exam). Guided practice runs are not recorded. |
| **Question bank** | Search, filter, and expand any question to reveal the keyed answer — for study only. |
| **Learning study hub** | Combined CLF-C02 + SAA-C03 roadmap with priority badges, exam topics, comparisons, traps, strategy, and a Top-50 checklist with saved progress. |
| **No account required** | Everything runs client-side; no backend or authentication. |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)

### Install and run

```bash
git clone <repository-url>
cd aws-certification-quiz-app
npm install
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173) and opens in your browser automatically.

### Production build

```bash
npm run build    # type-check + generate learning JSON + Vite bundle
npm run preview  # serve the dist/ output locally
```

Build output is written to `dist/`.

---

## User guide

### Home

**Route:** `/`

The landing page introduces the app and links to **Practice** and **Learning**. It shows how many exams and questions are loaded and notes that progress is stored locally.

### Practice hub

**Route:** `/practice`

This is where you configure and start a quiz.

1. **Choose a certification** — pick CLF-C02 or SAA-C03 from the grid.
2. **Set the topic** — filter to a single domain or keep **All**.
3. **Set the question count** — use the slider, quick presets (10 / 20 / 50 / 100), or **All**.
4. **Start a mode:**
   - **Start timed quiz** — exam-style run with a countdown.
   - **Start guided practice** — untimed run with instant feedback per question.
5. **Browse** — open the question bank for the selected exam without starting a run.

The page also shows stats for the selected exam (pool size, your attempts, average score) and recent timed attempts.

> Minimum run size is **5 questions**. You need at least 5 questions in the filtered pool to start.

### Timed quiz

**Route:** `/quiz`

Simulates exam conditions:

- A countdown timer shows remaining time (allotted time = **120 seconds × questions in the run**).
- Select one or more options (multi-select questions are labeled).
- Use **Save · next** to record your answer and advance, **Skip question** to leave it blank, or **End quiz now** to submit early.
- When time reaches zero, the quiz auto-submits and sends you to results.
- Correctness is **not** shown during the quiz — only after you finish.

Navigation: **Prev** lets you revisit earlier questions within the same session.

### Guided practice

**Route:** `/guided`

Designed for learning rather than testing:

- **No timer** — take as long as you need.
- Select your answer, then click **Check answer** to reveal whether you were right.
- Correct options are highlighted in green; wrong selections in red.
- A verdict banner shows **Correct** or **Incorrect** and lists the authoritative answer(s).
- **Learn more** opens a new browser tab with a Google search built from the question stem, all options, and a prompt asking for justification.
- Use **Next question** to continue, **Skip question** to move on without answering, or **End practice now** to finish early.

At the end you see the same results summary as a timed quiz, but the run is **not saved** to attempt history.

### Results and review

**Route:** `/results`

After any completed run (timed or guided):

- **Score badge** — correct count, percentage, and pass/fail against the exam's threshold.
- **Stats** — time spent, correct/incorrect/skipped counts, pass bar.
- **Strength by topic** — bar chart when the run spans multiple topics.
- **Detailed review** — every question with your selections, correct answers, and option-level grading.

For timed quizzes, the attempt is persisted to `localStorage`. Guided practice shows a note that the run was not saved.

### Question bank

**Route:** `/practice/browse?exam=<examId>`

A read-only study view of the full question pool:

- Switch exams from the dropdown.
- Search question text and option text.
- Filter by topic and question type (all / single-select / multi-select).
- Click a row to expand and see which options are correct.

Answers are visible immediately — this mode is for review, not assessment.

### Learning study hub

**Route:** `/learning`

A guided certification prep experience covering **both CLF-C02 and SAA-C03**:

**Roadmap tab**
- Overview hero with domain/service counts
- Priority legend (Critical → Low)
- 4-week study plan with links into each domain
- Progress rings for domains reviewed and checklist items mastered

**Service reference tab**
- 17 domains, 76+ services with **priority badges** and expandable **key exam topics**
- Search plus filters for exam (CLF / SAA / both) and priority level
- Per-domain comparison tables, exam-trap callouts, and security/architecture info cards
- **Mark reviewed** per domain; **Practice this domain** deep-links to `/practice?exam=…&topic=…`

**Exam strategy tab**
- Common traps, scenario-solving technique, 30-day plan, exam-day tips, confused services, high-ROI topics

**Top 50 checklist tab**
- Interactive checklist — click to mark mastered; progress saved in `localStorage`

Progress keys: `learning-domains-reviewed-v1`, `learning-checklist-v1`, `learning-active-tab-v1`.

Data source: [`public/data/aws-learning-roadmap.json`](public/data/aws-learning-roadmap.json) (`schemaVersion: 2`). Regenerate from the legacy HTML (if you still have it) via `npm run convert:roadmap`.

---

## Available exams

Exams are defined in [`src/data/exams/catalog.json`](src/data/exams/catalog.json) and backed by JSON question banks in [`src/data/exams/`](src/data/exams/).

| Code | Exam | Question bank | Pass threshold |
| --- | --- | --- | --- |
| CLF-C02 | AWS Certified Cloud Practitioner | `aws-clf-c02.json` | Per bank metadata |
| SAA-C03 | AWS Certified Solutions Architect – Associate | `aws-saa-c03.json` | Per bank metadata |

Each bank file includes `passThresholdPercent` (defaults to 70% if omitted). The results screen compares your score against that value.

---

## How it works

### Routing and pages

React Router drives a single-page app. All routes are declared in [`src/App.tsx`](src/App.tsx):

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `Landing` | App overview and navigation |
| `/practice` | `Home` | Exam selection and quiz configuration |
| `/quiz` | `Quiz` | Timed quiz session |
| `/guided` | `GuidedPractice` | Untimed guided practice session |
| `/results` | `Results` | Score summary and detailed review |
| `/practice/browse` | `Browse` | Searchable question bank |
| `/learning` | `Learning` | CLF + SAA study hub (roadmap, reference, strategy, checklist) |

The global navbar ([`src/components/Navbar.tsx`](src/components/Navbar.tsx)) links Home, Practice, Question Bank, and Learning.

### Quiz session state

Quiz state lives in a React context provided by [`src/hooks/useQuiz.ts`](src/hooks/useQuiz.ts) and wraps the app in [`src/main.tsx`](src/main.tsx).

When you start a run, `startQuiz(examId, count, topic?, mode?)` creates a `QuizSession`:

- Randomly samples `count` questions from the pool (optionally filtered by topic).
- Sets `mode` to `'timed'` or `'guided'`.
- For timed runs, computes `timeLimitSeconds` via [`src/utils/timeLimit.ts`](src/utils/timeLimit.ts).
- For guided runs, sets `timeLimitSeconds` to `0` (no timer).

The session holds questions, your answers, and the current index. It exists only in memory for the duration of the browser tab — refreshing mid-quiz returns you to Practice.

Timed and guided sessions share the same context but render on different routes. [`src/pages/Quiz.tsx`](src/pages/Quiz.tsx) redirects guided sessions to `/guided`; [`src/pages/GuidedPractice.tsx`](src/pages/GuidedPractice.tsx) redirects timed sessions to `/quiz`.

### Scoring and pass threshold

Grading logic is in [`src/utils/scoring.ts`](src/utils/scoring.ts):

- Single- and multi-select answers are compared as unordered sets (`isAnswerCorrect`).
- During a timed quiz, answers are stored without grading.
- On the results screen, each question is marked correct, incorrect, skipped, or unanswered.
- Pass/fail uses the exam bank's `passThresholdPercent`.

Guided practice grades immediately after **Check answer** using the same `isAnswerCorrect` helper, and reuses [`QuestionCard`](src/components/QuestionCard.tsx) / [`OptionButton`](src/components/OptionButton.tsx) with `showSolution` enabled.

The **Learn more** action is implemented in [`src/utils/learnMore.ts`](src/utils/learnMore.ts): it builds a Google search URL from the question and options and opens it with `window.open(..., '_blank', 'noopener,noreferrer')`.

### Attempt history

Timed quiz results are persisted by [`src/hooks/useHistory.ts`](src/hooks/useHistory.ts):

- Storage key: `cert-quiz-history-v2`
- Schema: `{ schemaVersion: 2, attempts: AttemptHistoryEntry[] }`
- Keeps the **10 most recent** attempts per exam.
- Migrates legacy data from the older `aws-quiz-history` key automatically.

Guided practice results are intentionally excluded — the save effect in [`src/pages/Results.tsx`](src/pages/Results.tsx) checks `session.mode === 'guided'` and skips persistence.

### Question data model

Question banks follow a consistent JSON envelope (see [`src/types/index.ts`](src/types/index.ts)):

```json
{
  "examId": "aws-clf-c02",
  "code": "CLF-C02",
  "title": "AWS Certified Cloud Practitioner",
  "passThresholdPercent": 70,
  "questions": [
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
  ]
}
```

Banks are registered in [`src/utils/exams.ts`](src/utils/exams.ts) via a static `BANK_MAP` and surfaced through `listCatalog()`, `getQuestionsForExam()`, and `getTopicsForExam()`.

Learning content is loaded at runtime from [`public/data/aws-learning-roadmap.json`](public/data/aws-learning-roadmap.json). Types live in [`src/types/learning.ts`](src/types/learning.ts); progress is tracked by [`src/hooks/useLearningProgress.ts`](src/hooks/useLearningProgress.ts).

---

## Project structure

```
aws-certification-quiz-app/
├── public/
│   ├── data/                  # Generated learning JSON (served statically)
│   └── aws-icon.svg
├── scripts/
│   ├── build.js               # Cross-platform build (tsc + Vite)
│   ├── generate-learning-json.mjs
│   ├── parse-questions.js     # CLF bank ingestion
│   ├── ingest-saa-from-md.mjs # SAA bank ingestion
│   └── ...
├── src/
│   ├── components/            # Shared UI (QuestionCard, Navbar, Modal, …)
│   ├── data/exams/            # Question banks + catalog.json
│   ├── hooks/                 # useQuiz, useHistory, useLearningClusters
│   ├── pages/                 # Route-level views
│   ├── types/                 # Shared TypeScript interfaces
│   ├── utils/                 # exams, scoring, shuffle, timeLimit, learnMore
│   ├── App.tsx                # Router setup
│   └── main.tsx               # App bootstrap + QuizProvider
├── netlify.toml               # SPA deploy config
└── vite.config.ts
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Generate learning JSON, type-check, and produce `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run parse` | Regenerate `aws-clf-c02.json` from source markdown |
| `npm run ingest:saa` | Regenerate `aws-saa-c03.json` from `public/aws-saa-practice-exam.md` |
| `npm run ingest:saa:paired` | Alternative SAA ingestion from paired source files |
| `npm run wrap-clf` | One-off wrapper: legacy `questions.json` → exam bank format |
| `npm run convert:roadmap` | Regenerate `aws-learning-roadmap.json` from roadmap HTML (one-time; HTML can be deleted after) |
| `npm run generate:learning` | Legacy: regenerate `aws-clf-c02-study-guide.json` (superseded by roadmap JSON) |

Source markdown and text files under `public/` are gitignored — they are local ingestion inputs, not shipped assets.

---

## Adding a new exam

1. Create **`src/data/exams/<examId>.json`** using the schema above.
2. Import the bank in [`src/utils/exams.ts`](src/utils/exams.ts) and add it to `BANK_MAP`.
3. Append an entry to [`src/data/exams/catalog.json`](src/data/exams/catalog.json).
4. Run `npm run build` — the Practice hub and Question Bank will pick up the new exam automatically.

Banks are statically imported today for simplicity. If bundle size becomes an issue, switching to dynamic `import()` per exam is a straightforward follow-on.

---

## Deployment

The app is a static SPA. [`netlify.toml`](netlify.toml) configures:

- **Build:** `npm run build`
- **Publish directory:** `dist`
- **SPA fallback:** all unknown paths rewrite to `index.html` so direct navigation to `/quiz`, `/guided`, `/results`, and `/practice/browse` works on reload.

No server-side runtime is required. All quiz state and history remain in the user's browser.

---

## License

Private project — see repository settings for licensing terms.
