import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import type { LearningCluster, LearningService } from '../types/learning';
import { useLearningClusters } from '../hooks/useLearningClusters';
import { LearningClusterPills } from './learning/LearningClusterPills';
import { LearningClusterSidebar } from './learning/LearningClusterSidebar';
import { LearningServiceCard } from './learning/LearningServiceCard';

type ClusterId = 'all' | string;

function serviceMatches(service: LearningService, q: string): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    service.name,
    service.desc,
    service.uses[0],
    service.uses[1],
    service.tip ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(term);
}

function sectionIdForCluster(clusterId: string) {
  return `cluster-${clusterId}`;
}

export function Learning() {
  const { clusters, error, loading } = useLearningClusters();
  const [search, setSearch] = useState('');

  const [selectedCluster, setSelectedCluster] = useState<ClusterId>('all');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  const [detail, setDetail] = useState<{
    cluster: LearningCluster;
    service: LearningService;
  } | null>(null);

  const selectedClusterRef = useRef<ClusterId>('all');
  selectedClusterRef.current = selectedCluster;

  // Optional: remember selected cluster
  useEffect(() => {
    const saved = localStorage.getItem('learning-last-cluster');
    if (saved) setSelectedCluster(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('learning-last-cluster', selectedCluster);
  }, [selectedCluster]);

  const filteredClusters = useMemo(() => {
    if (!clusters) return [];

    const term = search.trim();
    return clusters
      .filter((c) => selectedCluster === 'all' || c.id === selectedCluster)
      .map((c) => ({
        ...c,
        services: c.services.filter((s) => serviceMatches(s, term)),
      }))
      .filter((c) => c.services.length > 0);
  }, [clusters, search, selectedCluster]);

  const totalMatches = useMemo(() => {
    return filteredClusters.reduce((acc, c) => acc + c.services.length, 0);
  }, [filteredClusters]);

  const clusterCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of clusters ?? []) map.set(c.id, c.services.length);
    return map;
  }, [clusters]);

  // Scroll-spy (only when not filtered to a single cluster and search is empty)
  useEffect(() => {
    if (!clusters) return;
    if (selectedClusterRef.current !== 'all') return;
    if (search.trim()) return;

    const els = clusters
      .map((c) => document.getElementById(sectionIdForCluster(c.id)))
      .filter((x): x is HTMLElement => !!x);

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target) return;
        const id = (visible.target as HTMLElement).dataset.clusterId ?? null;
        if (id) setActiveCluster(id);
      },
      {
        root: null,
        threshold: [0.1, 0.2, 0.35, 0.5, 0.75],
        rootMargin: '-20% 0px -70% 0px',
      },
    );

    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [clusters, search]);

  const allClusters = clusters ?? [];

  const handlePickCluster = (id: ClusterId) => {
    setSelectedCluster(id);
    if (id !== 'all') {
      const el = document.getElementById(sectionIdForCluster(id));
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (error) {
    return (
      <div className="card p-8">
        <div className="text-xs font-semibold tracking-widest text-rose-400 uppercase">
          Learning section error
        </div>
        <div className="mt-2 text-lg font-bold">Couldn’t load learning resources.</div>
        <div className="mt-2 text-sm text-slate-400">{error}</div>
      </div>
    );
  }

  if (loading || !clusters) {
    return (
      <div className="card p-8 text-slate-400">
        Loading Learning Section…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <div className="text-xs font-semibold tracking-widest text-aws-orange uppercase">
            Learning Section
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
            AWS service reference (CLF-C02)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search services, skim real-world use cases, and open exam tips on demand.
          </p>
        </div>

        <div className="card p-4 md:p-5 space-y-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services, use cases, or exam tips…"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-aws-orange"
          />

          <LearningClusterPills
            clusters={allClusters}
            selectedCluster={selectedCluster}
            clusterCounts={clusterCounts}
            onPickCluster={handlePickCluster}
          />
        </div>

        <div className="text-sm text-slate-500">
          {search.trim() ? (
            <span>
              <span className="text-slate-200 font-semibold">{totalMatches}</span>{' '}
              services match your search
            </span>
          ) : (
            <span className="text-slate-400">
              {allClusters.length} clusters ·{' '}
              {allClusters.reduce((acc, c) => acc + c.services.length, 0)} services
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <LearningClusterSidebar
          clusters={allClusters.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            servicesCount: c.services.length,
          }))}
          selectedCluster={selectedCluster}
          activeCluster={search.trim() ? null : activeCluster}
          clusterCounts={clusterCounts}
          onPickCluster={handlePickCluster}
        />

        {/* Main content */}
        <section className="md:col-span-8 lg:col-span-9 space-y-8">
          {filteredClusters.length === 0 && (
            <div className="card p-10 text-center text-slate-400">
              No services match your current search and filters.
            </div>
          )}

          {filteredClusters.map((cluster) => (
            <div
              key={cluster.id}
              id={sectionIdForCluster(cluster.id)}
              data-cluster-id={cluster.id}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: cluster.color }}
                />
                <h2 className="text-lg font-bold">{cluster.name}</h2>
                <span className="text-xs text-slate-500 ml-auto">
                  {cluster.services.length} service{cluster.services.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cluster.services.map((service) => (
                  <LearningServiceCard
                    key={service.name}
                    cluster={cluster}
                    service={service}
                    onOpen={() => setDetail({ cluster, service })}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <Modal
        open={!!detail}
        title={detail ? detail.service.name : undefined}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: `${detail.cluster.color}22`,
                  color: detail.cluster.color,
                  border: `1px solid ${detail.cluster.color}55`,
                }}
              >
                {detail.cluster.name}
              </span>
              {detail.service.exam && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">
                  ★ Exam critical
                </span>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">{detail.service.desc}</p>

            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Real-world use cases
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                <li className="flex gap-2">
                  <span style={{ color: detail.cluster.color }}>→</span>
                  <span className="flex-1">{detail.service.uses[0]}</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: detail.cluster.color }}>→</span>
                  <span className="flex-1">{detail.service.uses[1]}</span>
                </li>
              </ul>
            </div>

            {detail.service.tip && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-100">
                <div className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                  Exam tip
                </div>
                <div className="mt-2 text-sm leading-relaxed">{detail.service.tip}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
