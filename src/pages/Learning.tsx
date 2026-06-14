import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { useLearningContent } from '../hooks/useLearningClusters';
import { useLearningProgress } from '../hooks/useLearningProgress';
import type {
  ExamTag,
  LearningDomain,
  LearningService,
  Priority,
} from '../types/learning';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '../types/learning';
import { LearningChecklist } from './learning/LearningChecklist';
import { LearningClusterPills } from './learning/LearningClusterPills';
import { LearningClusterSidebar } from './learning/LearningClusterSidebar';
import {
  DomainPracticeLink,
  LearningDomainExtras,
} from './learning/LearningDomainExtras';
import { LearningOverview } from './learning/LearningOverview';
import { LearningServiceCard } from './learning/LearningServiceCard';
import { LearningStrategy } from './learning/LearningStrategy';
import {
  PriorityBadge,
  domainHasVisibleContent,
  filterDomainContent,
} from './learning/learningUtils';

type TabId = 'roadmap' | 'reference' | 'strategy' | 'checklist';
type DomainId = 'all' | string;

const TAB_KEY = 'learning-active-tab-v1';

function sectionIdForDomain(domainId: string) {
  return `domain-${domainId}`;
}

export function Learning() {
  const { domains, strategy, checklist, phases, error, loading } =
    useLearningContent();
  const progress = useLearningProgress();

  const [tab, setTab] = useState<TabId>(() => {
    const saved = localStorage.getItem(TAB_KEY);
    if (saved === 'roadmap' || saved === 'reference' || saved === 'strategy' || saved === 'checklist') {
      return saved;
    }
    return 'roadmap';
  });

  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainId>('all');
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<'all' | ExamTag>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  const [detail, setDetail] = useState<{
    domain: LearningDomain;
    service: LearningService;
  } | null>(null);

  const selectedDomainRef = useRef<DomainId>('all');
  selectedDomainRef.current = selectedDomain;

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
  }, [tab]);

  useEffect(() => {
    const saved = localStorage.getItem('learning-last-cluster');
    if (saved && saved !== 'all') setSelectedDomain(saved);
  }, []);

  useEffect(() => {
    if (selectedDomain !== 'all') {
      localStorage.setItem('learning-last-cluster', selectedDomain);
    }
  }, [selectedDomain]);

  const goToReference = useCallback((domainId?: string) => {
    setTab('reference');
    if (domainId) {
      setSelectedDomain(domainId);
      queueMicrotask(() => {
        document.getElementById(sectionIdForDomain(domainId))?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, []);

  const anyFilterActive =
    search.trim() !== '' || examFilter !== 'all' || priorityFilter !== 'all';

  const filteredDomains = useMemo(() => {
    if (!domains) return [];
    return domains
      .filter((d) => selectedDomain === 'all' || d.id === selectedDomain)
      .map((d) => {
        const filtered = filterDomainContent(d, search, examFilter, priorityFilter);
        return {
          ...filtered,
          services: [...filtered.services].sort(
            (a, b) =>
              PRIORITY_ORDER.indexOf(a.priority) -
              PRIORITY_ORDER.indexOf(b.priority),
          ),
        };
      })
      .filter(domainHasVisibleContent);
  }, [domains, search, selectedDomain, examFilter, priorityFilter]);

  const domainResultCount = (d: LearningDomain) =>
    d.services.length +
    (d.comparisons?.length ?? 0) +
    (d.callouts?.length ?? 0) +
    (d.cards?.length ?? 0);

  const totalMatches = useMemo(
    () => filteredDomains.reduce((acc, d) => acc + domainResultCount(d), 0),
    [filteredDomains],
  );

  const domainCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (anyFilterActive) {
      for (const d of domains ?? []) map.set(d.id, 0);
      for (const d of filteredDomains) map.set(d.id, domainResultCount(d));
    } else {
      for (const d of domains ?? []) map.set(d.id, d.services.length);
    }
    return map;
  }, [domains, filteredDomains, anyFilterActive]);

  useEffect(() => {
    if (!domains || tab !== 'reference') return;
    if (selectedDomainRef.current !== 'all') return;
    if (search.trim()) return;

    const els = domains
      .map((d) => document.getElementById(sectionIdForDomain(d.id)))
      .filter((x): x is HTMLElement => !!x);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          )[0];
        if (!visible?.target) return;
        const id = (visible.target as HTMLElement).dataset.domainId ?? null;
        if (id) setActiveDomain(id);
      },
      {
        root: null,
        threshold: [0.1, 0.2, 0.35, 0.5],
        rootMargin: '-15% 0px -65% 0px',
      },
    );

    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [domains, search, tab, filteredDomains]);

  const handlePickDomain = (id: DomainId) => {
    setSelectedDomain(id);
    if (id !== 'all') {
      document.getElementById(sectionIdForDomain(id))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  if (error) {
    return (
      <div className="card p-8">
        <div className="text-xs font-semibold tracking-widest text-rose-400 uppercase">
          Learning section error
        </div>
        <div className="mt-2 text-lg font-bold">Couldn&apos;t load learning resources.</div>
        <div className="mt-2 text-sm text-slate-400">{error}</div>
      </div>
    );
  }

  if (loading || !domains) {
    return (
      <div className="card p-8 text-slate-400">Loading Learning Section…</div>
    );
  }

  const allDomains = domains;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div>
          <div className="text-xs font-semibold tracking-widest text-aws-orange uppercase">
            Learning Section
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
            AWS certification study hub
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            CLF-C02 & SAA-C03 combined roadmap — services, exam traps, strategy, and
            progress tracking.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
          {(
            [
              ['roadmap', 'Roadmap'],
              ['reference', 'Service reference'],
              ['strategy', 'Exam strategy'],
              ['checklist', 'Top 50 checklist'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 min-w-[7rem] text-xs font-semibold py-2 px-3 rounded-md transition-colors ${
                tab === id
                  ? 'bg-aws-orange text-aws-darker'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'roadmap' && (
        <LearningOverview
          domains={allDomains}
          phases={phases}
          reviewedCount={progress.reviewedCount}
          checkedCount={progress.checkedCount}
          checklistTotal={checklist.length}
          onGoToReference={goToReference}
          onGoToChecklist={() => setTab('checklist')}
        />
      )}

      {tab === 'strategy' && <LearningStrategy cards={strategy} />}

      {tab === 'checklist' && (
        <LearningChecklist
          items={checklist}
          checkedCount={progress.checkedCount}
          isChecked={progress.isChecklistChecked}
          onToggle={progress.toggleChecklistItem}
        />
      )}

      {tab === 'reference' && (
        <>
          <div className="card p-4 md:p-5 space-y-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services, exam topics, or tips…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-aws-orange"
            />

            <div className="flex flex-wrap gap-3">
              <FilterSelect
                label="Exam"
                value={examFilter}
                onChange={(v) => setExamFilter(v as 'all' | ExamTag)}
                options={[
                  ['all', 'Both exams'],
                  ['CLF-C02', 'CLF-C02'],
                  ['SAA-C03', 'SAA-C03'],
                ]}
              />
              <FilterSelect
                label="Priority"
                value={priorityFilter}
                onChange={(v) => setPriorityFilter(v as 'all' | Priority)}
                options={[
                  ['all', 'All priorities'],
                  ...PRIORITY_ORDER.map((p) => [p, PRIORITY_LABELS[p]] as const),
                ]}
              />
            </div>

            <LearningClusterPills
              clusters={allDomains}
              selectedCluster={selectedDomain}
              clusterCounts={domainCounts}
              onPickCluster={handlePickDomain}
            />
          </div>

          <div className="text-sm text-slate-500">
            {anyFilterActive ? (
              <span>
                <span className="text-slate-200 font-semibold">{totalMatches}</span>{' '}
                results match filters
              </span>
            ) : (
              <span className="text-slate-400">
                {allDomains.length} domains ·{' '}
                {allDomains.reduce((n, d) => n + d.services.length, 0)} services
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <LearningClusterSidebar
              clusters={allDomains.map((d) => ({
                id: d.id,
                name: d.name,
                color: d.color,
                servicesCount: d.services.length,
              }))}
              selectedCluster={selectedDomain}
              activeCluster={search.trim() ? null : activeDomain}
              clusterCounts={domainCounts}
              onPickCluster={handlePickDomain}
              reviewedDomains={progress.reviewedDomains}
            />

            <section className="md:col-span-8 lg:col-span-9 space-y-10">
              {filteredDomains.length === 0 && (
                <div className="card p-10 text-center text-slate-400">
                  No services match your current search and filters.
                </div>
              )}

              {filteredDomains.map((domain) => (
                <div
                  key={domain.id}
                  id={sectionIdForDomain(domain.id)}
                  data-domain-id={domain.id}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {domain.icon && (
                      <span className="text-xl" aria-hidden>
                        {domain.icon}
                      </span>
                    )}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: domain.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold">{domain.name}</h2>
                      {domain.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{domain.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => progress.toggleDomainReviewed(domain.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        progress.isDomainReviewed(domain.id)
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {progress.isDomainReviewed(domain.id)
                        ? '✓ Reviewed'
                        : 'Mark reviewed'}
                    </button>
                    <DomainPracticeLink domainId={domain.id} />
                    <span className="text-xs text-slate-500 w-full sm:w-auto sm:ml-0 ml-auto">
                      {domain.services.length} service
                      {domain.services.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {domain.services.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {domain.services.map((service) => (
                        <LearningServiceCard
                          key={service.name}
                          cluster={domain}
                          service={service}
                          onOpen={() => setDetail({ domain, service })}
                        />
                      ))}
                    </div>
                  )}

                  <LearningDomainExtras
                    comparisons={domain.comparisons}
                    callouts={domain.callouts}
                    cards={domain.cards}
                  />
                </div>
              ))}
            </section>
          </div>
        </>
      )}

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
                  background: `${detail.domain.color}22`,
                  color: detail.domain.color,
                  border: `1px solid ${detail.domain.color}55`,
                }}
              >
                {detail.domain.name}
              </span>
              <PriorityBadge priority={detail.service.priority} />
            </div>

            <p className="text-slate-300 leading-relaxed">{detail.service.desc}</p>

            {detail.service.examTopics.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Key exam topics
                </div>
                <ul className="space-y-2 text-sm text-slate-200 list-disc list-inside max-h-64 overflow-y-auto">
                  {detail.service.examTopics.map((t) => (
                    <li key={t.slice(0, 50)}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {detail.service.uses && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Real-world use cases
                </div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {detail.service.uses.map((u) => (
                    <li key={u} className="flex gap-2">
                      <span style={{ color: detail.domain.color }}>→</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.service.tip && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-100">
                <div className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                  Exam tip
                </div>
                <div className="mt-2 text-sm leading-relaxed">{detail.service.tip}</div>
              </div>
            )}

            <DomainPracticeLink domainId={detail.domain.id} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="text-xs text-slate-500 font-semibold flex items-center gap-2">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-aws-orange"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
