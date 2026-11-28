/**
 * Smoke tests for rich attempt snapshot building (flagged + answers).
 * Mirrors src/utils/attemptSnapshot.ts without a test runner.
 *
 * Run: node scripts/test-attempt-snapshot.mjs
 */

import assert from 'node:assert/strict';

function isAnswerCorrect(selected, correct) {
  if (selected.length !== correct.length) return false;
  const a = [...selected].sort();
  const b = [...correct].sort();
  return a.every((v, i) => v === b[i]);
}

function buildRichAttemptFromSession(session, summary) {
  const questions = session.questions.map((q) => {
    const ans = session.answers[q.id];
    const skipped = Boolean(ans?.skipped);
    const selectedAnswers = ans && !ans.skipped ? [...ans.selectedAnswers] : [];
    const flagged = Boolean(session.flagged?.[q.id]);
    return {
      questionId: q.id,
      topic: q.topic,
      stem: q.question,
      isMultiple: q.isMultiple,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        ...(o.rationale ? { rationale: o.rationale } : {}),
      })),
      correctAnswers: [...q.correctAnswers],
      selectedAnswers,
      skipped,
      ...(flagged ? { flagged: true } : {}),
    };
  });

  return {
    id: `${session.examId}-${summary.startedAt}-${summary.finishedAt}`,
    examId: session.examId,
    examCode: session.examCode,
    examTitle: session.examTitle,
    startedAt: summary.startedAt,
    finishedAt: summary.finishedAt,
    timeLimitSeconds: summary.timeLimitSeconds,
    submittedReason: summary.submittedReason,
    totalQuestions: summary.total,
    correctCount: summary.correctCount,
    scorePercent: summary.scorePercent,
    durationSeconds: summary.durationSeconds,
    mode: session.mode,
    passThresholdPercent: session.passThresholdPercent ?? 70,
    detailLevel: 'full',
    questions,
  };
}

function isQuestionAnswered(answers, questionId) {
  const a = answers[questionId];
  return Boolean(a && !a.skipped && a.selectedAnswers.length > 0);
}

const session = {
  examId: 'aws-clf-c02',
  examCode: 'CLF-C02',
  examTitle: 'Cloud Practitioner',
  passThresholdPercent: 70,
  mode: 'timed',
  questions: [
    {
      examId: 'aws-clf-c02',
      examCode: 'CLF-C02',
      id: 1,
      question: 'Q1?',
      options: [
        { id: 'A', text: 'Yes' },
        { id: 'B', text: 'No' },
      ],
      correctAnswers: ['A'],
      isMultiple: false,
      topic: 'Cloud Concepts',
    },
    {
      examId: 'aws-clf-c02',
      examCode: 'CLF-C02',
      id: 2,
      question: 'Q2?',
      options: [
        { id: 'A', text: 'Yes' },
        { id: 'B', text: 'No' },
      ],
      correctAnswers: ['B'],
      isMultiple: false,
      topic: 'Security',
    },
  ],
  answers: {
    1: { questionId: 1, selectedAnswers: ['A'], skipped: false },
  },
  flagged: { 2: true },
  currentIndex: 0,
  startedAt: 1_000,
  finishedAt: 2_000,
  timeLimitSeconds: 240,
  submittedReason: 'manual',
};

assert.equal(isQuestionAnswered(session.answers, 1), true);
assert.equal(isQuestionAnswered(session.answers, 2), false);
assert.equal(
  isQuestionAnswered(
    { 2: { questionId: 2, selectedAnswers: [], skipped: true } },
    2,
  ),
  false,
);

const entry = buildRichAttemptFromSession(session, {
  startedAt: session.startedAt,
  finishedAt: session.finishedAt,
  durationSeconds: 1,
  correctCount: 1,
  scorePercent: 50,
  total: 2,
  submittedReason: 'manual',
  timeLimitSeconds: 240,
});

assert.equal(entry.questions.length, 2);
assert.equal(entry.questions[0].flagged, undefined);
assert.equal(entry.questions[0].selectedAnswers[0], 'A');
assert.equal(entry.questions[1].flagged, true);
assert.equal(entry.questions[1].skipped, false);
assert.equal(entry.questions[1].selectedAnswers.length, 0);
assert.equal(isAnswerCorrect(['A'], ['A']), true);

console.log('✓ attempt snapshot / navigator helper tests passed');
