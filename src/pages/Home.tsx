import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useHistory } from '../hooks/useHistory';
import type { AttemptHistoryEntry, QuizMode } from '../types';
import {
  getExamBankMeta,
  getQuestionsForExam,
  getTopicsForExam,
  listCatalog,
} from '../utils/exams';
import { PASS_THRESHOLD_PERCENT } from '../utils/scoring';

export function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startQuiz } = useQuiz();

  const catalog = useMemo(() => listCatalog(), []);
  const {
    statsGlobal,
    statsForExam,
    recentForExam,
    clear,
  } = useHistory();

  const [examId, setExamId] = useState<string | null>(null);
  const selectedExam = catalog.find((e) => e.examId === examId) ?? null;

  const allQuestions = useMemo(
    () => (examId ? getQuestionsForExam(examId) : []),
    [examId],
  );
  const topics = useMemo(
    () => (examId ? getTopicsForExam(examId) : ['All']),
    [examId],
  );

  const [topic, setTopic] = useState('All');
  const pool = useMemo(() => {
    if (!examId || topic === 'All') return allQuestions;
    return allQuestions.filter((q) => q.topic === topic);
  }, [allQuestions, examId, topic]);

  const maxCount = pool.length;
  const [count, setCount] = useState(20);

  const statsThis = statsForExam(examId);
  const recentThis = recentForExam(examId, 8);
  const recentGlobal = recentForExam(null, 5);

  const passThresholdPercent = examId
    ? (getExamBankMeta(examId)?.passThresholdPercent ?? PASS_THRESHOLD_PERCENT)
    : PASS_THRESHOLD_PERCENT;

  /** Deep link from Learning: /practice?exam=aws-saa-c03&topic=Compute */
  useEffect(() => {
    const examParam = searchParams.get('exam');
    const topicParam = searchParams.get('topic');
    if (!examParam) return;

    const validExam = catalog.find((e) => e.examId === examParam);
    if (!validExam) return;

    setExamId(examParam);
    const examTopics = getTopicsForExam(examParam);
    const nextTopic =
      topicParam && examTopics.includes(topicParam) ? topicParam : 'All';
    setTopic(nextTopic);

    const poolSize = Math.max(
      nextTopic === 'All'
        ? getQuestionsForExam(examParam).length
        : getQuestionsForExam(examParam).filter((q) => q.topic === nextTopic)
            .length,
      1,
    );
    setCount(Math.min(20, poolSize));
  }, [searchParams, catalog]);

  function handleExamPick(id: string) {
    setExamId(id);
    setTopic('All');
    const poolSize = Math.max(getQuestionsForExam(id).length, 1);
    setCount(Math.min(20, poolSize));
  }

  const begin = (mode: QuizMode) => {
    if (!examId || maxCount < 5) return;
    const safeCount = Math.min(Math.max(count, 5), maxCount);
    startQuiz(examId, safeCount, topic, mode);
    navigate(mode === 'guided' ? '/guided' : '/quiz');
  };

  const handleStartTimed = () => begin('timed');
  const handleStartGuided = () => begin('guided');

  const safeMax = Math.max(maxCount, 5);
  const rangeValue = Math.min(count, safeMax);

  return (
    <div className="space-y-8">
      <section className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/10 via-transparent to-aws-blue/10 pointer-events-none" />
        <div className="relative">
          <div className="text-xs font-semibold tracking-widest text-aws-orange uppercase">
            Certification exam practice hub
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">
            Practice. Track. Pass.
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            Pick a credential, tune topic and quiz length, then take a timed run.
            You get{' '}
            <span className="text-aws-orange font-semibold">
              two minutes × each question in the quiz
            </span>{' '}
            to finish. Detailed scoring unlocks after the attempt ends — not per
            question.
          </p>
        </div>
      </section>

      {!examId && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Choose certification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.map((e) => {
              const total = getQuestionsForExam(e.examId).length;
              const st = statsForExam(e.examId);
              return (
                <button
                  key={e.examId}
                  type="button"
                  onClick={() => handleExamPick(e.examId)}
                  className="card p-6 text-left hover:border-aws-orange/50 transition-colors"
                >
                  <div className="text-[11px] font-bold tracking-wider text-aws-orange uppercase">
                    {e.code}
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-100">
                    {e.title}
                  </div>
                  {e.description && (
                    <div className="mt-2 text-sm text-slate-400">{e.description}</div>
                  )}
                  <div className="mt-4 flex gap-6 text-xs text-slate-500">
                    <span>{total} questions</span>
                    {st.totalAttempts > 0 && (
                      <span>
                        Your attempts · {st.totalAttempts} (avg {st.avgScore}%)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {examId && selectedExam && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Question pool · this exam"
              value={allQuestions.length.toString()}
              hint={selectedExam.code}
            />
            <StatCard
              label="Quizzes · this exam"
              value={statsThis.totalAttempts.toString()}
              hint={
                statsThis.totalAttempts > 0
                  ? `Avg ${statsThis.avgScore}% · best ${statsThis.bestScore}%`
                  : 'No attempts yet'
              }
            />
            <StatCard
              label="Quizzes · all exams"
              value={statsGlobal.totalAttempts.toString()}
              hint={
                statsGlobal.totalAttempts > 0
                  ? `Avg ${statsGlobal.avgScore}%`
                  : '—'
              }
            />
          </section>

          <section className="card p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{selectedExam.title}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Results use a{' '}
                  <span className="text-slate-200">{passThresholdPercent}%</span>{' '}
                  pass benchmark for{' '}
                  <span className="text-slate-200">{selectedExam.code}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExamId(null)}
                className="btn-secondary text-sm"
              >
                Change certification
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-aws-orange"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}{' '}
                      {t !== 'All'
                        ? `(${allQuestions.filter((q) => q.topic === t).length})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Number of Questions
                  </label>
                  <span className="text-aws-orange font-bold text-lg">{rangeValue}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={safeMax}
                  step={1}
                  value={rangeValue}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-3 w-full accent-aws-orange"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5</span>
                  <span>{maxCount}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {[10, 20, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  disabled={n > maxCount}
                  className={`btn-secondary text-sm ${
                    count === n ? 'border-aws-orange text-aws-orange' : ''
                  }`}
                >
                  {n} questions
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCount(maxCount)}
                className="btn-secondary text-sm"
              >
                All ({maxCount})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartTimed}
                disabled={maxCount < 5}
                className="btn-primary text-base flex-1"
              >
                Start timed quiz →
              </button>
              <button
                type="button"
                onClick={handleStartGuided}
                disabled={maxCount < 5}
                className="btn-secondary text-base flex-1"
              >
                Start guided practice →
              </button>
              <button
                type="button"
                onClick={() => navigate(`/practice/browse?exam=${examId}`)}
                className="btn-secondary text-base"
              >
                Browse · {selectedExam.code} · Q&A
              </button>
            </div>
          </section>

          {recentThis.length > 0 && (
            <section className="card p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent attempts · this exam</h2>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-slate-500 hover:text-rose-400"
                >
                  Clear all history
                </button>
              </div>
              <AttemptList
                attempts={recentThis}
                thresholdResolver={(h) => getThresholdForExam(h.examId)}
              />
            </section>
          )}

          {examId && recentGlobal.length > 0 && (
            <section className="card p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Latest attempts · all certifications</h2>
              </div>
              <AttemptList
                attempts={recentGlobal}
                compact
                thresholdResolver={(h) => getThresholdForExam(h.examId)}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function getThresholdForExam(examId: string): number {
  return getExamBankMeta(examId)?.passThresholdPercent ?? PASS_THRESHOLD_PERCENT;
}

function AttemptList({
  attempts,
  compact,
  thresholdResolver,
}: {
  attempts: AttemptHistoryEntry[];
  compact?: boolean;
  thresholdResolver: (h: AttemptHistoryEntry) => number;
}) {
  return (
    <ul className="divide-y divide-slate-800">
      {attempts.map((h) => {
        const thr = thresholdResolver(h);
        return (
          <li
            key={h.id}
            className="py-3 flex items-center justify-between text-sm gap-3"
          >
            <div>
              <div className="font-semibold">
                {h.examCode} · {h.correctCount} / {h.totalQuestions} correct
              </div>
              <div className="text-xs text-slate-500">
                {new Date(h.finishedAt).toLocaleString()} ·{' '}
                {Math.round(h.durationSeconds / 60)} min
                {!compact && (
                  <>
                    {' '}
                    ·{' '}
                    {h.submittedReason === 'time_expired'
                      ? 'Auto-submit (timer)'
                      : 'Submitted'}
                  </>
                )}
              </div>
            </div>
            <span
              className={`text-lg font-bold shrink-0 ${
                h.scorePercent >= thr ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {h.scorePercent}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold text-aws-orange">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
