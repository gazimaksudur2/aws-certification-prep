import { listCatalog } from './exams';
import { loadHistoryStore } from './historyStorage';

const PROGRESS_KEY = 'learning-progress-v2';
const LEGACY_DOMAINS_KEY = 'learning-domains-reviewed-v1';
const LEGACY_CHECKLIST_KEY = 'learning-checklist-v1';
const LEGACY_TAB_KEY = 'learning-active-tab-v1';
const LAST_EXAM_KEY = 'learning-last-exam-v1';

const VALID_TABS = new Set([
  'roadmap',
  'reference',
  'strategy',
  'checklist',
]);

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function validateLearningProgress(): void {
  const raw = safeGet(PROGRESS_KEY);
  if (raw === null) return;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      safeRemove(PROGRESS_KEY);
      return;
    }
    const obj = parsed as Record<string, unknown>;
    if (obj.schemaVersion !== 2 || typeof obj.byExam !== 'object' || obj.byExam === null) {
      safeRemove(PROGRESS_KEY);
      return;
    }
    // Soft-check each exam entry; drop poison exam buckets.
    const byExam = obj.byExam as Record<string, unknown>;
    let mutated = false;
    for (const [examId, value] of Object.entries(byExam)) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        delete byExam[examId];
        mutated = true;
        continue;
      }
      const ep = value as Record<string, unknown>;
      if (!isStringArray(ep.reviewedDomains) || !isStringArray(ep.checklist)) {
        delete byExam[examId];
        mutated = true;
        continue;
      }
      if (
        ep.activeTab !== undefined &&
        (typeof ep.activeTab !== 'string' || !VALID_TABS.has(ep.activeTab))
      ) {
        delete ep.activeTab;
        mutated = true;
      }
    }
    if (mutated) {
      try {
        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({ schemaVersion: 2, byExam }),
        );
      } catch {
        safeRemove(PROGRESS_KEY);
      }
    }
  } catch {
    safeRemove(PROGRESS_KEY);
  }
}

function validateLegacyLearningKeys(): void {
  for (const key of [LEGACY_DOMAINS_KEY, LEGACY_CHECKLIST_KEY]) {
    const raw = safeGet(key);
    if (raw === null) continue;
    try {
      const parsed = JSON.parse(raw);
      if (!isStringArray(parsed)) {
        safeRemove(key);
      }
    } catch {
      safeRemove(key);
    }
  }

  const tab = safeGet(LEGACY_TAB_KEY);
  if (tab !== null && !VALID_TABS.has(tab)) {
    safeRemove(LEGACY_TAB_KEY);
  }
}

function validateLastExamKey(): void {
  const raw = safeGet(LAST_EXAM_KEY);
  if (raw === null) return;
  const known = new Set(listCatalog().map((e) => e.examId));
  if (!known.has(raw)) {
    safeRemove(LAST_EXAM_KEY);
  }
}

/**
 * Boot sweep: history load (clears thin v2 / invalid v3) + learning key self-heal.
 * Safe to call once at app start.
 */
export function ensureLocalStorageConsistency(): void {
  // History load removes invalid / thin keys as a side effect.
  loadHistoryStore();
  validateLearningProgress();
  validateLegacyLearningKeys();
  validateLastExamKey();
}
