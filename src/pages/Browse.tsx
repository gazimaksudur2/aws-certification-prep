import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getQuestionsForExam, getTopicsForExam, listCatalog } from '../utils/exams';
import { 
  Search, 
  Filter, 
  BookOpen, 
  ChevronRight,
  ChevronDown,
  Layers,
  Hash,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ListChecks,
  Grid3x3,
  Sparkles
} from 'lucide-react';

type Filter = 'all' | 'single' | 'multi';

export function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const catalog = useMemo(() => listCatalog(), []);

  const examParam = searchParams.get('exam');
  const catalogEntry =
    catalog.find((e) => e.examId === examParam) ?? catalog[0] ?? null;
  const examId = catalogEntry?.examId ?? '';

  useEffect(() => {
    if (!catalogEntry || examParam) return;
    setSearchParams({ exam: catalogEntry.examId }, { replace: true });
  }, [catalogEntry, examParam, setSearchParams]);

  const allQuestions = useMemo(() => (examId ? getQuestionsForExam(examId) : []), [
    examId,
  ]);
  const topics = useMemo(() => (examId ? getTopicsForExam(examId) : ['All']), [
    examId,
  ]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [topic, setTopic] = useState('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allQuestions.filter((q) => {
      if (filter === 'single' && q.isMultiple) return false;
      if (filter === 'multi' && !q.isMultiple) return false;
      if (topic !== 'All' && q.topic !== topic) return false;
      if (!term) return true;
      if (q.question.toLowerCase().includes(term)) return true;
      return q.options.some((o) => o.text.toLowerCase().includes(term));
    });
  }, [allQuestions, search, filter, topic]);

  const toggle = (compositeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(compositeId)) next.delete(compositeId);
      else next.add(compositeId);
      return next;
    });
  };

  const examSelect = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('exam', id);
    setSearchParams(next);
    setTopic('All');
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setTopic('All');
  };

  const hasActiveFilters = search || filter !== 'all' || topic !== 'All';

  if (!examId || !catalogEntry) {
    return (
      <div className="card p-12 text-center border-slate-700/50 animate-fadeIn">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-slate-200">No exams found</h3>
        <p className="mt-2 text-sm text-slate-400">
          Add exams to the catalog and redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-slate-700/50 shadow-xl animate-slideUp">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/5 via-transparent to-aws-blue/5" />
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-aws-orange/5 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-aws-orange transition-colors mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Practice
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-aws-orange" />
              Browse Questions
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {catalogEntry.code} · answers shown for study reference
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">
                {allQuestions.length} questions
              </span>
            </div>
            <label className="text-xs text-slate-400 font-medium">
              <select
                value={examId}
                onChange={(e) => examSelect(e.target.value)}
                className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors min-w-[160px]"
              >
                {catalog.map((e) => (
                  <option key={e.examId} value={e.examId}>
                    {e.code} — {e.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 md:p-6 space-y-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 animate-slideUp">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions or options..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="md:col-span-3">
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-aws-orange focus:ring-1 focus:ring-aws-orange transition-colors appearance-none"
              >
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <div className="flex gap-1 bg-slate-900/50 border border-slate-700 rounded-lg p-1 h-full">
              {(['all', 'single', 'multi'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md capitalize transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-aws-orange to-aws-orange/90 text-white shadow-lg shadow-aws-orange/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'single' ? 'Single' : 'Multi'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-white">{filtered.length}</span>
            <span>results</span>
            {hasActiveFilters && (
              <span className="text-xs text-slate-500">
                (filtered from {allQuestions.length})
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Question List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center border-slate-700/50 bg-gradient-to-br from-slate-800/20 to-slate-900/20 animate-slideUp">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-slate-200">No questions found</h3>
          <p className="mt-2 text-sm text-slate-400">
            Try adjusting your search or filters
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 btn-secondary text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.slice(0, 200).map((q, index) => {
            const compositeKey = `${q.examId}-${q.id}`;
            const isOpen = expanded.has(compositeKey);
            return (
              <li 
                key={compositeKey} 
                className="card overflow-hidden border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 animate-slideUp"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <button
                  type="button"
                  onClick={() => toggle(compositeKey)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-800/30 transition-colors group"
                >
                  <span className="text-xs text-slate-500 font-mono mt-1 w-14 shrink-0 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    #{q.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange font-semibold">
                        {q.topic}
                      </span>
                      {q.isMultiple ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold flex items-center gap-1">
                          <Grid3x3 className="w-2.5 h-2.5" />
                          Multi
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Single
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 font-mono">
                        {q.examCode}
                      </span>
                    </div>
                    <div className="font-medium text-slate-100 group-hover:text-white transition-colors line-clamp-2">
                      {q.question}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <span className="text-xs">
                      {isOpen ? 'Hide' : 'Show'} answers
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-700/30 space-y-2 animate-slideUp">
                    <div className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-aws-orange" />
                      Answer Options
                    </div>
                    {q.options.map((opt) => {
                      const correct = q.correctAnswers.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`px-4 py-2.5 rounded-lg border flex items-center gap-3 text-sm transition-all ${
                            correct
                              ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                              : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              correct
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="flex-1 text-slate-200">{opt.text}</span>
                          {correct && (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > 200 && (
        <div className="card p-4 text-center border-slate-700/50 bg-slate-800/20">
          <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <ListChecks className="w-3.5 h-3.5" />
            Showing first 200 results. Use search/filter to narrow down.
          </div>
        </div>
      )}
    </div>
  );
}