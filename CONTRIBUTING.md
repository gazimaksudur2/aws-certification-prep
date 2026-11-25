# Contributing

The standard for this project — what to contribute, what will be declined, how to report an issue, and how pull requests are reviewed — is the [contribution guide in the README](README.md#contributing). Read that first.

This file is the working reference for people editing question banks, learning paths, or the application from a local checkout.

## Content rules

Accuracy matters more than quantity.

1. Check technical claims against current AWS documentation or the official exam guide.
2. Write original practice questions for this project. Real AWS exam items, memorized dumps, and copyrighted course material will be declined.
3. Explain the correct answer and why the other options fail, especially when a distractor matches a common misconception.
4. Use official AWS service and certification names. Prefer codes such as **AIF-C01** over informal aliases.
5. Mark facts that drift: service limits, pricing, regional availability, and console paths.
6. Keep credentials, personal data, and unverifiable claims out of the repository.

For a correction, say what is wrong, why, and which source supports the replacement.

## Checking a local checkout

From your checkout of the repository:

```bash
npm install
npm run build
```

`npm run build` validates learning JSON, type-checks the app, and produces the production bundle in `dist/`. Learning-only edits can be checked with:

```bash
npm run build:learning
```

Node.js 20 or later is required. Source markdown under `public/` is gitignored; those files are local ingestion inputs and are not shipped.

## Questions

Banks live in [`src/data/exams/`](src/data/exams/) and are registered in [`src/utils/exams.ts`](src/utils/exams.ts). Each bank uses this envelope:

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
        { "id": "B", "text": "Option B", "rationale": "Optional. Used on SOA-C03." }
      ],
      "correctAnswers": ["A"],
      "isMultiple": false,
      "topic": "Cloud Concepts"
    }
  ]
}
```

When you add or change a question:

- Keep `id` unique within the bank.
- Put only existing option ids in `correctAnswers`.
- Set `isMultiple` to match the number of correct answers.
- Reuse an existing topic name when the question belongs to one.
- Read the item in the question bank and in guided practice.
- If the bank is produced by a script, update the source and regenerate it instead of hand-editing the output. `npm run ingest:aif` rebuilds AIF-C01. `npm run ingest:soa` rebuilds SOA-C03. `npm run ingest:saa` rebuilds SAA-C03. `npm run parse` rebuilds CLF-C02.
- The JS source files for AIF-C01 (`src/data/aifc01/`) and SOA-C03 (`src/data/soac03/`) are local-only ingestion inputs — they are gitignored and not committed to the repository. Place them in those directories before running the ingest scripts. The generated exam bank JSON files (`src/data/exams/aws-aif-c01.json`, `aws-soa-c03.json`) are committed and do not require the source files to run the app.

`rationale` on an option is optional. The SysOps bank includes one paragraph per option. Cloud Practitioner and Solutions Architect banks omit it. When it is present, the app shows it after the answer is revealed.

## Learning paths

Learning JSON lives in [`public/data/learning/`](public/data/learning/). Notes for a path can live under `content/learning/<examId>/`.

- Keep `schemaVersion`, `examId`, `code`, `domains`, `strategy`, `checklist`, and `phases` consistent with the existing files.
- Align domain names and `quizTopic` values with the exam guide where the practice bank uses those topics.
- Cite AWS docs, Skill Builder, or the official exam guide in the pull request for new or corrected study material.
- Run `npm run build:learning` before opening the pull request.

## Adding an exam

### Practice bank

1. Add `src/data/exams/<examId>.json` using the envelope above.
2. Import it in [`src/utils/exams.ts`](src/utils/exams.ts) and register it on `BANK_MAP`.
3. Append a catalog entry in [`src/data/exams/catalog.json`](src/data/exams/catalog.json) with `practice.enabled` set to `true`. Add a `learning` block when a path exists.
4. Run `npm run build`. Practice and the question bank pick the exam up from the catalog.

### Learning path only

1. Add `public/data/learning/<examId>.json`.
2. Append a catalog entry with `learning.enabled` set to `true`, `dataPath` pointing at that file, and `practice.enabled` set to `false` until a bank exists.
3. Run `npm run build:learning`.

The catalog drives both the practice picker and the learning picker. Two exams may share one learning file, as Cloud Practitioner and Solutions Architect do with the combined pack. Give that shared path its own catalog entry with `packOf` when learners should open it as one roadmap.

## Pull request checklist

- The change matches one concern, and the title names the exam or area.
- The description includes sources for new or corrected material and the command you used to check it.
- Question ids, keys, and `isMultiple` are consistent.
- `npm run build` passes when code or banks changed. `npm run build:learning` passes when learning JSON changed.
- The diff contains no unrelated files, secrets, or copied exam content.

Maintainers may ask for a source or a smaller change before merging. See the [README contribution guide](README.md#contributing) for how review works.
