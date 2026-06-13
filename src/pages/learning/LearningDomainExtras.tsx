import { Link } from 'react-router-dom';
import type { Callout, Comparison, InfoCard } from '../../types/learning';

export function LearningDomainExtras({
  comparisons,
  callouts,
  cards,
}: {
  comparisons?: Comparison[];
  callouts?: Callout[];
  cards?: InfoCard[];
}) {
  if (!comparisons?.length && !callouts?.length && !cards?.length) return null;

  return (
    <div className="space-y-6 mt-6">
      {comparisons?.map((comp) => (
        <div key={comp.title} className="card p-5 md:p-6">
          <h4 className="text-sm font-bold text-slate-200 mb-4">{comp.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comp.cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
              >
                <div className="font-semibold text-aws-orange text-sm mb-2">
                  {card.title}
                </div>
                <dl className="space-y-1.5 text-xs">
                  {card.rows.map((row) => (
                    <div key={`${row.key}-${row.val}`} className="flex gap-2">
                      <dt className="text-slate-500 shrink-0">{row.key}</dt>
                      <dd className="text-slate-300">{row.val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      ))}

      {cards && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-900/30 p-4"
            >
              <div className="font-bold text-slate-100 flex items-center gap-2">
                {card.icon && <span>{card.icon}</span>}
                {card.title}
              </div>
              {card.intro && (
                <p className="mt-2 text-sm text-slate-400">{card.intro}</p>
              )}
              {card.items.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-slate-300 list-disc list-inside">
                  {card.items.map((item) => (
                    <li key={item.slice(0, 40)}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {callouts?.map((c) => (
        <div
          key={c.title}
          className={`rounded-xl border p-4 ${
            c.kind === 'trap'
              ? 'border-rose-500/40 bg-rose-500/5'
              : c.kind === 'tip'
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-sky-500/40 bg-sky-500/5'
          }`}
        >
          <div
            className={`text-xs font-bold uppercase tracking-wider mb-2 ${
              c.kind === 'trap'
                ? 'text-rose-300'
                : c.kind === 'tip'
                  ? 'text-emerald-300'
                  : 'text-sky-300'
            }`}
          >
            {c.title}
          </div>
          <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
            {c.items.map((item) => (
              <li key={item.slice(0, 50)}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DomainPracticeLink({ domainId }: { domainId: string }) {
  const topicMap: Record<string, string> = {
    compute: 'Compute',
    storage: 'Storage',
    databases: 'Databases',
    networking: 'Networking',
    'ha-dr': 'DR & Availability',
  };
  const topic = topicMap[domainId];
  if (!topic) return null;

  const params = new URLSearchParams({
    exam: 'aws-saa-c03',
    topic,
  });

  return (
    <Link
      to={`/practice?${params.toString()}`}
      className="btn-secondary text-xs inline-flex items-center gap-1"
    >
      Practice {topic} questions →
    </Link>
  );
}
