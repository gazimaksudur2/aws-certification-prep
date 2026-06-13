import { useState } from 'react';
import type { LearningDomain, LearningService } from '../../types/learning';
import { PriorityBadge } from './learningUtils';

export function LearningServiceCard({
  cluster,
  service,
  onOpen,
}: {
  cluster: LearningDomain;
  service: LearningService;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasTopics = service.examTopics.length > 0;

  return (
    <div
      className="card p-5 text-left transition-colors"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: cluster.color,
      }}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <div className="font-extrabold leading-tight text-slate-100 flex-1 min-w-0">
          {service.name}
        </div>
        <PriorityBadge priority={service.priority} />
      </div>

      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{service.desc}</p>

      {service.uses && (
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
      )}

      {service.tip && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
          <span className="font-semibold">Exam tip:</span> {service.tip}
        </div>
      )}

      {hasTopics && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-aws-orange hover:underline"
          >
            {expanded ? 'Hide' : 'Show'} key exam topics ({service.examTopics.length})
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc list-inside max-h-48 overflow-y-auto">
              {service.examTopics.map((t) => (
                <li key={t.slice(0, 40)}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 text-xs text-slate-500 hover:text-aws-orange transition-colors"
      >
        View full details →
      </button>
    </div>
  );
}
