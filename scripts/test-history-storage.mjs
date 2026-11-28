/**
 * Contract tests for attempt-history storage helpers.
 * Mirrors the public behaviour of src/utils/historyStorage.ts without a test runner.
 *
 * Run: node scripts/test-history-storage.mjs
 */

import assert from 'node:assert/strict';

const MAX_ATTEMPTS_PER_EXAM = 10;
const HISTORY_KEY_V3 = 'cert-quiz-history-v3';
const HISTORY_KEY_V2 = 'cert-quiz-history-v2';
const HISTORY_KEY_LEGACY = 'aws-quiz-history';

/** Minimal in-memory localStorage. */
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    get size() {
      return map.size;
    },
    keys: () => [...map.keys()],
  };
}

function summarizeAttempts(entries) {
  return [...entries].sort((a, b) => b.finishedAt - a.finishedAt);
}

function trimAttemptsPerExam(entries, maxPerExam = MAX_ATTEMPTS_PER_EXAM) {
  const byExamId = new Map();
  for (const e of entries) {
    const bucket = byExamId.get(e.examId) ?? [];
    bucket.push(e);
    byExamId.set(e.examId, bucket);
  }
  const kept = [];
  for (const list of byExamId.values()) {
    kept.push(...summarizeAttempts(list).slice(0, maxPerExam));
  }
  return summarizeAttempts(kept);
}

function isRichAttempt(x) {
  if (x === null || typeof x !== 'object') return false;
  if (typeof x.id !== 'string' || !x.id) return false;
  if (typeof x.examId !== 'string' || !x.examId) return false;
  if (x.detailLevel !== 'full') return false;
  if (!Array.isArray(x.questions) || x.questions.length === 0) return false;
  if (x.questions.length !== x.totalQuestions) return false;
  if (x.mode !== 'timed' && x.mode !== 'guided') return false;
  return true;
}

function parseHistoryRaw(raw) {
  if (raw === null || raw === '') return { ok: false, reason: 'empty' };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'not-object' };
  }
  if (parsed.schemaVersion !== 3 || !Array.isArray(parsed.attempts)) {
    return { ok: false, reason: 'bad-envelope' };
  }
  const attempts = parsed.attempts.filter(isRichAttempt);
  return {
    ok: true,
    store: {
      schemaVersion: 3,
      attempts: trimAttemptsPerExam(attempts),
    },
  };
}

function loadHistoryStore(storage) {
  if (storage.getItem(HISTORY_KEY_V2) !== null) {
    storage.removeItem(HISTORY_KEY_V2);
  }
  if (storage.getItem(HISTORY_KEY_LEGACY) !== null) {
    storage.removeItem(HISTORY_KEY_LEGACY);
  }
  const raw = storage.getItem(HISTORY_KEY_V3);
  if (raw === null) return [];
  const parsed = parseHistoryRaw(raw);
  if (!parsed.ok) {
    storage.removeItem(HISTORY_KEY_V3);
    return [];
  }
  return parsed.store.attempts;
}

function makeAttempt(overrides = {}) {
  const startedAt = overrides.startedAt ?? Date.now();
  const finishedAt = overrides.finishedAt ?? startedAt + 60_000;
  const examId = overrides.examId ?? 'aws-clf-c02';
  return {
    id: overrides.id ?? `${examId}-${startedAt}-${finishedAt}`,
    examId,
    examCode: overrides.examCode ?? 'CLF-C02',
    examTitle: overrides.examTitle ?? 'Cloud Practitioner',
    startedAt,
    finishedAt,
    timeLimitSeconds: overrides.timeLimitSeconds ?? 600,
    submittedReason: overrides.submittedReason ?? 'manual',
    totalQuestions: 1,
    correctCount: overrides.correctCount ?? 1,
    scorePercent: overrides.scorePercent ?? 100,
    durationSeconds: 60,
    mode: overrides.mode ?? 'timed',
    passThresholdPercent: 70,
    detailLevel: 'full',
    questions: [
      {
        questionId: 1,
        topic: 'Cloud Concepts',
        stem: 'What is the cloud?',
        isMultiple: false,
        options: [
          { id: 'A', text: 'On-demand' },
          { id: 'B', text: 'A datacenter only' },
        ],
        correctAnswers: ['A'],
        selectedAnswers: ['A'],
        skipped: false,
      },
    ],
    ...overrides,
    // Keep questions / totals consistent if caller overrides score fields only.
    ...(overrides.questions
      ? {}
      : {
          totalQuestions: 1,
          questions: [
            {
              questionId: 1,
              topic: 'Cloud Concepts',
              stem: 'What is the cloud?',
              isMultiple: false,
              options: [
                { id: 'A', text: 'On-demand' },
                { id: 'B', text: 'A datacenter only' },
              ],
              correctAnswers: ['A'],
              selectedAnswers: ['A'],
              skipped: false,
            },
          ],
        }),
  };
}

