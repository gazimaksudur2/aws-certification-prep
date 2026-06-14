import type {
  Callout,
  Comparison,
  ExamTag,
  InfoCard,
  LearningDomain,
  LearningService,
  Priority,
} from '../../types/learning';
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

/** Lowercase and treat `-`, `_`, `/` as word separators so "multi az" matches "Multi-AZ". */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every whitespace-separated token in `term` must appear in the joined haystack (AND semantics). */
export function matchesSearch(haystackParts: (string | undefined)[], term: string): boolean {
  const normalizedTerm = normalizeForSearch(term);
  if (!normalizedTerm) return true;
  const haystack = normalizeForSearch(haystackParts.filter(Boolean).join(' '));
  return normalizedTerm.split(' ').every((token) => haystack.includes(token));
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
  if (!search.trim()) return true;
  return matchesSearch(
    [
      service.name,
      service.desc,
      ...(service.examTopics ?? []),
      service.tip,
      ...(service.uses ?? []),
    ],
    search,
  );
}

export function comparisonMatchesSearch(comparison: Comparison, search: string): boolean {
  return matchesSearch(
    [
      comparison.title,
      ...comparison.cards.flatMap((card) => [
        card.title,
        ...card.rows.flatMap((row) => [row.key, row.val]),
      ]),
    ],
    search,
  );
}

export function calloutMatchesSearch(callout: Callout, search: string): boolean {
  return matchesSearch([callout.title, ...callout.items], search);
}

export function infoCardMatchesSearch(card: InfoCard, search: string): boolean {
  return matchesSearch([card.title, card.intro, ...card.items], search);
}

/**
 * Applies search + exam/priority filters across a whole domain. Services honor all
 * filters; extras (comparisons, callouts, cards) honor the search term only, since they
 * carry no exam/priority metadata. When the search is empty, extras pass through unchanged.
 */
export function filterDomainContent(
  domain: LearningDomain,
  search: string,
  examFilter: 'all' | ExamTag,
  priorityFilter: 'all' | Priority,
): LearningDomain {
  const hasSearch = search.trim().length > 0;
  // A search hit on the domain name/subtitle keeps all of that domain's extras visible.
  const domainHeaderMatches =
    hasSearch && matchesSearch([domain.name, domain.subtitle], search);

  const services = domain.services.filter((s) =>
    serviceMatchesFilters(s, search, examFilter, priorityFilter),
  );

  // Card-only framework domains (CAF, WAF, HA/DR, Billing) have no services to
  // filter by exam/priority — always allow their cards/callouts through.
  const isCardOnlyDomain = domain.services.length === 0;
  const extrasAllowed =
    isCardOnlyDomain || (examFilter === 'all' && priorityFilter === 'all');
  const keepExtra = (matches: boolean) =>
    extrasAllowed && (!hasSearch || domainHeaderMatches || matches);

  const comparisons = domain.comparisons?.filter((c) =>
    keepExtra(comparisonMatchesSearch(c, search)),
  );
  const callouts = domain.callouts?.filter((c) =>
    keepExtra(calloutMatchesSearch(c, search)),
  );
  const cards = domain.cards?.filter((c) =>
    keepExtra(infoCardMatchesSearch(c, search)),
  );

  return { ...domain, services, comparisons, callouts, cards };
}

export function domainHasVisibleContent(domain: LearningDomain): boolean {
  return Boolean(
    domain.services.length ||
      domain.comparisons?.length ||
      domain.callouts?.length ||
      domain.cards?.length,
  );
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
