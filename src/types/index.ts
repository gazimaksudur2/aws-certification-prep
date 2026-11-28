export type SubmissionReason = 'manual' | 'time_expired';

export type QuizMode = 'timed' | 'guided';

export type ExamLevel = 'Foundational' | 'Associate' | 'Professional' | 'Specialty';

export type ExamStatus = 'learning' | 'practice' | 'both' | 'coming-soon';

export interface Option {
  id: string;
  text: string;
  /** Optional per-option explanation. Present on SOA-C03 questions, absent on CLF/SAA. */
  rationale?: string;
}

export interface Question {
  examId: string;
  examCode: string;
  id: number;
  question: string;
  options: Option[];
  correctAnswers: string[];
  isMultiple: boolean;
  topic: string;
}

/** Answer state during / after quiz; correctness is graded at quiz end only. */
export interface AnsweredQuestion {
  questionId: number;
  selectedAnswers: string[];
  skipped: boolean;
}

export interface QuizSession {
  examId: string;
  examCode: string;
  examTitle: string;
  passThresholdPercent: number;
  mode: QuizMode;
  questions: Question[];
  answers: Record<number, AnsweredQuestion>;
  currentIndex: number;
  startedAt: number;
  finishedAt?: number;
  timeLimitSeconds: number;
  submittedReason?: SubmissionReason;
}

export interface ExamLearningConfig {
  enabled: boolean;
  dataPath: string;
  packOf?: string[];
}

export interface ExamPracticeConfig {
  enabled: boolean;
}

export interface ExamCatalogEntry {
  examId: string;
  code: string;
  title: string;
  description?: string;
  level?: ExamLevel;
  status?: ExamStatus;
  learning?: ExamLearningConfig;
  practice?: ExamPracticeConfig;
}

/** File shape for `src/data/exams/*.json` question banks. */
export interface ExamBankJson {
  examId: string;
  code: string;
  title: string;
  passThresholdPercent: number;
  /** Optional metadata for contributors — not loaded by UI logic. */
  sourceNote?: string;
  questions: Array<Omit<Question, 'examId' | 'examCode'> & { examId?: string }>;
}

/** Snapshot of one question inside a persisted rich attempt. */
export interface AttemptQuestionSnapshot {
  questionId: number;
  topic: string;
  stem: string;
  isMultiple: boolean;
  options: Array<{ id: string; text: string; rationale?: string }>;
  correctAnswers: string[];
  selectedAnswers: string[];
  skipped: boolean;
}

/**
 * Persisted attempt. New finishes are always rich (`detailLevel: 'full'`).
 * Thin summary-only rows from older schemas are not migrated into the list.
 */
export interface AttemptHistoryEntry {
  id: string;
  examId: string;
  examCode: string;
  examTitle: string;
  startedAt: number;
  finishedAt: number;
  timeLimitSeconds: number;
  submittedReason: SubmissionReason;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  durationSeconds: number;
  mode: QuizMode;
  passThresholdPercent: number;
  detailLevel: 'full';
  questions: AttemptQuestionSnapshot[];
}

/** @deprecated Thin v2 envelope — cleared on upgrade to v3. */
export interface HistoryStoreV2 {
  schemaVersion: 2;
  attempts: unknown[];
}

/** Persisted envelope for localStorage (`cert-quiz-history-v3`). */
export interface HistoryStoreV3 {
  schemaVersion: 3;
  attempts: AttemptHistoryEntry[];
}