// --- Tests ---

{
  const many = Array.from({ length: 15 }, (_, i) =>
    makeAttempt({
      examId: 'aws-clf-c02',
      startedAt: 1_000 + i,
      finishedAt: 2_000 + i,
      id: `clf-${i}`,
    }),
  );
  const trimmed = trimAttemptsPerExam(many);
  assert.equal(trimmed.length, 10);
  assert.equal(trimmed[0].finishedAt, 2_000 + 14);
}

{
  const mixed = [
    ...Array.from({ length: 12 }, (_, i) =>
      makeAttempt({
        examId: 'aws-saa-c03',
        startedAt: i,
        finishedAt: i + 1,
        id: `saa-${i}`,
      }),
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      makeAttempt({
        examId: 'aws-aif-c01',
        startedAt: i,
        finishedAt: i + 1,
        id: `aif-${i}`,
      }),
    ),
  ];
  const trimmed = trimAttemptsPerExam(mixed);
  assert.equal(
    trimmed.filter((a) => a.examId === 'aws-saa-c03').length,
    10,
  );
  assert.equal(
    trimmed.filter((a) => a.examId === 'aws-aif-c01').length,
    3,
  );
}

{
  assert.equal(isRichAttempt(makeAttempt({ mode: 'guided' })), true);
  assert.equal(isRichAttempt({ ...makeAttempt(), questions: [] }), false);
  assert.equal(isRichAttempt({ ...makeAttempt(), detailLevel: 'summary' }), false);
  assert.equal(isRichAttempt({ id: 'x' }), false);
}

{
  const bad = parseHistoryRaw('{bad');
  assert.equal(bad.ok, false);
  const wrongVersion = parseHistoryRaw(
    JSON.stringify({ schemaVersion: 2, attempts: [makeAttempt()] }),
  );
  assert.equal(wrongVersion.ok, false);
  const good = parseHistoryRaw(
    JSON.stringify({ schemaVersion: 3, attempts: [makeAttempt()] }),
  );
  assert.equal(good.ok, true);
  assert.equal(good.store.attempts.length, 1);
}

{
  const storage = createMemoryStorage();
  storage.setItem(
    HISTORY_KEY_V2,
    JSON.stringify({
      schemaVersion: 2,
      attempts: [{ id: 'thin', examId: 'aws-clf-c02', scorePercent: 80 }],
    }),
  );
  storage.setItem(HISTORY_KEY_LEGACY, '[]');
  const loaded = loadHistoryStore(storage);
  assert.equal(loaded.length, 0);
  assert.equal(storage.getItem(HISTORY_KEY_V2), null);
  assert.equal(storage.getItem(HISTORY_KEY_LEGACY), null);
}

{
  const storage = createMemoryStorage();
  storage.setItem(HISTORY_KEY_V3, '{not-json');
  const loaded = loadHistoryStore(storage);
  assert.equal(loaded.length, 0);
  assert.equal(storage.getItem(HISTORY_KEY_V3), null);
}

{
  const storage = createMemoryStorage();
  const entry = makeAttempt({ mode: 'guided' });
  storage.setItem(
    HISTORY_KEY_V3,
    JSON.stringify({ schemaVersion: 3, attempts: [entry] }),
  );
  const loaded = loadHistoryStore(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].mode, 'guided');
  assert.equal(loaded[0].questions[0].correctAnswers[0], 'A');
}

console.log('✓ history storage contract tests passed');
