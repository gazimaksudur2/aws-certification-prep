import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { useQuiz } from '../hooks/useQuiz';
import { openLearnMore } from '../utils/learnMore';
import { isAnswerCorrect } from '../utils/scoring';

export function GuidedPractice() {
  const navigate = useNavigate();
  const { session, recordAnswer, skip, next, prev, finish } = useQuiz();

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

  const completeAndGoToResults = useCallback(() => {
    finish('manual');
    queueMicrotask(() => navigate('/results', { replace: true }));
  }, [finish, navigate]);

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
    </div>
  );
}
