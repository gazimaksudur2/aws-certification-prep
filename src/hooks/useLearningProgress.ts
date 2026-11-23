import { useCallback, useEffect, useMemo, useState } from 'react';

const LEGACY_DOMAINS_KEY = 'learning-domains-reviewed-v1';
const LEGACY_CHECKLIST_KEY = 'learning-checklist-v1';
const LEGACY_TAB_KEY = 'learning-active-tab-v1';
const PROGRESS_KEY = 'learning-progress-v2';
const COMBINED_PACK_ID = 'aws-clf-saa-combined';

export type LearningTabId = 'roadmap' | 'reference' | 'strategy' | 'checklist';

interface ExamProgress {
  reviewedDomains: string[];
  checklist: string[];
  activeTab?: LearningTabId;
}

interface ProgressStoreV2 {
  schemaVersion: 2;
  byExam: Record<string, ExamProgress>;
}

function loadSetFromLegacy(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function isTabId(v: unknown): v is LearningTabId {
  return (
    v === 'roadmap' || v === 'reference' || v === 'strategy' || v === 'checklist'
  );
}

function migrateLegacyIfNeeded(store: ProgressStoreV2): ProgressStoreV2 {
  if (store.byExam[COMBINED_PACK_ID]) return store;

  const reviewed = loadSetFromLegacy(LEGACY_DOMAINS_KEY);
  const checklist = loadSetFromLegacy(LEGACY_CHECKLIST_KEY);
  const tabRaw = localStorage.getItem(LEGACY_TAB_KEY);
  const activeTab = isTabId(tabRaw) ? tabRaw : undefined;

  if (!reviewed.length && !checklist.length && !activeTab) return store;

  return {
    ...store,
    byExam: {
      ...store.byExam,
      [COMBINED_PACK_ID]: {
        reviewedDomains: reviewed,
        checklist,
        activeTab,
      },
    },
  };
}

function loadStore(): ProgressStoreV2 {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressStoreV2;
      if (parsed?.schemaVersion === 2 && parsed.byExam && typeof parsed.byExam === 'object') {
        return migrateLegacyIfNeeded(parsed);
      }
    }
  } catch {
    // fall through
  }

  return migrateLegacyIfNeeded({ schemaVersion: 2, byExam: {} });
}

function persistStore(store: ProgressStoreV2) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {
    // quota / privacy mode
  }
}

function emptyProgress(): ExamProgress {
  return { reviewedDomains: [], checklist: [] };
}

export function useLearningProgress(examId: string | null) {
  const [store, setStore] = useState<ProgressStoreV2>(() => loadStore());

  useEffect(() => {
    persistStore(store);
  }, [store]);

  const examProgress = useMemo(() => {
    if (!examId) return emptyProgress();
    return store.byExam[examId] ?? emptyProgress();
  }, [store, examId]);

  const reviewedDomains = useMemo(
    () => new Set(examProgress.reviewedDomains),
    [examProgress.reviewedDomains],
  );
  const checkedItems = useMemo(
    () => new Set(examProgress.checklist),
    [examProgress.checklist],
  );

  const updateExam = useCallback(
    (mutator: (prev: ExamProgress) => ExamProgress) => {
      if (!examId) return;
      setStore((prev) => {
        const current = prev.byExam[examId] ?? emptyProgress();
        return {
          ...prev,
          byExam: {
            ...prev.byExam,
            [examId]: mutator(current),
          },
        };
      });
    },
    [examId],
  );

  const toggleDomainReviewed = useCallback(
    (domainId: string) => {
      updateExam((prev) => {
        const set = new Set(prev.reviewedDomains);
        if (set.has(domainId)) set.delete(domainId);
        else set.add(domainId);
        return { ...prev, reviewedDomains: [...set] };
      });
    },
    [updateExam],
  );

  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      updateExam((prev) => {
        const set = new Set(prev.checklist);
        if (set.has(itemId)) set.delete(itemId);
        else set.add(itemId);
        return { ...prev, checklist: [...set] };
      });
    },
    [updateExam],
  );

  const setActiveTab = useCallback(
    (tab: LearningTabId) => {
      updateExam((prev) => ({ ...prev, activeTab: tab }));
    },
    [updateExam],
  );

  const isDomainReviewed = useCallback(
    (domainId: string) => reviewedDomains.has(domainId),
    [reviewedDomains],
  );

  const isChecklistChecked = useCallback(
    (itemId: string) => checkedItems.has(itemId),
    [checkedItems],
  );

  return {
    reviewedDomains,
    checkedItems,
    reviewedCount: reviewedDomains.size,
    checkedCount: checkedItems.size,
    activeTab: examProgress.activeTab,
    toggleDomainReviewed,
    toggleChecklistItem,
    setActiveTab,
    isDomainReviewed,
    isChecklistChecked,
  };
}
