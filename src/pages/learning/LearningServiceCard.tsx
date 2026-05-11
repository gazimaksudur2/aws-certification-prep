import type { LearningCluster, LearningService } from '../../types/learning';

export function LearningServiceCard({
  cluster,
  service,
  onOpen,
}: {
  cluster: LearningCluster;
  service: LearningService;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card p-5 text-left hover:border-aws-orange/40 transition-colors"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: cluster.color,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="font-extrabold leading-tight text-slate-100">
              {service.name}
            </div>
            {service.exam && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold shrink-0">
                ★ Exam critical
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">{service.desc}</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-slate-300">
        <li className="flex gap-2">
          <span style={{ color: cluster.color }}>→</span>
          <span className="flex-1">{service.uses[0]}</span>
        </li>
        <li className="flex gap-2">
          <span style={{ color: cluster.color }}>→</span>
          <span className="flex-1">{service.uses[1]}</span>
        </li>
      </ul>

      {service.tip && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
          <span className="font-semibold">Exam tip:</span> {service.tip}
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">View details →</div>
    </button>
  );
}

