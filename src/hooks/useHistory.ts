import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AttemptHistoryEntry } from '../types';
import {
  HISTORY_KEY_V3,
  clearHistoryStore,
  loadHistoryStore,
  nextAttemptsAfterAdd,
  nextAttemptsAfterClearExam,
  persistHistoryStore,
  summarizeAttempts,
  type PersistResult,
} from '../utils/historyStorage';
import { ensureLocalStorageConsistency } from '../utils/localStorageConsistency';

export {
  HISTORY_KEY_V3 as STORAGE_KEY,
  MAX_ATTEMPTS_PER_EXAM,
  summarizeAttempts,
  trimAttemptsPerExam,
} from '../utils/historyStorage';

export type AddAttemptResult =
  | { ok: true; trimmed: boolean }
  | { ok: false; reason: 'quota' | 'unavailable' | 'duplicate'; trimmed: boolean };

interface HistoryContextValue {
  attempts: AttemptHistoryEntry[];
  add: (entry: AttemptHistoryEntry) => AddAttemptResult;
  clear: () => AddAttemptResult;
  clearExam: (examId: string) => AddAttemptResult;
  getById: (id: string) => AttemptHistoryEntry | undefined;
  statsGlobal: {
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
  };
  statsForExam: (examId: string | null) => {
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
  };
  recentForExam: (
    examId: string | null,
    limit?: number,
  ) => AttemptHistoryEntry[];
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function toAddResult(persist: PersistResult): AddAttemptResult {
  if (persist.ok) {
    return { ok: true, trimmed: persist.trimmed };
  }
  return {
    ok: false,
    reason: persist.reason,
    trimmed: persist.trimmed,
  };
}

function persistAndMap(next: AttemptHistoryEntry[]): {
  result: AddAttemptResult;
  stored: AttemptHistoryEntry[];
} {
  const persist = persistHistoryStore(next);
  if (persist.ok) {
    // Re-read after quota trim so React state matches what landed on disk.
    const stored = loadHistoryStore();
    return {
      result: {
        ok: true,
        trimmed: persist.trimmed || stored.length < next.length,
      },
      stored,
    };
  }
  return {
    result: {
      ok: false,
      reason: persist.reason,
      trimmed: persist.trimmed,
    },
    stored: loadHistoryStore(),
  };
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [attempts, setAttempts] = useState<AttemptHistoryEntry[]>(() => {
    ensureLocalStorageConsistency();
    return loadHistoryStore();
  });

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== HISTORY_KEY_V3 && e.key !== null) return;
      setAttempts(loadHistoryStore());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((entry: AttemptHistoryEntry): AddAttemptResult => {
    // Read latest from storage first to avoid wiping if another tab wrote.
    const base = loadHistoryStore();
    const next = nextAttemptsAfterAdd(base, entry);
    if (next === null) {
      setAttempts(base);
      return { ok: false, reason: 'duplicate', trimmed: false };
    }
    const { result, stored } = persistAndMap(next);
    if (result.ok) {
      setAttempts(stored);
    } else if (result.trimmed) {
      // Partial quota trim wrote something — reload.
      setAttempts(loadHistoryStore());
    }
    return result;
  }, []);

  const clear = useCallback((): AddAttemptResult => {
    const persist = clearHistoryStore();
    setAttempts([]);
    return toAddResult(persist);
  }, []);

  const clearExam = useCallback((examId: string): AddAttemptResult => {
    const base = loadHistoryStore();
    const next = nextAttemptsAfterClearExam(base, examId);
    const { result, stored } = persistAndMap(next);
    if (result.ok || next.length === 0) {
      setAttempts(result.ok ? stored : next);
    }
    return result;
  }, []);

  const getById = useCallback(
    (id: string) => attempts.find((a) => a.id === id),
    [attempts],
  );

  const statsGlobal = useMemo(() => {
    const attemptsSorted = summarizeAttempts(attempts);
    const n = attemptsSorted.length;
    return {
      totalAttempts: n,
      avgScore:
        n > 0
          ? Math.round(
              attemptsSorted.reduce((s, h) => s + h.scorePercent, 0) / n,
            )
          : 0,
      bestScore:
        n > 0 ? Math.max(...attemptsSorted.map((h) => h.scorePercent)) : 0,
    };
  }, [attempts]);

  const statsForExam = useCallback(
    (examId: string | null) => {
      if (!examId) return statsGlobal;
      const list = summarizeAttempts(
        attempts.filter((a) => a.examId === examId),
      );
      const n = list.length;
      return {
        totalAttempts: n,
        avgScore:
          n > 0
            ? Math.round(list.reduce((s, h) => s + h.scorePercent, 0) / n)
            : 0,
        bestScore: n > 0 ? Math.max(...list.map((h) => h.scorePercent)) : 0,
      };
    },
    [attempts, statsGlobal],
  );

  const recentForExam = useCallback(
    (examId: string | null, limit = 8) => {
      const list = summarizeAttempts(
        examId ? attempts.filter((a) => a.examId === examId) : attempts,
      );
      return list.slice(0, limit);
    },
    [attempts],
  );

  const value = useMemo<HistoryContextValue>(
    () => ({
      attempts,
      add,
      clear,
      clearExam,
      getById,
      statsGlobal,
      statsForExam,
      recentForExam,
    }),
    [
      attempts,
      add,
      clear,
      clearExam,
      getById,
      statsGlobal,
      statsForExam,
      recentForExam,
    ],
  );

  return createElement(HistoryContext.Provider, { value }, children);
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return ctx;
}
