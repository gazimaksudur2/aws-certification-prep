import type { ExamTag, LearningService, Priority } from '../../types/learning';
import { PRIORITY_LABELS } from '../../types/learning';

export function priorityBadgeClass(priority: Priority): string {
  switch (priority) {
    case 'critical':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    case 'very-high':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/40';
    case 'high':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    case 'medium':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-600/40';
  }
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityBadgeClass(priority)}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function serviceMatchesFilters(
  service: LearningService,
  search: string,
  examFilter: 'all' | ExamTag,
  priorityFilter: 'all' | Priority,
): boolean {
  if (priorityFilter !== 'all' && service.priority !== priorityFilter) return false;
  if (examFilter !== 'all') {
    const tags = service.exams ?? ['CLF-C02', 'SAA-C03'];
    if (!tags.includes(examFilter)) return false;
  }
  const term = search.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    service.name,
    service.desc,
    ...(service.examTopics ?? []),
    service.tip ?? '',
    ...(service.uses ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(term);
}

export function buildPracticeUrl(domainId: string, examId = 'aws-saa-c03'): string {
  const topicMap: Record<string, string> = {
    compute: 'Compute',
    storage: 'Storage',
    databases: 'Databases',
    networking: 'Networking',
    'ha-dr': 'DR & Availability',
  };
  const topic = topicMap[domainId] ?? 'All';
  const params = new URLSearchParams({ exam: examId, topic });
  return `/practice?${params.toString()}`;
}
