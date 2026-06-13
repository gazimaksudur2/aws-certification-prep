import { useEffect, useState } from 'react';
import type { LearningContent } from '../types/learning';

const LEARNING_JSON_URL = '/data/aws-learning-roadmap.json';

export function useLearningContent() {
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(LEARNING_JSON_URL, { cache: 'force-cache' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load learning content (${res.status}).`);
        }
        return (await res.json()) as LearningContent;
      })
      .then((json) => {
        if (!alive) return;
        if (!json.domains?.length) {
          throw new Error('Learning content parsed as empty.');
        }
        setContent(json);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load learning content.');
        setContent(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return {
    content,
    domains: content?.domains ?? null,
    strategy: content?.strategy ?? [],
    checklist: content?.checklist ?? [],
    phases: content?.phases ?? [],
    error,
    loading,
  };
}

/** @deprecated use useLearningContent */
export function useLearningClusters() {
  const { domains, error, loading } = useLearningContent();
  return { clusters: domains, error, loading };
}
