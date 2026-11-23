import { useEffect, useState } from 'react';
import type { LearningContent } from '../types/learning';
import { getLearningDataPath } from '../utils/exams';

const LEGACY_LEARNING_URL = '/data/aws-learning-roadmap.json';

export function useLearningContent(examId: string | null) {
  const [content, setContent] = useState<LearningContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    if (!examId) {
      setContent(null);
      setError(null);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    const dataPath = getLearningDataPath(examId) ?? LEGACY_LEARNING_URL;
    setLoading(true);
    setError(null);

    fetch(dataPath, { cache: 'no-store' })
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
  }, [examId]);

  return {
    content,
    domains: content?.domains ?? null,
    strategy: content?.strategy ?? [],
    checklist: content?.checklist ?? [],
    phases: content?.phases ?? [],
    examCode: content?.code ?? null,
    examTitle: content?.title ?? null,
    error,
    loading,
  };
}

/** @deprecated use useLearningContent */
export function useLearningClusters() {
  const { domains, error, loading } = useLearningContent('aws-clf-saa-combined');
  return { clusters: domains, error, loading };
}
