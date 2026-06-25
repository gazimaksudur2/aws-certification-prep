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
import {
  Search,
  Filter,
  BookOpen,
  MapPin,
  Target,
  CheckCircle2,
  Sparkles,
  Layers,
  TrendingUp,
  X,
} from 'lucide-react';

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
      for (const d of domains ?? []) map.set(d.id, domainResultCount(d));
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

  const clearFilters = () => {
    setSearch('');
    setExamFilter('all');
    setPriorityFilter('all');
  };

  if (error) {
    return (
      <div className="card p-8 border-rose-500/20 bg-rose-500/5 animate-fadeIn">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-2 rounded-lg bg-rose-500/10">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest text-rose-400 uppercase">
              Learning section error
            </div>
            <div className="mt-1 text-lg font-bold text-white">Couldn't load learning resources.</div>
            <div className="mt-1 text-sm text-slate-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !domains) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fadeIn">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-aws-orange/20 border-t-aws-orange rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Loading learning content…</p>
        </div>
      </div>
    );
  }

  const allDomains = domains;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-slate-700/50 shadow-xl animate-slideUp">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/5 via-transparent to-aws-blue/5" />
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-aws-orange/5 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aws-orange/10 border border-aws-orange/20 text-aws-orange text-xs font-semibold tracking-wider uppercase">
              <BookOpen className="w-3 h-3" />
              Learning Section
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
              AWS certification study hub
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              CLF-C02 & SAA-C03 combined roadmap — services, exam traps, strategy, and
              progress tracking.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Target className="w-4 h-4 text-aws-orange" />
              <span className="text-xs text-slate-300">
                {progress.checkedCount} / {checklist.length} checked
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mt-6 flex flex-wrap gap-1 bg-slate-900/50 border border-slate-700/50 rounded-lg p-1">
          {(
            [
              ['roadmap', 'Roadmap', MapPin],
              ['reference', 'Service reference', Layers],
              ['strategy', 'Exam strategy', Target],
              ['checklist', 'Top 50 checklist', CheckCircle2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 min-w-[7rem] flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-md transition-all ${
                tab === id
                  ? 'bg-gradient-to-r from-aws-orange to-aws-orange/90 text-white shadow-lg shadow-aws-orange/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      <div className="animate-slideUp">
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
            {/* Search and Filters */}
            <div className="card p-4 md:p-6 space-y-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services, exam topics, or tips…"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors placeholder:text-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />
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
                {(examFilter !== 'all' || priorityFilter !== 'all' || search) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>

              <LearningClusterPills
                clusters={allDomains}
                selectedCluster={selectedDomain}
                clusterCounts={domainCounts}
                onPickCluster={handlePickDomain}
              />
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-400">
                {anyFilterActive ? (
                  <span>
                    <span className="text-slate-200 font-semibold">{totalMatches}</span>{' '}
                    results match filters
                  </span>
                ) : (
                  <span>
                    {allDomains.length} domains ·{' '}
                    {allDomains.reduce((n, d) => n + d.services.length, 0)} services
                  </span>
                )}
              </div>
              {anyFilterActive && totalMatches === 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-aws-orange hover:text-aws-orange/80 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Main Content */}
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

              <section className="md:col-span-8 lg:col-span-9 space-y-8">
                {filteredDomains.length === 0 && (
                  <div className="card p-12 text-center border-slate-700/50 bg-gradient-to-br from-slate-800/20 to-slate-900/20">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-slate-200">No results found</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Try adjusting your search or filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 btn-secondary text-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}

                {filteredDomains.map((domain, index) => (
                  <div
                    key={domain.id}
                    id={sectionIdForDomain(domain.id)}
                    data-domain-id={domain.id}
                    className="space-y-4 animate-slideUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">
                      {domain.icon && (
                        <span className="text-2xl" aria-hidden>
                          {domain.icon}
                        </span>
                      )}
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: domain.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          {domain.name}
                          <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            {domain.services.length} services
                          </span>
                        </h2>
                        {domain.subtitle && (
                          <p className="text-xs text-slate-400 mt-0.5">{domain.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => progress.toggleDomainReviewed(domain.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            progress.isDomainReviewed(domain.id)
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                          }`}
                        >
                          {progress.isDomainReviewed(domain.id) ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Reviewed
                            </>
                          ) : (
                            'Mark reviewed'
                          )}
                        </button>
                        <DomainPracticeLink domainId={domain.id} />
                      </div>
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
      </div>

      {/* Service Detail Modal */}
<Modal
  open={!!detail}
  title={detail ? detail.service.name : undefined}
  onClose={() => setDetail(null)}
>
  {detail && (
    <div className="space-y-6 animate-slideUp">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5"
          style={{
            background: `${detail.domain.color}22`,
            color: detail.domain.color,
            border: `1px solid ${detail.domain.color}44`,
          }}
        >
          <span className="text-base">{detail.domain.icon}</span>
          {detail.domain.name}
        </span>
        <PriorityBadge priority={detail.service.priority} />
      </div>

      <p className="text-slate-300 leading-relaxed text-lg">
        {detail.service.desc}
      </p>

      {detail.service.uses && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Real-world use cases
          </div>
          <ul className="space-y-2 text-sm text-slate-200">
            {detail.service.uses.map((u) => (
              <li key={u} className="flex gap-2 items-start">
                <span style={{ color: detail.domain.color }} className="mt-0.5">▸</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.service.examTopics.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
            <Target className="w-3 h-3" />
            Key exam topics
          </div>
          <ul className="space-y-2 text-sm text-slate-200">
            {detail.service.examTopics.map((t, idx) => (
              <li key={idx} className="flex gap-2 items-start">
                <span className="text-aws-orange mt-0.5">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.service.tip && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                Exam tip
              </div>
              <div className="mt-1 text-sm text-amber-100 leading-relaxed">
                {detail.service.tip}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-700/50 flex justify-end">
        <DomainPracticeLink domainId={detail.domain.id} />
      </div>
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
    <label className="text-xs text-slate-400 font-medium flex items-center gap-2">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors min-w-[120px]"
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