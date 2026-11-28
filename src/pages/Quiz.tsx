import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { useQuiz } from '../hooks/useQuiz';

function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Quiz() {
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

  const current = session?.questions[session.currentIndex] ?? null;
  const [selected, setSelected] = useState<string[]>([]);
  const [remainingSec, setRemainingSec] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const expiryFiredRef = useRef(false);

  useEffect(() => {
    if (!current) return;
    const saved = session?.answers[current.id];
    setSelected(saved && !saved.skipped ? [...saved.selectedAnswers] : []);
  }, [current, session?.answers]);

  useEffect(() => {
    if (!session) navigate('/practice', { replace: true });
    else if (session.mode === 'guided') navigate('/guided', { replace: true });
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

  const isFlagged = Boolean(current && session?.flagged[current.id]);

  /** Counts as of now, treating the current in-progress selection as saved. */
  const liveCounts = useMemo(() => {
    if (!session) {
      return { answered: 0, unanswered: 0, flagged: 0, total: 0 };
    }
    const total = session.questions.length;
    let answered = 0;
    for (const q of session.questions) {
      if (current && q.id === current.id && selected.length > 0) {
        answered += 1;
        continue;
      }
      const a = session.answers[q.id];
      if (a && !a.skipped && a.selectedAnswers.length > 0) answered += 1;
    }
    const flagged = Object.values(session.flagged).filter(Boolean).length;
    return {
      answered,
      unanswered: total - answered,
      flagged,
      total,
    };
  }, [session, current, selected]);

  const completeAndGoToResults = useCallback(
    (reason: 'manual' | 'time_expired') => {
      finish(reason);
      queueMicrotask(() => navigate('/results', { replace: true }));
    },
    [finish, navigate],
  );

  const persistSelection = useCallback(() => {
    if (!current || selected.length === 0) return;
    recordAnswer(current.id, selected);
  }, [current, selected, recordAnswer]);

  const requestSubmit = useCallback(() => {
    persistSelection();
    if (liveCounts.unanswered > 0 || liveCounts.flagged > 0) {
      setSubmitOpen(true);
      return;
    }
    completeAndGoToResults('manual');
  }, [
    persistSelection,
    liveCounts.unanswered,
    liveCounts.flagged,
    completeAndGoToResults,
  ]);

  const toggleOption = useCallback((optId: string) => {
    setSelected((prev) => {
      if (current?.isMultiple) {
        return prev.includes(optId)
          ? prev.filter((x) => x !== optId)
          : [...prev, optId];
      }
      return [optId];
    });
  }, [current]);

  const saveAndAdvance = useCallback(() => {
    if (!current || selected.length === 0) return;
    recordAnswer(current.id, selected);
    if (isLast) requestSubmit();
    else next();
  }, [current, selected, isLast, recordAnswer, requestSubmit, next]);

  const handleSkip = useCallback(() => {
    if (!current) return;
    skip(current.id);
    if (isLast) requestSubmit();
    else next();
  }, [current, isLast, skip, requestSubmit, next]);

  const navigateTo = useCallback(
    (index: number) => {
      if (!session) return;
      if (index === session.currentIndex) return;
      persistSelection();
      goTo(index);
    },
    [session, persistSelection, goTo],
  );

  const goPrev = useCallback(() => {
    persistSelection();
    prev();
  }, [persistSelection, prev]);

  const goNext = useCallback(() => {
    if (!session) return;
    if (session.currentIndex >= session.questions.length - 1) return;
    persistSelection();
    next();
  }, [session, persistSelection, next]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd', 'e'].includes(key)) {
        const idx = ['a', 'b', 'c', 'd', 'e'].indexOf(key);
        const opt = current?.options[idx];
        if (opt) toggleOption(opt.id);
      }
      if (key === 'enter' && selected.length > 0) saveAndAdvance();
      if (key === 's') handleSkip();
      if (key === 'f' && current) {
        e.preventDefault();
        toggleFlag(current.id);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    current,
    selected,
    toggleOption,
    saveAndAdvance,
    handleSkip,
    toggleFlag,
    goPrev,
    goNext,
  ]);

  if (!session || !current) return null;

  const questionIds = session.questions.map((q) => q.id);

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

      <QuestionNavigator
        questionIds={questionIds}
        currentIndex={session.currentIndex}
        answers={session.answers}
        flagged={session.flagged}
        onGoTo={navigateTo}
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          {liveCounts.answered} answered · {liveCounts.unanswered} unanswered
          {liveCounts.flagged > 0 ? ` · ${liveCounts.flagged} flagged` : ''}
        </span>
      </div>

      <QuestionCard
        question={current}
        selected={selected}
        showSolution={false}
        onToggleOption={toggleOption}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={session.currentIndex === 0}
          className="btn-ghost"
        >
          ← Prev
        </button>

        <button
          type="button"
          onClick={() => toggleFlag(current.id)}
          className={`btn-secondary ${
            isFlagged
              ? 'border-amber-400/50 text-amber-200 bg-amber-500/10'
              : ''
          }`}
          aria-pressed={isFlagged}
          aria-label={isFlagged ? 'Remove flag for review' : 'Flag for review'}
        >
          <Flag className="w-4 h-4" aria-hidden="true" />
          {isFlagged ? 'Flagged' : 'Flag for review'}
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
          {isLast ? 'Review & finish →' : 'Save · next →'}
        </button>

        <button
          type="button"
          onClick={requestSubmit}
          className="btn-ghost text-xs"
          title="Submit what you answered so far and view results."
        >
          End quiz now
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 select-none">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">A–D</kbd>
        <span>select option</span>
        <span className="text-slate-700">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">Enter</kbd>
        <span>confirm</span>
        <span className="text-slate-700">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">S</kbd>
        <span>skip</span>
        <span className="text-slate-700">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">F</kbd>
        <span>flag</span>
        <span className="text-slate-700">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-500">← →</kbd>
        <span>navigate</span>
      </div>

      <Modal
        open={submitOpen}
        title="Submit quiz?"
        onClose={() => setSubmitOpen(false)}
      >
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            You have answered{' '}
            <span className="font-semibold text-slate-100">
              {liveCounts.answered}
            </span>{' '}
            of {liveCounts.total} questions.
          </p>
          <ul className="space-y-1 text-slate-400">
            {liveCounts.unanswered > 0 && (
              <li>
                <span className="text-slate-200 font-medium">
                  {liveCounts.unanswered}
                </span>{' '}
                unanswered
              </li>
            )}
            {liveCounts.flagged > 0 && (
              <li>
                <span className="text-amber-200 font-medium">
                  {liveCounts.flagged}
                </span>{' '}
                flagged for review
              </li>
            )}
          </ul>
          <p className="text-slate-500 text-xs">
            You can cancel and jump to any question from the palette, or submit
            now.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setSubmitOpen(false)}
            >
              Keep reviewing
            </button>
            <button
              type="button"
              className="btn-primary ml-auto"
              onClick={() => {
                setSubmitOpen(false);
                completeAndGoToResults('manual');
              }}
            >
              Submit answers
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
