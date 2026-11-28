import type {
  AttemptHistoryEntry,
  AttemptQuestionSnapshot,
  QuizSession,
  SubmissionReason,
} from '../types';
import { PASS_THRESHOLD_PERCENT, isAnswerCorrect } from './scoring';

export type RowStatus =
  | 'correct'
  | 'incorrect'
  | 'skipped'
  | 'unanswered';

export function statusForSnapshot(q: AttemptQuestionSnapshot): RowStatus {
  if (q.skipped) return 'skipped';
  if (!q.selectedAnswers.length) return 'unanswered';
  return isAnswerCorrect(q.selectedAnswers, q.correctAnswers)
    ? 'correct'
    : 'incorrect';
}

/** Build a rich history entry from a finished quiz session. */
export function buildRichAttemptFromSession(
  session: QuizSession,
  summary: {
    startedAt: number;
    finishedAt: number;
    durationSeconds: number;
    correctCount: number;
    scorePercent: number;
    total: number;
    submittedReason: SubmissionReason;
    timeLimitSeconds: number;
  },
): AttemptHistoryEntry {
  const questions: AttemptQuestionSnapshot[] = session.questions.map((q) => {
    const ans = session.answers[q.id];
    const skipped = Boolean(ans?.skipped);
    const selectedAnswers = ans && !ans.skipped ? [...ans.selectedAnswers] : [];
    const flagged = Boolean(session.flagged?.[q.id]);
    return {
      questionId: q.id,
      topic: q.topic,
      stem: q.question,
      isMultiple: q.isMultiple,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        ...(o.rationale ? { rationale: o.rationale } : {}),
      })),
      correctAnswers: [...q.correctAnswers],
      selectedAnswers,
      skipped,
      ...(flagged ? { flagged: true } : {}),
    };
  });

  return {
    id: `${session.examId}-${summary.startedAt}-${summary.finishedAt}`,
    examId: session.examId,
    examCode: session.examCode,
    examTitle: session.examTitle,
    startedAt: summary.startedAt,
    finishedAt: summary.finishedAt,
    timeLimitSeconds: summary.timeLimitSeconds,
    submittedReason: summary.submittedReason,
    totalQuestions: summary.total,
    correctCount: summary.correctCount,
    scorePercent: summary.scorePercent,
    durationSeconds: summary.durationSeconds,
    mode: session.mode,
    passThresholdPercent:
      session.passThresholdPercent ?? PASS_THRESHOLD_PERCENT,
    detailLevel: 'full',
    questions,
  };
}
