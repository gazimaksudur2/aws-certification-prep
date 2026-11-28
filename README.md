# AWS Certification Practice Hub

A free, public study room for AWS certification practice. Open the site, choose an exam, and start. No account, no payment, no install.

[![Live](https://img.shields.io/badge/Practice%20free-aws--certification--prep.netlify.app-FF9900?style=for-the-badge&logo=netlify&logoColor=white)](https://aws-certification-prep.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Maintainer](https://img.shields.io/badge/Maintainer-gazimaksudur.dev-0088cc?style=for-the-badge)](https://gazimaksudur.dev)

**Start here:** [aws-certification-prep.netlify.app](https://aws-certification-prep.netlify.app/)

---

## A public place to practice

Certification is one of the clearer ways an engineer can show cloud skill. The exams are public. The cost of preparing for them is not. Official courses, paid simulators, and commercial question packs are useful, and they are priced for people who can already spend. Students, career-switchers, and engineers in places where those products are hard to buy are left choosing between skipping deliberate practice and trusting leaked exam content.

Practice is part of the learning, and it should be available to anyone who wants to sit the exam. This hub exists for that reason. It is a free service: timed quizzes that resemble exam pressure, untimed guided practice with immediate feedback, a searchable question bank, and certification roadmaps. Anyone with a browser can use it. Progress stays on the device. Nothing is sold, and nothing is gated behind a login.

The material is original practice written for study. It is a companion to the official exam guides and AWS documentation, and it stays useful only while the people who use it help keep it accurate. That work is described in [Contributing](#contributing).

This project is independent. It is not affiliated with, endorsed by, or sponsored by Amazon Web Services.

---

## What you can do

| | |
| --- | --- |
| **Timed quiz** | Exam-style run. The clock is **120 seconds × the number of questions**. Answers stay hidden until you finish. **Flag for review** lives in the question card header; the numbered palette sits below the card so you can jump and see answered vs unanswered at a glance. |
| **Guided practice** | Untimed. Check each answer as you go, read which options are correct, and open **Learn more** for a deeper search. Same card-header flag and below-card palette as timed. |
| **Question bank** | Search and filter the full pool. Expand any item to study the keyed answer. This mode is for review. |
| **Learning hub** | Per-cert roadmaps, service reference, exam strategy, and a checklist. Progress is saved per exam on your device. |
| **Your history** | The last 10 attempts per exam (timed and guided) are stored locally with full question review — stems, your selections, and correct answers. Click a prior attempt on Practice to reopen it. |

You need at least **5 questions** in the filtered pool to start a run. Filter by topic or use the full set, and choose a length from 5 up to every question available.

### Certifications

| Code | Exam | Practice | Learning path | Pass mark |
| --- | --- | --- | --- | --- |
| CLF-C02 | AWS Certified Cloud Practitioner | Question bank | Combined CLF + SAA pack | In the bank (70% if unset) |
| SAA-C03 | AWS Certified Solutions Architect – Associate | Question bank | Combined CLF + SAA pack | In the bank (70% if unset) |
| CLF+SAA | Combined Cloud Practitioner and Solutions Architect study pack | — | `aws-clf-saa-combined` | — |
| AIF-C01 | AWS Certified AI Practitioner | Question bank | Learning path available | 70% |
| SOA-C03 | AWS Certified SysOps Administrator – Associate | Question bank | Learning path available | 72% |

On AI Practitioner and SysOps items, each option carries a short rationale. Those explanations appear after you reveal the answer in guided practice, results review, and the question bank.

### How a session works

1. Open **Practice** and choose a certification: Cloud Practitioner, Solutions Architect Associate, AI Practitioner, or SysOps Administrator Associate all have question banks.
2. Set a topic, or keep **All**, and set the number of questions.
3. Start a **timed quiz** or **guided practice**. **Browse** opens the bank for the selected exam without starting a run.
4. During a run, jump with the palette or ←/→, press **F** to flag a question, and (timed) confirm submit when unanswered or flagged items remain.
5. Finish on the results screen: score, pass or fail against that exam's threshold, time, topic strength, and a question-by-question review (flagged items are marked when you used flag-for-review).

**Learning** is separate from the quiz. Pick a path — the combined Cloud Practitioner and Solutions Architect pack, AI Practitioner, or SysOps — then use the roadmap, service reference, exam strategy, and checklist. Where a practice bank exists, a domain can deep-link into practice. Where it does not, the link says the bank is still coming.

Refreshing the tab during a quiz ends that session. History and learning progress survive because they are stored in the browser, under keys that never leave the machine. Attempt snapshots include question text, your selections, and correct answers so you can review offline; nothing is uploaded. There is no server account to recover them on another device. Older thin history (`cert-quiz-history-v2`) is cleared when the app upgrades to the rich history schema.

---

## Contributing

This service stays free and trustworthy because contributors treat it as a public utility. Accuracy matters more than volume. A wrong explanation, repeated across thousands of practice sessions, teaches the wrong lesson. Review is strict for that reason, and it is applied the same way to everyone, including maintainers.

Contributions are licensed under the [MIT License](LICENSE), the same terms as the rest of the project. By opening a pull request you agree that your contribution may be used, modified, and redistributed under that license.

File formats, catalog entries, and the checks to run from a local checkout are in [CONTRIBUTING.md](CONTRIBUTING.md).

### What helps

- Original practice questions, with a clear stem, plausible options, a correct key, and an explanation of why the other options fail.
- Corrections to outdated service behavior, ambiguous wording, or a wrong key, with a source.
- Learning-path improvements: domain notes, comparisons, traps, checklists, and links to current AWS documentation or the official exam guide.
- Support for another AWS certification, once the content meets the standard below.
- Bug fixes, accessibility improvements, and clearer study flows.
- Reports of a wrong answer or a confusing explanation. A precise report is a contribution.

### What we will decline

- Real AWS exam items, memorized dumps, or questions copied from commercial banks and paid courses.
- Copyrighted course material, documentation pasted in bulk, or content you do not have the right to contribute.
- Questions with no explanation, trick wording that depends on a stale console label, or claims about pricing, quotas, and feature availability that are not sourced.
- Credentials, personal data, or anything that does not belong in a public repository.
- Drive-by rewrites that mix an unrelated change into a content fix.

Prefer questions written for this project. When a fact can change — a default limit, a regional service, a console path — say so, and point at the AWS page you checked.

### Reporting an issue

Open an issue when a question, explanation, or page is wrong or unclear. Include:

- The exam code and, for a question, the id and topic.
- The sentence or option you believe is wrong.
- What you expected, and why.
- A link to current AWS documentation, the official exam guide, or another primary source.
- For a bug: the steps, what you expected, what happened, and the browser.

Search existing issues first. A duplicate report still helps if you add a source the original lacks.

### Pull requests

1. Start from the default branch and keep the change to one concern.
2. Use a title that names the exam and the change, for example `Correct SOA-C03 EBS snapshot explanation` or `Add AIF-C01 domain traps to the learning path`.
3. In the description, state what changed, which exam or screen it affects, the sources you used, and how you checked it.
4. For question or learning JSON, confirm ids are unique, every correct answer id exists on the question, and `isMultiple` matches the key.
5. When you change application code or generated content, run `npm run build` from your checkout. Learning-only edits can be checked with `npm run build:learning`.
6. Read the diff before you open the request and drop unrelated files.

Screenshots help when the change is visible. They are optional for a wording or data fix.

Maintainers may ask for a source, a smaller diff, or a rewrite of an explanation before merging. That review protects learners; it is not a judgment of the contributor. If a change cannot be verified, it waits.

### Community

Be direct, specific, and respectful. Disagree about the technical claim and cite the document. Assume the other person is trying to make the resource more reliable. Harassment, sneering review, and unsolicited dumping of exam content are out of place here.

Maintainers may edit contributions for clarity, close issues that lack enough detail to act on, and remove material that conflicts with the content standard.

---

## Maintainer

Designed, built, and maintained by [Gazi Maksudur Rahman](https://gazimaksudur.dev).

- Portfolio: [gazimaksudur.dev](https://gazimaksudur.dev)
- GitHub: [gazimaksudur2](https://github.com/gazimaksudur2)
- Repository: [gazimaksudur2/aws-certification-prep](https://github.com/gazimaksudur2/aws-certification-prep)

If the hub helps you prepare, star the repository so other learners can find it, and send a correction when you spot one. Sharing the live site is as useful as sharing the source.

## License

MIT. See [LICENSE](LICENSE). You may use, modify, and redistribute this project under those terms. The software is provided as-is, without warranty. AWS, the AWS certification names, and related marks are trademarks of Amazon.com, Inc. or its affiliates; use of those names here is for identification of the exams learners are preparing for.
