import { useCallback, useEffect, useState } from 'react';

const DOMAINS_KEY = 'learning-domains-reviewed-v1';
const CHECKLIST_KEY = 'learning-checklist-v1';

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function persistSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // quota / privacy mode
  }
}

export function useLearningProgress() {
  const [reviewedDomains, setReviewedDomains] = useState<Set<string>>(() =>
    loadSet(DOMAINS_KEY),
  );
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() =>
    loadSet(CHECKLIST_KEY),
  );

  useEffect(() => {
    persistSet(DOMAINS_KEY, reviewedDomains);
  }, [reviewedDomains]);

  useEffect(() => {
    persistSet(CHECKLIST_KEY, checkedItems);
  }, [checkedItems]);

  const toggleDomainReviewed = useCallback((domainId: string) => {
    setReviewedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

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
    toggleDomainReviewed,
    toggleChecklistItem,
    isDomainReviewed,
    isChecklistChecked,
  };
}
