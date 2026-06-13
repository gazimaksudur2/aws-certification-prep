export type Priority = 'critical' | 'very-high' | 'high' | 'medium' | 'low';

export type ExamTag = 'CLF-C02' | 'SAA-C03';

export type CalloutKind = 'trap' | 'tip' | 'info';

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
  services: LearningService[];
  comparisons?: Comparison[];
  callouts?: Callout[];
  cards?: InfoCard[];
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

export interface LearningContent {
  schemaVersion: 2;
  source: string;
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

/** Maps learning domain ids to SAA question-bank topic filters. */
export const DOMAIN_TO_QUIZ_TOPIC: Record<string, string> = {
  compute: 'Compute',
  storage: 'Storage',
  databases: 'Databases',
  networking: 'Networking',
  'ha-dr': 'DR & Availability',
};

export const DOMAIN_TO_EXAM_ID: Record<string, string> = {
  'clf-c02': 'aws-clf-c02',
  'saa-c03': 'aws-saa-c03',
};
