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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart3, 
  BookOpen,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Timer,
  Layers,
  ListChecks
} from 'lucide-react';

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
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 border border-slate-700/50 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/5 via-transparent to-aws-blue/5" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-aws-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-aws-blue/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aws-orange/10 border border-aws-orange/20 text-aws-orange text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3 h-3" />
              Certification exam practice hub
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Practice. <span className="text-transparent bg-clip-text bg-gradient-to-r from-aws-orange to-aws-blue">Track.</span> Pass.
            </h1>
            <p className="mt-4 text-slate-300 max-w-2xl text-lg leading-relaxed">
              Pick a credential, tune topic and quiz length, then take a timed run.
              You get{' '}
              <span className="text-aws-orange font-semibold inline-flex items-center gap-1">
                <Timer className="w-4 h-4" />
                two minutes × each question
              </span>{' '}
              to finish. Detailed scoring unlocks after the attempt ends.
            </p>
          </div>
          
          <div className="flex-shrink-0 flex gap-4">
            <div className="hidden md:flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-slate-700/50">
              <Award className="w-8 h-8 text-aws-orange" />
              <div>
                <div className="text-xs text-slate-400">Total Questions</div>
                <div className="text-2xl font-bold text-white">
                  {catalog.reduce((acc, e) => acc + getQuestionsForExam(e.examId).length, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {!examId && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-aws-orange" />
              Choose your certification
            </h2>
            <span className="text-sm text-slate-400">{catalog.length} available</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((e, index) => {
              const total = getQuestionsForExam(e.examId).length;
              const st = statsForExam(e.examId);
              return (
                <motion.button
                  key={e.examId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  type="button"
                  onClick={() => handleExamPick(e.examId)}
                  className="group relative card p-6 text-left hover:border-aws-orange/50 transition-all duration-300 hover:shadow-lg hover:shadow-aws-orange/5 hover:-translate-y-1"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-aws-orange/60 uppercase bg-aws-orange/10 px-2 py-0.5 rounded">
                      {e.code}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                    {e.title}
                  </div>
                  
                  {e.description && (
                    <div className="mt-2 text-sm text-slate-400 line-clamp-2">
                      {e.description}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3 h-3" />
                      {total} questions
                    </span>
                    {st.totalAttempts > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">{st.totalAttempts} attempts</span>
                        <span className="text-slate-600">·</span>
                        <span>avg {st.avgScore}%</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-aws-orange" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      )}

      {examId && selectedExam && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-aws-orange/10">
                    <Layers className="w-5 h-5 text-aws-orange" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Question Pool</div>
                    <div className="text-2xl font-bold text-white">{allQuestions.length}</div>
                    <div className="text-xs text-slate-500">{selectedExam.code}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Your Attempts</div>
                    <div className="text-2xl font-bold text-white">{statsThis.totalAttempts}</div>
                    {statsThis.totalAttempts > 0 && (
                      <div className="text-xs text-slate-500">
                        Best {statsThis.bestScore}% · Avg {statsThis.avgScore}%
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Global Attempts</div>
                    <div className="text-2xl font-bold text-white">{statsGlobal.totalAttempts}</div>
                    {statsGlobal.totalAttempts > 0 && (
                      <div className="text-xs text-slate-500">Avg {statsGlobal.avgScore}%</div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Pass Threshold</div>
                    <div className="text-2xl font-bold text-white">{passThresholdPercent}%</div>
                    <div className="text-xs text-slate-500">{selectedExam.code}</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quiz Setup Card */}
            <div className="card p-6 md:p-8 space-y-6 border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {selectedExam.title}
                    <span className="text-sm font-normal text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                      {selectedExam.code}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Results use a{' '}
                    <span className="text-aws-orange font-semibold">{passThresholdPercent}%</span>{' '}
                    pass benchmark
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExamId(null)}
                  className="btn-secondary text-sm hover:bg-slate-700/50 transition-colors"
                >
                  ← Change certification
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Topic
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-2 w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors"
                  >
                    {topics.map((t) => (
                      <option key={t} value={t}>
                        {t}{' '}
                        {t !== 'All'
                          ? `(${allQuestions.filter((q) => q.topic === t).length})`
                          : `(${allQuestions.length})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                      <ListChecks className="w-3 h-3" />
                      Number of Questions
                    </label>
                    <span className="text-aws-orange font-bold text-2xl">{rangeValue}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={safeMax}
                    step={1}
                    value={rangeValue}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-3 w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aws-orange"
                    style={{
                      background: `linear-gradient(to right, #f97316 0%, #f97316 ${(rangeValue - 5) / (safeMax - 5) * 100}%, #334155 ${(rangeValue - 5) / (safeMax - 5) * 100}%, #334155 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5</span>
                    <span>{maxCount} questions available</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[10, 20, 50, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(Math.min(n, maxCount))}
                    disabled={n > maxCount}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      count === Math.min(n, maxCount) && n <= maxCount
                        ? 'bg-aws-orange text-white shadow-lg shadow-aws-orange/20'
                        : n <= maxCount
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCount(maxCount)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    count === maxCount
                      ? 'bg-aws-orange text-white shadow-lg shadow-aws-orange/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All ({maxCount})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={handleStartTimed}
                  disabled={maxCount < 5}
                  className="btn-primary text-base flex-1 group relative overflow-hidden"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    Start timed quiz
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleStartGuided}
                  disabled={maxCount < 5}
                  className="btn-secondary text-base flex-1 group"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Start guided practice
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/practice/browse?exam=${examId}`)}
                  className="btn-secondary text-base flex-1 bg-slate-800/50 hover:bg-slate-700/50"
                >
                  <span className="flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Browse Q&A
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Attempts */}
            {recentThis.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6 md:p-8 border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-aws-orange" />
                    Recent attempts · this exam
                  </h2>
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear all history
                  </button>
                </div>
                <AttemptList
                  attempts={recentThis}
                  thresholdResolver={(h) => getThresholdForExam(h.examId)}
                />
              </motion.section>
            )}

            {examId && recentGlobal.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card p-6 md:p-8 border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Latest attempts · all certifications
                  </h2>
                </div>
                <AttemptList
                  attempts={recentGlobal}
                  compact
                  thresholdResolver={(h) => getThresholdForExam(h.examId)}
                />
              </motion.section>
            )}
          </motion.div>
        </AnimatePresence>
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
    <ul className="divide-y divide-slate-800/50">
      {attempts.map((h, index) => {
        const thr = thresholdResolver(h);
        const passed = h.scorePercent >= thr;
        return (
          <motion.li
            key={h.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="py-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-lg transition-colors -mx-3"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`p-1.5 rounded-full flex-shrink-0 ${passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                {passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {h.examCode}
                  {!compact && (
                    <span className="text-xs font-normal text-slate-400">
                      · {h.correctCount} / {h.totalQuestions} correct
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>{new Date(h.finishedAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{Math.round(h.durationSeconds / 60)} min</span>
                  {!compact && (
                    <>
                      <span>·</span>
                      <span className={h.submittedReason === 'time_expired' ? 'text-amber-400' : 'text-slate-400'}>
                        {h.submittedReason === 'time_expired' ? '⏱ Auto-submit' : '✓ Submitted'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={`text-xl font-bold flex-shrink-0 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {h.scorePercent}%
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

