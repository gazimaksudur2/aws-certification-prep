export type Priority = 'critical' | 'very-high' | 'high' | 'medium' | 'low';

/** Exam code string (e.g. CLF-C02, AIF-C01) — no longer a closed union. */
export type ExamTag = string;

export type CalloutKind = 'trap' | 'tip' | 'info';

export interface LearningResource {
  label: string;
  url: string;
}

export interface LearningService {
  name: string;
  desc: string;
  priority: Priority;
  examTopics: string[];
  /** Legacy real-world use cases (optional, merged from old study guide). */
  uses?: [string, string];
  tip?: string;
  /** @deprecated use priority === 'critical' */
  exam?: boolean;
  exams?: ExamTag[];
  resources?: LearningResource[];
}

export interface ComparisonRow {
  key: string;
  val: string;
}

export interface ComparisonCard {
  title: string;
  rows: ComparisonRow[];
}

export interface Comparison {
  title: string;
  cards: ComparisonCard[];
}

export interface Callout {
  kind: CalloutKind;
  title: string;
  items: string[];
}

export interface InfoCard {
  icon?: string;
  title: string;
  intro?: string;
  items: string[];
}

export interface LearningDomain {
  id: string;
  name: string;
  color: string;
  icon?: string;
  subtitle?: string;
  phase?: number;
  weightPercent?: number;
  /** Topic string used when deep-linking to Practice for this domain. */
  quizTopic?: string;
  /** Override which exam bank Practice should open (defaults to content.examId). */
  practiceExamId?: string;
  services: LearningService[];
  comparisons?: Comparison[];
  callouts?: Callout[];
  cards?: InfoCard[];
  resources?: LearningResource[];
}

/** @deprecated use LearningDomain */
export type LearningCluster = LearningDomain;

export interface StrategyCard {
  id: string;
  title: string;
  accent?: string;
  ordered: boolean;
  items: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  exams: ExamTag[];
}

export interface StudyPhase {
  week: number;
  title: string;
  focus: string;
  domainIds: string[];
}

export interface SyllabusDomainMeta {
  id: string;
  name: string;
  weightPercent?: number;
}

export interface LearningContent {
  schemaVersion: 2 | 3;
  examId?: string;
  code?: string;
  title?: string;
  source: string;
  syllabus?: { domains: SyllabusDomainMeta[] };
  domains: LearningDomain[];
  strategy: StrategyCard[];
  checklist: ChecklistItem[];
  phases: StudyPhase[];
}

export const PRIORITY_ORDER: Priority[] = [
  'critical',
  'very-high',
  'high',
  'medium',
  'low',
];

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  'very-high': 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
