export function LearningClusterSidebar({
  clusters,
  selectedCluster,
  activeCluster,
  clusterCounts,
  onPickCluster,
}: {
  clusters: Array<{ id: string; name: string; color: string; servicesCount: number }>;
  selectedCluster: 'all' | string;
  activeCluster: string | null;
  clusterCounts: Map<string, number>;
  onPickCluster: (id: 'all' | string) => void;
}) {
  const totalAll = clusters.reduce((acc, c) => acc + c.servicesCount, 0);
  return (
    <aside className="hidden md:block md:col-span-4 lg:col-span-3">
      <div className="card p-4 sticky top-20">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Clusters
        </div>
        <div className="space-y-1">
          <SidebarRow
            label="All clusters"
            count={totalAll}
            active={selectedCluster === 'all'}
            onClick={() => onPickCluster('all')}
          />
          {clusters.map((c) => {
            const active =
              selectedCluster === c.id ||
              (selectedCluster === 'all' && activeCluster === c.id);
            return (
              <SidebarRow
                key={c.id}
                label={c.name}
                count={clusterCounts.get(c.id) ?? c.servicesCount}
                color={c.color}
                active={active}
                onClick={() => onPickCluster(c.id)}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SidebarRow({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
        active
          ? 'border-aws-orange/50 bg-aws-orange/10 text-slate-100'
          : 'border-slate-800 hover:bg-slate-900/40 text-slate-300'
      }`}
    >
      {color ? (
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-600" />
      )}
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-slate-500 tabular-nums">{count}</span>
    </button>
  );
}

