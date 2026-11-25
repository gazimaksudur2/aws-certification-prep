# AWS Certification Practice Hub

> A free, community-focused resource for AWS certification learners.

[![Live Demo](https://img.shields.io/badge/Live-aws--certification--prep.netlify.app-FF9900?style=for-the-badge&logo=netlify&logoColor=white)](https://aws-certification-prep.netlify.app/)
[![Made by](https://img.shields.io/badge/Portfolio-gazimaksudur.dev-0088cc?style=for-the-badge&logo=google-chrome&logoColor=white)](https://gazimaksudur.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Netlify Status](https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://app.netlify.com/sites/aws-certification-prep/deploys)

A browser-based study app for AWS certification exams. Take timed practice quizzes that mirror exam pressure, use untimed guided practice with instant feedback, browse the full question bank, and review AWS services in a structured reference — all without signing in. Progress from timed quizzes is stored locally in your browser.

[![Live](https://img.shields.io/badge/Live_-aws--certification--prep.netlify.app-0088cc?style=for-the-badge&logo=netlify)](https://aws-certification-prep.netlify.app/)

This project is maintained as a free learning resource for the AWS learning community. If it helps you prepare, please [give the repository a star](https://github.com/gazimaksudur2/aws-certification-prep) and share it with other learners. Contributions that improve the accuracy and usefulness of the material are welcome.

**Project owner:** [Gazi Maksudur Rahman](https://gazimaksudur.dev)

**Repository:** [gazimaksudur2/aws-certification-prep](https://github.com/gazimaksudur2/aws-certification-prep)

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
- [Contributing](#contributing)
- [Acknowledgement](#acknowledgement)
- [Deployment](#deployment)

---

## Features

| Feature | What it does |
| --- | --- |
| **Multi-certification support** | Catalog-driven practice and learning for multiple AWS certs (CLF-C02, SAA-C03, AIF-C01, SOA-C03, plus a combined CLF+SAA study pack). |
| **Timed quiz** | Exam-style run with a countdown of **120 seconds × number of questions**. Answers are hidden until the quiz ends. |
| **Guided practice** | Untimed mode with instant correct/incorrect feedback after each question and a **Learn more** link to Google for deeper explanation. |
| **Topic filtering** | Narrow a run to one domain/topic or use the full pool. |
| **Configurable length** | Choose 5 to all available questions in the filtered pool. |
| **Results summary** | Score, pass/fail against the exam threshold, time spent, topic breakdown, and per-question review. |
| **Attempt history** | Timed quiz attempts are saved in `localStorage` (up to 10 per exam). Guided practice runs are not recorded. |
| **Question bank** | Search, filter, and expand any question to reveal the keyed answer — for study only. |
| **Learning study hub** | Per-cert roadmaps (pick AIF-C01, SOA-C03, or the CLF+SAA pack) with priority badges, exam topics, comparisons, traps, strategy, and checklists with progress namespaced per exam. |
| **No account required** | Everything runs client-side; no backend or authentication. |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)

### Install and run

```bash
git clone https://github.com/gazimaksudur2/aws-certification-prep.git
cd aws-certification-prep
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

1. **Choose a certification** — pick an exam with a practice bank (CLF-C02 or SAA-C03 today). Learning-only certs (AIF-C01, SOA-C03) link to their study paths until banks ship.
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

**Route:** `/learning` (optional `?exam=<examId>`)

Pick a learning path, then use the same four tabs for every certification:

**Roadmap tab** — domain/service counts, priority legend, multi-week plan, progress rings  
**Service reference tab** — searchable domains/services, priority filters, comparisons, traps, mark reviewed; Practice deep-links when a bank exists (otherwise “coming soon”)  
**Exam strategy tab** — traps and high-ROI techniques for that cert  
**Checklist tab** — interactive mastery list

| Path | `examId` | Data file |
| --- | --- | --- |
| CLF+SAA combined pack | `aws-clf-saa-combined` | `public/data/learning/aws-clf-saa-combined.json` |
| AI Practitioner | `aws-aif-c01` | `public/data/learning/aws-aif-c01.json` |
| SysOps Administrator | `aws-soa-c03` | `public/data/learning/aws-soa-c03.json` |

Progress is stored per exam in `localStorage` key `learning-progress-v2` (legacy CLF+SAA checklist keys migrate into the combined pack automatically).

Validate learning artifacts with `npm run build:learning` (also runs during `npm run build`).

---

## Available exams

Exams are defined in [`src/data/exams/catalog.json`](src/data/exams/catalog.json). Practice requires a bank under [`src/data/exams/`](src/data/exams/); learning requires a JSON file under [`public/data/learning/`](public/data/learning/).

| Code | Exam | Practice bank | Learning |
| --- | --- | --- | --- |
| CLF-C02 | AWS Certified Cloud Practitioner | `aws-clf-c02.json` | Per bank metadata |
| SAA-C03 | AWS Certified Solutions Architect – Associate | `aws-saa-c03.json` | Per bank metadata |
| SOA-C03 | AWS Certified SysOps Administrator – Associate | `aws-soa-c03.json` | 72% (per bank metadata) |

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
| `/learning` | `Learning` | Per-cert study hub picker + roadmap / reference / strategy / checklist |

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

The optional `rationale` field on each option is present in the SOA-C03 bank (one explanation paragraph per option). It is omitted from CLF-C02 and SAA-C03. When present, rationales appear after the answer is revealed in guided practice, results review, and the question bank.

Banks are registered in [`src/utils/exams.ts`](src/utils/exams.ts) via a static `BANK_MAP` and surfaced through `listCatalog()`, `getQuestionsForExam()`, and `getTopicsForExam()`.

Learning content is loaded per exam from [`public/data/learning/`](public/data/learning/). Types live in [`src/types/learning.ts`](src/types/learning.ts); progress is tracked by [`src/hooks/useLearningProgress.ts`](src/hooks/useLearningProgress.ts).

---

## Project structure

```
aws-certification-quiz-app/
├── public/
│   ├── data/
│   │   ├── learning/          # Per-exam learning JSON (served statically)
│   │   └── aws-learning-roadmap.json  # Legacy alias of CLF+SAA pack
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
| `npm run ingest:soa` | Regenerate `aws-soa-c03.json` from `scripts/ingest-soa-from-js.mjs` (source JS files required) |
| `npm run wrap-clf` | One-off wrapper: legacy `questions.json` → exam bank format |
| `npm run convert:roadmap` | Regenerate `aws-learning-roadmap.json` from roadmap HTML (one-time; HTML can be deleted after) |
| `npm run build:learning` | Validate per-exam learning JSON under `public/data/learning/` and sync legacy roadmap alias |
| `npm run ingest:exam` | Stub for future AIF/SOA markdown → bank ingest (`--exam=aws-aif-c01\|aws-soa-c03`) |
| `npm run generate:learning` | Legacy: regenerate `aws-clf-c02-study-guide.json` (superseded by roadmap JSON) |

Source markdown and text files under `public/` are gitignored — they are local ingestion inputs, not shipped assets.

---

## Adding a new exam

### Practice bank

1. Create **`src/data/exams/<examId>.json`** using the schema above.
2. Import the bank in [`src/utils/exams.ts`](src/utils/exams.ts) and add it to `BANK_MAP`.
3. Append a catalog entry with `practice.enabled: true` (and optional `learning` block).
4. Run `npm run build` — Practice and Question Bank pick it up automatically.

### Learning path only

1. Add **`public/data/learning/<examId>.json`** (`schemaVersion: 3` with `examId`, `code`, `domains`, `strategy`, `checklist`, `phases`).
2. Append a catalog entry with `learning.enabled: true` and `dataPath` pointing at that file; set `practice.enabled: false` until a bank exists.
3. Run `npm run build:learning` (or full `npm run build`).

Banks are statically imported today for simplicity. If bundle size becomes an issue, switching to dynamic `import()` per exam is a straightforward follow-on.

---

## Contributing

Contributions are encouraged from learners, AWS practitioners, educators, and developers. You can help by adding carefully sourced exam questions, improving learning materials, correcting inaccurate information, fixing bugs, or improving the app experience.

Please read the [contribution guide](CONTRIBUTING.md) before opening an issue or pull request. Every contribution should prioritize accuracy, clarity, and respect for AWS exam-content policies.

---

## Acknowledgement

AWS Certification Practice Hub is designed, built, and maintained by [**Gazi Maksudur Rahman**](https://gazimaksudur.dev) — a software developer passionate about developer tooling and AWS cloud technology.

- 🌐 **Portfolio:** [gazimaksudur.dev](https://gazimaksudur.dev)
- 💻 **GitHub:** [gazimaksudur2](https://github.com/gazimaksudur2)
- 📦 **Repository:** [gazimaksudur2/aws-certification-prep](https://github.com/gazimaksudur2/aws-certification-prep)

This project is offered as a free resource for the AWS learning community. If it helps you prepare:
- ⭐ [Star the repository](https://github.com/gazimaksudur2/aws-certification-prep) to help others discover it
- 🔀 [Contribute](CONTRIBUTING.md) improvements through pull requests
- 📢 Share it with other AWS learners

> This project is independent and is not affiliated with, endorsed by, or sponsored by Amazon Web Services.

---

## Deployment

The app is a static SPA. [`netlify.toml`](netlify.toml) configures:

- **Build:** `npm run build`
- **Publish directory:** `dist`
- **SPA fallback:** all unknown paths rewrite to `index.html` so direct navigation to `/quiz`, `/guided`, `/results`, and `/practice/browse` works on reload.

No server-side runtime is required. All quiz state and history remain in the user's browser.

---

## License

This project is provided free of charge for learning and community use. See the repository's licensing terms for permissions and conditions before redistributing or reusing the source.
