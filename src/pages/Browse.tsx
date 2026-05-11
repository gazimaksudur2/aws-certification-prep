import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getQuestionsForExam, getTopicsForExam, listCatalog } from '../utils/exams';

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

  if (!examId || !catalogEntry) {
    return (
      <div className="card p-10 text-center text-slate-400">
        No exams found. Add exams to the catalog and redeploy.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/practice')}
            className="text-xs text-slate-500 hover:text-aws-orange mb-2"
          >
            ← Practice
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold">Browse Questions</h1>
          <p className="text-sm text-slate-400">
            {catalogEntry.code} · answers shown for study only.
          </p>
        </div>
        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold block w-full md:w-64">
          Exam
          <select
            value={examId}
            onChange={(e) => examSelect(e.target.value)}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-aws-orange"
          >
            {catalog.map((e) => (
              <option key={e.examId} value={e.examId}>
                {e.code} — {e.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="card p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or options..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-aws-orange"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-aws-orange"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 flex gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
          {(['all', 'single', 'multi'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md capitalize transition-colors ${
                filter === f
                  ? 'bg-aws-orange text-aws-darker'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <div className="text-sm text-slate-500">
        Showing {filtered.length} of {allQuestions.length} · {examId}
      </div>

      <ul className="space-y-3">
        {filtered.slice(0, 200).map((q) => {
          const compositeKey = `${q.examId}-${q.id}`;
          const isOpen = expanded.has(compositeKey);
          return (
            <li key={compositeKey} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(compositeKey)}
                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-900"
              >
                <span className="text-xs text-slate-500 font-mono mt-1 w-12 shrink-0">
                  {q.examCode} #{q.id}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange font-semibold">
                      {q.topic}
                    </span>
                    {q.isMultiple && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-aws-blue/20 text-sky-300 font-semibold">
                        Multi
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-slate-100">{q.question}</div>
                </div>
                <span className="text-slate-500 mt-1">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-2 animate-fade-in">
                  {q.options.map((opt) => {
                    const correct = q.correctAnswers.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`px-3 py-2 rounded-lg border flex gap-3 items-start text-sm ${
                          correct
                            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100'
                            : 'border-slate-800 bg-slate-900/40 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                            correct
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {correct && (
                          <span className="text-emerald-400 text-xs font-semibold">
                            ✓
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

      {filtered.length > 200 && (
        <div className="text-center text-xs text-slate-500 pt-2">
          Showing first 200 results. Use search/filter to narrow down.
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center text-slate-500 py-12">
          No questions match your filters.
        </div>
      )}
    </div>
  );
}
