import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { useQuiz } from '../hooks/useQuiz';

function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Quiz() {
  const navigate = useNavigate();
  const { session, recordAnswer, skip, next, prev, finish } = useQuiz();

  const current = session?.questions[session.currentIndex] ?? null;
  const [selected, setSelected] = useState<string[]>([]);
  const [remainingSec, setRemainingSec] = useState(0);
  const expiryFiredRef = useRef(false);

  useEffect(() => {
    if (!current) return;
    const saved = session?.answers[current.id];
    setSelected(saved && !saved.skipped ? [...saved.selectedAnswers] : []);
  }, [current, session?.answers]);

  useEffect(() => {
    if (!session) navigate('/practice', { replace: true });
  }, [session, navigate]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    expiryFiredRef.current = false;
    if (!session || session.finishedAt) return;
    const expiresAtMs = session.startedAt + session.timeLimitSeconds * 1000;

    const tick = () => {
      const s = sessionRef.current;
      if (!s || s.finishedAt) return;

      const ms = expiresAtMs - Date.now();
      const sec = Math.ceil(Math.max(0, ms) / 1000);
      setRemainingSec(sec);

      if (
        ms <= 0 &&
        !expiryFiredRef.current &&
        !sessionRef.current?.finishedAt
      ) {
        expiryFiredRef.current = true;
        finish('time_expired');
        queueMicrotask(() => navigate('/results', { replace: true }));
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [finish, navigate, session?.startedAt, session?.timeLimitSeconds]);

  /** Stop countdown display after session is finalized elsewhere. */
  useEffect(() => {
    if (session?.finishedAt) {
      setRemainingSec(0);
    }
  }, [session?.finishedAt]);

  const isLast = useMemo(
    () => !!session && session.currentIndex === session.questions.length - 1,
    [session],
  );

  const completeAndGoToResults = useCallback(
    (reason: 'manual' | 'time_expired') => {
      finish(reason);
      queueMicrotask(() => navigate('/results', { replace: true }));
    },
    [finish, navigate],
  );

  if (!session || !current) return null;

  const toggleOption = (optId: string) => {
    setSelected((prev) => {
      if (current.isMultiple) {
        return prev.includes(optId)
          ? prev.filter((x) => x !== optId)
          : [...prev, optId];
      }
      return [optId];
    });
  };

  const saveAndAdvance = () => {
    if (selected.length === 0) return;
    recordAnswer(current.id, selected);
    if (isLast) completeAndGoToResults('manual');
    else next();
  };

  const handleSkip = () => {
    skip(current.id);
    if (isLast) completeAndGoToResults('manual');
    else next();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          <span className="font-semibold text-aws-orange">{session.examCode}</span>{' '}
          · Question {session.currentIndex + 1} of {session.questions.length}
        </div>
        <div
          className={`font-mono text-lg font-bold tabular-nums px-3 py-1.5 rounded-lg border ${
            remainingSec <= 60
              ? 'border-rose-500/60 text-rose-300 bg-rose-500/10'
              : 'border-slate-700 text-slate-200 bg-slate-900'
          }`}
          title={`Total allotted · ${formatCountdown(session.timeLimitSeconds)}`}
        >
          ⏱ {formatCountdown(remainingSec)}
        </div>
      </div>

      <ProgressBar
        current={session.currentIndex + 1}
        total={session.questions.length}
      />

      <QuestionCard
        question={current}
        selected={selected}
        showSolution={false}
        onToggleOption={toggleOption}
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

        <button type="button" onClick={handleSkip} className="btn-secondary">
          Skip question
        </button>

        <button
          type="button"
          onClick={saveAndAdvance}
          disabled={selected.length === 0}
          className="btn-primary ml-auto"
        >
          {isLast ? 'Finish quiz →' : 'Save · next →'}
        </button>

        <button
          type="button"
          onClick={() => completeAndGoToResults('manual')}
          className="btn-ghost text-xs"
          title="Submit what you answered so far and view results."
        >
          End quiz now
        </button>
      </div>
    </div>
  );
}
