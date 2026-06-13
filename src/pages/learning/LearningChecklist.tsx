import type { ChecklistItem } from '../../types/learning';

export function LearningChecklist({
  items,
  checkedCount,
  isChecked,
  onToggle,
}: {
  items: ChecklistItem[];
  checkedCount: number;
  isChecked: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  const total = items.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold">Must master before exam</h3>
            <p className="text-sm text-slate-400 mt-1">
              Top {total} topics for CLF-C02 & SAA-C03 — click to mark reviewed.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-aws-orange tabular-nums">
              {checkedCount} / {total}
            </div>
            <div className="text-xs text-slate-500">{pct}% complete</div>
          </div>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item, idx) => {
          const done = isChecked(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors flex items-start gap-3 ${
                done
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-slate-800 hover:border-slate-600 bg-slate-900/30'
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {done ? '✓' : String(idx + 1).padStart(2, '0')}
              </span>
              <span
                className={`text-sm leading-relaxed flex-1 ${
                  done ? 'text-emerald-100 line-through opacity-80' : 'text-slate-200'
                }`}
              >
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
