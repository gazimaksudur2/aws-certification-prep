import type {
  AttemptHistoryEntry,
  AttemptQuestionSnapshot,
  HistoryStoreV3,
  QuizMode,
  SubmissionReason,
} from '../types';

export const HISTORY_KEY_V3 = 'cert-quiz-history-v3';
export const HISTORY_KEY_V2 = 'cert-quiz-history-v2';
export const HISTORY_KEY_LEGACY = 'aws-quiz-history';

/** Keep only the N most recent finished attempts per certification (`examId`). */
export const MAX_ATTEMPTS_PER_EXAM = 10;

const SUBMISSION_REASONS: ReadonlySet<string> = new Set([
  'manual',
  'time_expired',
]);
const QUIZ_MODES: ReadonlySet<string> = new Set(['timed', 'guided']);

export type PersistResult =
  | { ok: true; trimmed: boolean }
  | { ok: false; reason: 'quota' | 'unavailable'; trimmed: boolean };

export function summarizeAttempts(
  entries: AttemptHistoryEntry[],
): AttemptHistoryEntry[] {
  return [...entries].sort((a, b) => b.finishedAt - a.finishedAt);
}

export function trimAttemptsPerExam(
  entries: AttemptHistoryEntry[],
  maxPerExam = MAX_ATTEMPTS_PER_EXAM,
): AttemptHistoryEntry[] {
  const byExamId = new Map<string, AttemptHistoryEntry[]>();
  for (const e of entries) {
    const bucket = byExamId.get(e.examId) ?? [];
    bucket.push(e);
    byExamId.set(e.examId, bucket);
  }
  const kept: AttemptHistoryEntry[] = [];
  for (const list of byExamId.values()) {
    kept.push(...summarizeAttempts(list).slice(0, maxPerExam));
  }
  return summarizeAttempts(kept);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

export function isAttemptQuestionSnapshot(
  x: unknown,
): x is AttemptQuestionSnapshot {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (!isFiniteNumber(o.questionId)) return false;
  if (!isNonEmptyString(o.topic)) return false;
  if (typeof o.stem !== 'string') return false;
  if (typeof o.isMultiple !== 'boolean') return false;
  if (!Array.isArray(o.options)) return false;
  for (const opt of o.options) {
    if (opt === null || typeof opt !== 'object') return false;
    const op = opt as Record<string, unknown>;
    if (!isNonEmptyString(op.id) || typeof op.text !== 'string') return false;
    if (op.rationale !== undefined && typeof op.rationale !== 'string') {
      return false;
    }
  }
  if (!isStringArray(o.correctAnswers)) return false;
  if (!isStringArray(o.selectedAnswers)) return false;
  if (typeof o.skipped !== 'boolean') return false;
  return true;
}

export function isRichAttempt(x: unknown): x is AttemptHistoryEntry {
  if (x === null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return false;
  if (!isNonEmptyString(o.examId)) return false;
  if (!isNonEmptyString(o.examCode)) return false;
  if (!isNonEmptyString(o.examTitle)) return false;
  if (!isFiniteNumber(o.startedAt)) return false;
  if (!isFiniteNumber(o.finishedAt)) return false;
  if (!isFiniteNumber(o.timeLimitSeconds)) return false;
  if (
    typeof o.submittedReason !== 'string' ||
    !SUBMISSION_REASONS.has(o.submittedReason)
  ) {
    return false;
  }
  if (!isFiniteNumber(o.totalQuestions)) return false;
  if (!isFiniteNumber(o.correctCount)) return false;
  if (!isFiniteNumber(o.scorePercent)) return false;
  if (!isFiniteNumber(o.durationSeconds)) return false;
  if (typeof o.mode !== 'string' || !QUIZ_MODES.has(o.mode)) return false;
  if (!isFiniteNumber(o.passThresholdPercent)) return false;
  if (o.detailLevel !== 'full') return false;
  if (!Array.isArray(o.questions)) return false;
  if (o.questions.length === 0) return false;
  if (!o.questions.every(isAttemptQuestionSnapshot)) return false;
  if (o.questions.length !== o.totalQuestions) return false;
  return true;
}

export function sanitizeStore(store: HistoryStoreV3): HistoryStoreV3 {
  const valid = store.attempts.filter(isRichAttempt);
  return {
    schemaVersion: 3,
    attempts: trimAttemptsPerExam(valid),
  };
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // privacy / blocked storage
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export type ParseHistoryResult =
  | { ok: true; store: HistoryStoreV3 }
  | { ok: false; reason: string };

/**
 * Parse + validate a raw v3 history string.
 * Does not mutate storage — callers decide whether to remove invalid keys.
 */
export function parseHistoryRaw(raw: string | null): ParseHistoryResult {
  if (raw === null || raw === '') {
    return { ok: false, reason: 'empty' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'not-object' };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.schemaVersion !== 3) {
    return { ok: false, reason: 'wrong-schema-version' };
  }
  if (!Array.isArray(obj.attempts)) {
    return { ok: false, reason: 'missing-attempts' };
  }
  const sanitized = sanitizeStore({
    schemaVersion: 3,
    attempts: obj.attempts as AttemptHistoryEntry[],
  });
  return { ok: true, store: sanitized };
}

function writeEnvelope(
  store: HistoryStoreV3,
): { ok: true } | { ok: false; reason: 'quota' | 'unavailable' } {
  try {
    localStorage.setItem(HISTORY_KEY_V3, JSON.stringify(store));
    return { ok: true };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        // Safari sometimes uses code 22
        err.code === 22);
    return {
      ok: false,
      reason: isQuota ? 'quota' : 'unavailable',
    };
  }
}

/**
 * Persist a v3 store. On QuotaExceeded, drop oldest attempts across exams
 * until the write succeeds (or nothing left).
 */
export function persistHistoryStore(
  attempts: AttemptHistoryEntry[],
): PersistResult {
  let working = trimAttemptsPerExam(attempts);
  let trimmedForQuota = false;

  for (;;) {
    const store: HistoryStoreV3 = { schemaVersion: 3, attempts: working };
    const result = writeEnvelope(store);
    if (result.ok) {
      return { ok: true, trimmed: trimmedForQuota };
    }
    if (result.reason !== 'quota' || working.length === 0) {
      return {
        ok: false,
        reason: result.reason,
        trimmed: trimmedForQuota,
      };
    }
    // Drop the single oldest attempt globally and retry.
    const sorted = summarizeAttempts(working);
    working = sorted.slice(0, -1);
    trimmedForQuota = true;
  }
}

/**
 * Load rich history. Clears thin v2 / legacy keys on upgrade.
 * Invalid v3 payloads are removed so the key cannot poison future loads.
 */
export function loadHistoryStore(): AttemptHistoryEntry[] {
  // Thin v2 / legacy: clear on upgrade — do not keep listable thin rows.
  if (safeGet(HISTORY_KEY_V2) !== null) {
    removeKey(HISTORY_KEY_V2);
  }
  if (safeGet(HISTORY_KEY_LEGACY) !== null) {
    removeKey(HISTORY_KEY_LEGACY);
  }

  const raw = safeGet(HISTORY_KEY_V3);
  if (raw === null) {
    return [];
  }

  const parsed = parseHistoryRaw(raw);
  if (!parsed.ok) {
    removeKey(HISTORY_KEY_V3);
    return [];
  }

  // Re-persist if sanitization dropped invalid attempts or reordered/trimmed.
  try {
    const current = JSON.parse(raw) as HistoryStoreV3;
    const before = Array.isArray(current.attempts) ? current.attempts.length : -1;
    if (
      before !== parsed.store.attempts.length ||
      current.schemaVersion !== 3
    ) {
      persistHistoryStore(parsed.store.attempts);
    }
  } catch {
    persistHistoryStore(parsed.store.attempts);
  }

  return parsed.store.attempts;
}

export function clearHistoryStore(): PersistResult {
  removeKey(HISTORY_KEY_V2);
  removeKey(HISTORY_KEY_LEGACY);
  return persistHistoryStore([]);
}

export function isDuplicateAttempt(
  existing: AttemptHistoryEntry[],
  entry: AttemptHistoryEntry,
): boolean {
  return existing.some(
    (h) =>
      h.examId === entry.examId &&
      h.startedAt === entry.startedAt &&
      h.finishedAt === entry.finishedAt,
  );
}

/** Build the next attempts list after adding one entry (no I/O). */
export function nextAttemptsAfterAdd(
  prev: AttemptHistoryEntry[],
  entry: AttemptHistoryEntry,
): AttemptHistoryEntry[] | null {
  if (isDuplicateAttempt(prev, entry)) return null;
  return trimAttemptsPerExam(summarizeAttempts([entry, ...prev]));
}

export function nextAttemptsAfterClearExam(
  prev: AttemptHistoryEntry[],
  examId: string,
): AttemptHistoryEntry[] {
  return trimAttemptsPerExam(
    summarizeAttempts(prev.filter((a) => a.examId !== examId)),
  );
}

export type ModeLabel = QuizMode;

export function attemptHasReviewDetail(entry: AttemptHistoryEntry): boolean {
  return (
    entry.detailLevel === 'full' &&
    Array.isArray(entry.questions) &&
    entry.questions.length > 0
  );
}

/**
 * Type helpers re-exported for callers building snapshots.
 */
export type { AttemptHistoryEntry, SubmissionReason };
