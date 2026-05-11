import { useEffect, useState } from 'react';
import type { LearningCluster } from '../types/learning';

type LearningJson = {
  schemaVersion: number;
  source?: string;
  clusters: LearningCluster[];
};

export function useLearningClusters() {
  const [clusters, setClusters] = useState<LearningCluster[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/data/aws-clf-c02-study-guide.json', { cache: 'force-cache' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load learning data (${res.status}).`);
        }
        return (await res.json()) as LearningJson;
      })
      .then((json) => {
        if (!alive) return;
        const next = Array.isArray(json.clusters) ? json.clusters : [];
        if (!next.length) {
          throw new Error('Learning data parsed as empty.');
        }
        setClusters(next);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load learning data.');
        setClusters(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { clusters, error, loading };
}

