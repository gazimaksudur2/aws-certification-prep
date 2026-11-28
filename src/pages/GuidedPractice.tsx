import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { ToastContainer } from '../components/ToastContainer';
import { useQuiz } from '../hooks/useQuiz';
import { useToast } from '../hooks/useToast';
import { openLearnMore } from '../utils/learnMore';
import { isAnswerCorrect } from '../utils/scoring';

export function GuidedPractice() {
  const navigate = useNavigate();
  const {
    session,
    recordAnswer,
    skip,
    toggleFlag,
    next,
    prev,
    goTo,
    finish,
  } = useQuiz();
  const { toasts, show } = useToast();

  const current = session?.questions[session.currentIndex] ?? null;
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/practice', { replace: true });
      return;
    }
    if (session.mode !== 'guided') {
      navigate(session.mode === 'timed' ? '/quiz' : '/practice', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!current || !session) return;
    const saved = session.answers[current.id];
    if (saved && !saved.skipped) {
      setSelected([...saved.selectedAnswers]);
      setChecked(true);
    } else {
      setSelected([]);
      setChecked(false);
    }
  }, [current, session?.answers]);

  const isLast = useMemo(
    () => !!session && session.currentIndex === session.questions.length - 1,
    [session],
  );

  const isCorrect = useMemo(() => {
    if (!current || !checked) return false;
    return isAnswerCorrect(selected, current.correctAnswers);
  }, [current, checked, selected]);

  const isFlagged = Boolean(current && session?.flagged[current.id]);

  const completeAndGoToResults = useCallback(() => {
    finish('manual');
    queueMicrotask(() => navigate('/results', { replace: true }));
  }, [finish, navigate]);

  const navigateTo = useCallback(
    (index: number) => {
      if (!session) return;
      if (index === session.currentIndex) return;
      goTo(index);
    },
    [session, goTo],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!current || !session) return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        toggleFlag(current.id);
      }
      if (e.key === 'ArrowLeft' && session.currentIndex > 0) {
        e.preventDefault();
        prev();
      }
      if (
        e.key === 'ArrowRight' &&
        session.currentIndex < session.questions.length - 1
      ) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, session, toggleFlag, prev, next]);

  if (!session || !current || session.mode !== 'guided') return null;

  const toggleOption = (optId: string) => {
    if (checked) return;
    setSelected((prev) => {
      if (current.isMultiple) {
        return prev.includes(optId)
          ? prev.filter((x) => x !== optId)
          : [...prev, optId];
      }
      return [optId];
    });
  };

  const handleCheck = () => {
    if (selected.length === 0) return;
    recordAnswer(current.id, selected);
    setChecked(true);
    const correct = isAnswerCorrect(selected, current.correctAnswers);
    show(correct ? 'correct' : 'incorrect', correct ? 'Correct answer! 🎉' : 'Incorrect — review the solution');
  };

  const handleSkip = () => {
    skip(current.id);
    if (isLast) completeAndGoToResults();
    else next();
  };

  const handleAdvance = () => {
    if (isLast) completeAndGoToResults();
    else next();
  };

  const questionIds = session.questions.map((q) => q.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          <span className="font-semibold text-aws-orange">{session.examCode}</span>{' '}
          · Guided Practice · Question {session.currentIndex + 1} of{' '}
          {session.questions.length}
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-300 bg-sky-500/10">
          No time limit
        </div>
      </div>

      <ProgressBar
        current={session.currentIndex + 1}
        total={session.questions.length}
      />

      <QuestionCard
        question={current}
        selected={selected}
        showSolution={checked}
        onToggleOption={toggleOption}
        isFlagged={isFlagged}
        onToggleFlag={() => toggleFlag(current.id)}
      />

      {checked && (
        <div
          className={`rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-3 ${
            isCorrect
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-rose-500/40 bg-rose-500/10'
          }`}
        >
          <div>
            <div
              className={`text-sm font-bold uppercase tracking-wide ${
                isCorrect ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {isCorrect ? 'Correct' : 'Incorrect'}
            </div>
            <div className="text-sm text-slate-300 mt-1">
              Correct answer{current.correctAnswers.length > 1 ? 's' : ''}:{' '}
              <span className="font-mono font-semibold text-slate-100">
                {current.correctAnswers.join(', ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openLearnMore(current)}
            className="btn-secondary text-sm"
          >
            Learn more ↗
          </button>
        </div>
      )}

      <QuestionNavigator
        questionIds={questionIds}
        currentIndex={session.currentIndex}
        answers={session.answers}
        flagged={session.flagged}
        onGoTo={navigateTo}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => prev()}
          disabled={session.currentIndex === 0}
          className="btn-ghost"
        >
          ← Prev
        </button>

        {!checked ? (
          <>
            <button type="button" onClick={handleSkip} className="btn-secondary">
              Skip question
            </button>
            <button
              type="button"
              onClick={handleCheck}
              disabled={selected.length === 0}
              className="btn-primary ml-auto"
            >
              Check answer
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAdvance}
            className="btn-primary ml-auto"
          >
            {isLast ? 'Finish practice →' : 'Next question →'}
          </button>
        )}

        <button
          type="button"
          onClick={completeAndGoToResults}
          className="btn-ghost text-xs"
          title="End this guided practice run and view your summary."
        >
          End practice now
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 select-none">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">F</kbd>
        <span>flag</span>
        <span className="text-slate-700">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">← →</kbd>
        <span>navigate</span>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
