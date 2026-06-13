import type { LearningDomain, Priority, StudyPhase } from '../../types/learning';
import { PRIORITY_LABELS } from '../../types/learning';

export function LearningOverview({
  domains,
  phases,
  reviewedCount,
  checkedCount,
  checklistTotal,
  onGoToReference,
  onGoToChecklist,
}: {
  domains: LearningDomain[];
  phases: StudyPhase[];
  reviewedCount: number;
  checkedCount: number;
  checklistTotal: number;
  onGoToReference: (domainId?: string) => void;
  onGoToChecklist: () => void;
}) {
  const totalServices = domains.reduce((n, d) => n + d.services.length, 0);
  const domainPct =
    domains.length > 0 ? Math.round((reviewedCount / domains.length) * 100) : 0;
  const checklistPct =
    checklistTotal > 0 ? Math.round((checkedCount / checklistTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/10 via-transparent to-aws-blue/10 pointer-events-none" />
        <div className="relative">
          <div className="text-xs font-semibold tracking-widest text-aws-orange uppercase">
            CLF-C02 & SAA-C03 · Master roadmap
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-extrabold">
            Learn services. Master exam traps. Track progress.
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Combined study guide covering {domains.length} domains, {totalServices}+
            services, comparisons, exam traps, and a Top-50 checklist — both
            certifications in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <StatPill label="Domains" value={String(domains.length)} />
            <StatPill label="Services" value={`${totalServices}+`} />
            <StatPill label="Checklist" value={String(checklistTotal)} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProgressRing
          label="Domains reviewed"
          value={reviewedCount}
          total={domains.length}
          pct={domainPct}
          onClick={() => onGoToReference()}
        />
        <ProgressRing
          label="Checklist mastered"
          value={checkedCount}
          total={checklistTotal}
          pct={checklistPct}
          onClick={onGoToChecklist}
        />
      </section>

      <section className="card p-5 md:p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
          Priority legend
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <span
              key={p}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-700 bg-slate-900/60 text-slate-300"
            >
              <span className="font-semibold text-slate-100">{PRIORITY_LABELS[p]}</span>
              {p === 'critical' && ' — nearly every exam'}
              {p === 'very-high' && ' — 2–3 questions'}
              {p === 'high' && ' — commonly tested'}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold">4-week study plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((phase) => (
            <div key={phase.week} className="card p-5 border-l-4 border-aws-orange">
              <div className="text-xs font-bold text-aws-orange uppercase tracking-wider">
                Week {phase.week} · {phase.title}
              </div>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{phase.focus}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {phase.domainIds.map((id) => {
                  const domain = domains.find((d) => d.id === id);
                  if (!domain) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onGoToReference(id)}
                      className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-aws-orange/50 text-slate-300 hover:text-aws-orange transition-colors"
                    >
                      {domain.icon} {domain.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50">
      <span className="font-bold text-aws-orange">{value}</span>{' '}
      <span className="text-slate-500">{label}</span>
    </span>
  );
}

function ProgressRing({
  label,
  value,
  total,
  pct,
  onClick,
}: {
  label: string;
  value: number;
  total: number;
  pct: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card p-5 text-left hover:border-aws-orange/40 transition-colors w-full"
    >
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-3xl font-extrabold text-aws-orange tabular-nums">
          {value}
        </span>
        <span className="text-sm text-slate-500 pb-1">/ {total}</span>
        <span className="ml-auto text-lg font-bold text-slate-300 tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-aws-orange transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
