import { useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScoreBadge } from '../components/ScoreBadge';
import { OptionButton } from '../components/OptionButton';
import { useQuiz } from '../hooks/useQuiz';
import { useHistory } from '../hooks/useHistory';
import type {
  AttemptHistoryEntry,
  Question,
  SubmissionReason,
} from '../types';
import { PASS_THRESHOLD_PERCENT, isAnswerCorrect } from '../utils/scoring';

type RowStatus =
  | 'correct'
  | 'incorrect'
  | 'skipped'
  | 'unanswered';

function rowBadge(status: RowStatus) {
  switch (status) {
    case 'correct':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'incorrect':
      return 'bg-rose-500/15 text-rose-300';
    case 'skipped':
      return 'bg-amber-500/15 text-amber-300';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

function rowLabel(status: RowStatus) {
  switch (status) {
    case 'correct':
      return 'Correct';
    case 'incorrect':
      return 'Incorrect';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Unanswered';
  }
}

export function Results() {
  const navigate = useNavigate();
  const { session, reset } = useQuiz();
  const { add } = useHistory();
  const savedRef = useRef(false);

  const summary = useMemo(() => {
    if (!session) return null;

    let correctCount = 0;
    const rows: Array<{
      q: Question;
      status: RowStatus;
      selected: string[];
    }> = [];

    for (const q of session.questions) {
      const ans = session.answers[q.id];
      let status: RowStatus;
      let selected: string[];

      if (!ans) {
        status = 'unanswered';
        selected = [];
      } else if (ans.skipped) {
        status = 'skipped';
        selected = [];
      } else {
        selected = [...ans.selectedAnswers];
        status = isAnswerCorrect(selected, q.correctAnswers)
          ? 'correct'
          : 'incorrect';
      }

      if (status === 'correct') correctCount += 1;

      rows.push({ q, status, selected });
    }

    const total = session.questions.length;
    const incorrect = rows.filter((r) => r.status === 'incorrect');
    const skipped = rows.filter((r) => r.status === 'skipped');
    const unanswered = rows.filter((r) => r.status === 'unanswered');
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const startedAt = session.startedAt;
    const finishedAt = session.finishedAt ?? Date.now();
    const durationSeconds = Math.max(
      1,
      Math.round((finishedAt - startedAt) / 1000),
    );

    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const row of rows) {
      const t = row.q.topic;
      const stat = byTopic.get(t) ?? { correct: 0, total: 0 };
      stat.total += 1;
      if (row.status === 'correct') stat.correct += 1;
      byTopic.set(t, stat);
    }

    const passThreshold =
      session.passThresholdPercent ?? PASS_THRESHOLD_PERCENT;

    return {
      rows,
      total,
      correctCount,
      incorrectCount: incorrect.length,
      skippedCount: skipped.length,
      unansweredCount: unanswered.length,
      scorePercent,
      startedAt,
      finishedAt,
      durationSeconds,
      byTopic: Array.from(byTopic.entries()).sort(
        (a, b) => b[1].total - a[1].total,
      ),
      submittedReason: (session.submittedReason ?? 'manual') as SubmissionReason,
      timeLimitSeconds: session.timeLimitSeconds,
      examCode: session.examCode,
      examTitle: session.examTitle,
      examId: session.examId,
      passThreshold,
    };
  }, [session]);

  useEffect(() => {
    if (!session || !summary || savedRef.current) return;
    if (session.mode === 'guided') return;
    savedRef.current = true;

    const entry: AttemptHistoryEntry = {
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
    };
    add(entry);
  }, [session, summary, add]);

  useEffect(() => {
    if (!session) navigate('/practice', { replace: true });
  }, [session, navigate]);

  if (!session || !summary) return null;

  const isGuided = session.mode === 'guided';
  const passed = summary.scorePercent >= summary.passThreshold;

  const submitNote = isGuided
    ? 'Guided practice summary — instant feedback was shown after each question. This run was not saved to attempt history.'
    : summary.submittedReason === 'time_expired'
      ? 'Auto-submitted when the allotted time elapsed.'
      : 'You chose to submit (or answered through the final question without running out of time).';

  return (
    <div className="space-y-8">
      <section className="card p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreBadge
            correct={summary.correctCount}
            total={summary.total}
            passThresholdPercent={summary.passThreshold}
          />
          <div className="flex-1 text-center md:text-left">
            <div
              className={`text-xs uppercase tracking-widest font-semibold ${
                passed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {passed ? 'Passed' : 'Below pass mark'}
            </div>
            <h1 className="mt-1 text-3xl md:text-4xl font-extrabold">
              {summary.examCode} · {isGuided ? 'guided practice' : 'results'}
            </h1>
            <p className="mt-1 text-sm text-aws-orange">{summary.examTitle}</p>
            <p className="mt-3 text-slate-400">{submitNote}</p>

            <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {!isGuided && (
                <Stat label="Allowed time" value={formatHm(summary.timeLimitSeconds)} />
              )}
              <Stat
                label="Time spent"
                value={`${Math.floor(summary.durationSeconds / 60)}m ${summary.durationSeconds % 60}s`}
              />
              <Stat label="Correct" value={summary.correctCount.toString()} positive />
              <Stat label="Incorrect" value={summary.incorrectCount.toString()} negative />
              <Stat
                label="Skipped / blank"
                value={(summary.skippedCount + summary.unansweredCount).toString()}
              />
              <Stat
                label="Pass bar"
                value={`${summary.passThreshold}%`}
              />
            </dl>

            <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => {
                  reset();
                  navigate('/practice');
                }}
                className="btn-primary"
              >
                Back to certifications
              </button>
              <button
                type="button"
                onClick={() => navigate(`/browse?exam=${summary.examId}`)}
                className="btn-secondary"
              >
                Browse · {summary.examCode}
              </button>
            </div>
          </div>
        </div>
      </section>

      {summary.byTopic.length > 1 && (
        <section className="card p-6">
          <h2 className="text-lg font-bold mb-4">Strength by topic</h2>
          <div className="space-y-3">
            {summary.byTopic.map(([topicLabel, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={topicLabel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-200">{topicLabel}</span>
                    <span className="text-slate-400">
                      {stats.correct} / {stats.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        pct >= summary.passThreshold ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card p-6 md:p-8">
        <h2 className="text-xl font-bold mb-4">
          Detailed review ({summary.total} prompts)
        </h2>
        <ul className="space-y-6">
          {summary.rows.map((row, idx) => (
            <li
              key={`${row.q.examId}-${row.q.id}-${idx}`}
              className="rounded-xl border border-slate-800 p-5 bg-slate-900/30"
            >
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${rowBadge(row.status)}`}
                >
                  {rowLabel(row.status)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange font-semibold">
                  {row.q.topic}
                </span>
                <span className="text-[11px] text-slate-500 font-mono ml-auto">
                  {`#${idx + 1} · #${row.q.id}`}
                </span>
              </div>
              <p className="font-semibold text-slate-100 mb-4 leading-snug">{row.q.question}</p>

              <div className="space-y-2.5 mb-5">
                {row.q.options.map((opt) => {
                  const sel = row.selected.includes(opt.id);
                  const ok = row.q.correctAnswers.includes(opt.id);
                  const showIncorrect = sel && !ok;
                  return (
                    <OptionButton
                      key={opt.id}
                      letter={opt.id}
                      text={opt.text}
                      selected={sel}
                      showGrading
                      isCorrect={ok}
                      isIncorrectSelection={showIncorrect}
                      onClick={() => {}}
                      disabled
                    />
                  );
                })}
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
                <div>
                  <dt className="uppercase tracking-wider text-slate-500 font-semibold">
                    Your selections
                  </dt>
                  <dd className="font-mono text-slate-200 mt-1">
                    {row.status === 'skipped'
                      ? '— (skipped)'
                      : row.selected.length
                        ? row.selected.join(', ')
                        : '— (blank)'}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="uppercase tracking-wider text-emerald-500/80 font-semibold">
                    Authoritative answers
                  </dt>
                  <dd className="text-slate-200 mt-1">
                    {row.q.correctAnswers.join(', ')}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const valueClass = positive
    ? 'text-emerald-400'
    : negative
      ? 'text-rose-400'
      : 'text-slate-100';
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </dt>
      <dd className={`text-lg font-bold ${valueClass}`}>{value}</dd>
    </div>
  );
}

function formatHm(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
