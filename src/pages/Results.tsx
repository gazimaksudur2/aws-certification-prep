import { useMemo, useRef, useEffect, useState } from 'react';
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
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  SkipForward,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Target,
  Timer,
  AlertCircle,
  PieChart,
  ListChecks
} from 'lucide-react';

type RowStatus =
  | 'correct'
  | 'incorrect'
  | 'skipped'
  | 'unanswered';

function rowBadge(status: RowStatus) {
  switch (status) {
    case 'correct':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    case 'incorrect':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/20';
    case 'skipped':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
    default:
      return 'bg-slate-700 text-slate-300 border-slate-600';
  }
}

function rowIcon(status: RowStatus) {
  switch (status) {
    case 'correct':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'incorrect':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'skipped':
      return <SkipForward className="w-3.5 h-3.5" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

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

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!session || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-aws-orange/20 border-t-aws-orange rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-400">Loading results…</p>
        </div>
      </div>
    );
  }

  const isGuided = session.mode === 'guided';
  const passed = summary.scorePercent >= summary.passThreshold;
  const statusColors = passed 
    ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' 
    : 'from-rose-500/20 to-rose-500/5 border-rose-500/30';

  const submitNote = isGuided
    ? 'Guided practice summary — instant feedback was shown after each question. This run was not saved to attempt history.'
    : summary.submittedReason === 'time_expired'
      ? 'Auto-submitted when the allotted time elapsed.'
      : 'You chose to submit (or answered through the final question without running out of time).';

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Header */}
      <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 border ${statusColors} shadow-xl animate-slideUp`}>
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/5 via-transparent to-aws-blue/5" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-aws-orange/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-aws-blue/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <ScoreBadge
            correct={summary.correctCount}
            total={summary.total}
            passThresholdPercent={summary.passThreshold}
          />
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  passed
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {passed ? <Award className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                {passed ? 'Passed' : 'Below pass mark'}
              </div>
            </div>
            
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold flex items-center gap-3 flex-wrap">
              {summary.examCode}
              <span className="text-lg font-normal text-slate-400">
                · {isGuided ? 'guided practice' : 'timed quiz'}
              </span>
            </h1>
            
            <p className="mt-1 text-sm text-aws-orange flex items-center gap-2 justify-center md:justify-start">
              <BookOpen className="w-3.5 h-3.5" />
              {summary.examTitle}
            </p>
            
            <p className="mt-3 text-sm text-slate-400 max-w-2xl">
              {submitNote}
            </p>

            <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {!isGuided && (
                <Stat 
                  label="Allowed time" 
                  value={formatHm(summary.timeLimitSeconds)} 
                  icon={Clock}
                />
              )}
              <Stat
                label="Time spent"
                value={`${Math.floor(summary.durationSeconds / 60)}m ${summary.durationSeconds % 60}s`}
                icon={Timer}
              />
              <Stat
                label="Correct"
                value={summary.correctCount.toString()}
                positive
                icon={CheckCircle2}
              />
              <Stat
                label="Incorrect"
                value={summary.incorrectCount.toString()}
                negative
                icon={XCircle}
              />
              <Stat
                label="Skipped / blank"
                value={(summary.skippedCount + summary.unansweredCount).toString()}
                icon={SkipForward}
              />
              <Stat
                label="Pass bar"
                value={`${summary.passThreshold}%`}
                icon={Target}
              />
            </dl>

            <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => {
                  reset();
                  navigate('/practice');
                }}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <BookOpen className="w-4 h-4" />
                Back to certifications
              </button>
              <button
                type="button"
                onClick={() => navigate(`/practice/browse?exam=${summary.examId}`)}
                className="btn-secondary flex items-center gap-2 px-6"
              >
                <ListChecks className="w-4 h-4" />
                Browse · {summary.examCode}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Topic Breakdown */}
      {summary.byTopic.length > 1 && (
        <section className="card p-6 md:p-8 border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-aws-orange/10">
              <PieChart className="w-5 h-5 text-aws-orange" />
            </div>
            <h2 className="text-xl font-bold">Strength by topic</h2>
          </div>
          <div className="space-y-4">
            {summary.byTopic.map(([topicLabel, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              const passedTopic = pct >= summary.passThreshold;
              return (
                <div key={topicLabel} className="group">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {topicLabel}
                    </span>
                    <span className="text-slate-400 flex items-center gap-2">
                      <span>{stats.correct} / {stats.total}</span>
                      <span className={`font-semibold ${passedTopic ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pct}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        passedTopic ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'
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

      {/* Detailed Review */}
      <section className="card p-6 md:p-8 border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-aws-blue/10">
              <BarChart3 className="w-5 h-5 text-aws-blue" />
            </div>
            <h2 className="text-xl font-bold">
              Detailed review
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({summary.total} questions)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5" />
            Click to expand
          </div>
        </div>

        <ul className="space-y-4">
          {summary.rows.map((row, idx) => {
            const isExpanded = expandedQuestions.has(idx);
            const status = row.status;
            
            return (
              <li
                key={`${row.q.examId}-${row.q.id}-${idx}`}
                className={`rounded-xl border transition-all duration-300 ${
                  status === 'correct'
                    ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                    : status === 'incorrect'
                    ? 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40'
                    : status === 'skipped'
                    ? 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
                    : 'border-slate-700/30 bg-slate-800/20 hover:border-slate-700/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(idx)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3 group"
                >
                  <span className={`p-1 rounded-full flex-shrink-0 ${rowBadge(status)}`}>
                    {rowIcon(status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${rowBadge(status)}`}>
                        {rowLabel(status)}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange font-semibold">
                        {row.q.topic}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono ml-auto flex items-center gap-1">
                        <span>#{idx + 1}</span>
                        <span className="text-slate-600">·</span>
                        <span>#{row.q.id}</span>
                      </span>
                    </div>
                    <p className="font-semibold text-slate-100 group-hover:text-white transition-colors line-clamp-2">
                      {row.q.question}
                    </p>
                  </div>
                  <div className="text-slate-500 mt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-700/30 space-y-4 animate-slideUp">
                    <div className="space-y-2.5">
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

                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-700/30">
                      <div>
                        <dt className="uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                          <span className="text-slate-400">📝</span>
                          Your selections
                        </dt>
                        <dd className="font-mono text-slate-200 mt-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50">
                          {row.status === 'skipped'
                            ? '— (skipped)'
                            : row.selected.length
                              ? row.selected.join(', ')
                              : '— (blank)'}
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wider text-emerald-500/80 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Authoritative answers
                        </dt>
                        <dd className="text-slate-200 mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono">
                          {row.q.correctAnswers.join(', ')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </li>
            );
          })}
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
  icon: Icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  icon?: React.ElementType;
}) {
  const valueClass = positive
    ? 'text-emerald-400'
    : negative
      ? 'text-rose-400'
      : 'text-slate-100';
  return (
    <div className="bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
      <dt className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
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