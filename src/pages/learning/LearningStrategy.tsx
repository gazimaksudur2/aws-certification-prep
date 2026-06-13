import type { StrategyCard } from '../../types/learning';

export function LearningStrategy({ cards }: { cards: StrategyCard[] }) {
  if (!cards.length) {
    return (
      <div className="card p-10 text-center text-slate-400">
        No exam strategy content loaded.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div key={card.id} className="card p-5 md:p-6">
          <h3 className="text-base font-bold text-slate-100 mb-3">{card.title}</h3>
          {card.ordered ? (
            <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
              {card.items.map((item) => (
                <li key={item.slice(0, 50)} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          ) : (
            <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
              {card.items.map((item) => (
                <li key={item.slice(0, 50)} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
          Final exam day mindset
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          AWS certification exams test <strong className="text-slate-100">best practices</strong>,
          not just knowledge. When in doubt, choose the answer that is most managed (least
          operational overhead), most secure, most available, and most cost-effective for
          the given scenario.
        </p>
      </div>
    </div>
  );
}
