import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AnsweredQuestion,
  QuizMode,
  QuizSession,
  SubmissionReason,
} from '../types';
import {
  getExamBankMeta,
  getQuestionsForExam,
} from '../utils/exams';
import { pickRandom } from '../utils/shuffle';
import { timeLimitSecondsFromQuestionCount } from '../utils/timeLimit';

interface QuizContextValue {
  session: QuizSession | null;
  startQuiz: (
    examId: string,
    count: number,
    topic?: string,
    mode?: QuizMode,
  ) => void;
  recordAnswer: (questionId: number, selected: string[]) => void;
  skip: (questionId: number) => void;
  /**
   * Finishes quiz; returns finalized session snapshot (for navigation),
   * or null if none.
   */
  finish: (
    submittedReason?: SubmissionReason,
  ) => QuizSession | null;
  reset: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  progress: { answered: number; total: number };
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);

  const startQuiz = useCallback(
    (examId: string, count: number, topic?: string, mode: QuizMode = 'timed') => {
      const meta = getExamBankMeta(examId);
      if (!meta || count < 1) return;

      const pool = getQuestionsForExam(examId);
      const filtered =
        topic && topic !== 'All'
          ? pool.filter((q) => q.topic === topic)
          : pool;

      const picked = pickRandom(filtered, count);
      if (picked.length === 0) return;

      const timeLimitSeconds =
        mode === 'guided'
          ? 0
          : timeLimitSecondsFromQuestionCount(picked.length);

      setSession({
        examId,
        examCode: meta.code,
        examTitle: meta.title,
        passThresholdPercent: meta.passThresholdPercent,
        mode,
        questions: picked,
        answers: {},
        currentIndex: 0,
        startedAt: Date.now(),
        timeLimitSeconds,
      });
    },
    [],
  );

  /** Persists selections only; correctness is evaluated on the results screen. */
  const recordAnswer = useCallback((questionId: number, selected: string[]) => {
    const entry: AnsweredQuestion = {
      questionId,
      selectedAnswers: selected,
      skipped: false,
    };
    setSession((s) =>
      s ? { ...s, answers: { ...s.answers, [questionId]: entry } } : s,
    );
  }, []);

  const skip = useCallback((questionId: number) => {
    setSession((s) =>
      s
        ? {
            ...s,
            answers: {
              ...s.answers,
              [questionId]: {
                questionId,
                selectedAnswers: [],
                skipped: true,
              },
            },
          }
        : s,
    );
  }, []);

  const next = useCallback(() => {
    setSession((s) =>
      s
        ? {
            ...s,
            currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
          }
        : s,
    );
  }, []);

  const prev = useCallback(() => {
    setSession((s) =>
      s ? { ...s, currentIndex: Math.max(s.currentIndex - 1, 0) } : s,
    );
  }, []);

  const goTo = useCallback((index: number) => {
    setSession((s) =>
      s
        ? {
            ...s,
            currentIndex: Math.max(
              0,
              Math.min(index, s.questions.length - 1),
            ),
          }
        : s,
    );
  }, []);

  const finish = useCallback(
    (submittedReason: SubmissionReason = 'manual'): QuizSession | null => {
      let finalized: QuizSession | null = null;
      setSession((s) => {
        if (!s) return s;
        finalized = {
          ...s,
          finishedAt: Date.now(),
          submittedReason,
        };
        return finalized;
      });
      return finalized;
    },
    [],
  );

  const reset = useCallback(() => setSession(null), []);

  const progress = useMemo(() => {
    if (!session) return { answered: 0, total: 0 };
    const answered = Object.values(session.answers).filter((a) => !a.skipped)
      .length;
    return { answered, total: session.questions.length };
  }, [session]);

  const value: QuizContextValue = {
    session,
    startQuiz,
    recordAnswer,
    skip,
    next,
    prev,
    goTo,
    finish,
    reset,
    progress,
  };

  return createElement(QuizContext.Provider, { value }, children);
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within a QuizProvider');
  return ctx;
}
