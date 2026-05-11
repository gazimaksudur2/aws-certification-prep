export function LearningClusterPills({
  clusters,
  selectedCluster,
  clusterCounts,
  onPickCluster,
}: {
  clusters: Array<{ id: string; name: string }>;
  selectedCluster: 'all' | string;
  clusterCounts: Map<string, number>;
  onPickCluster: (id: 'all' | string) => void;
}) {
  return (
    <div className="md:hidden -mx-1 overflow-x-auto">
      <div className="px-1 flex gap-2">
        <Pill
          label="All"
          active={selectedCluster === 'all'}
          onClick={() => onPickCluster('all')}
        />
        {clusters.map((c) => (
          <Pill
            key={c.id}
            label={`${c.name} (${clusterCounts.get(c.id) ?? 0})`}
            active={selectedCluster === c.id}
            onClick={() => onPickCluster(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'border-aws-orange/60 bg-aws-orange/15 text-aws-orange'
          : 'border-slate-800 bg-slate-900/40 text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

