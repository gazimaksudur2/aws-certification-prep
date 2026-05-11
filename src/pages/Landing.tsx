import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestionsForExam, listCatalog } from '../utils/exams';

export function Landing() {
  const navigate = useNavigate();
  const catalog = useMemo(() => listCatalog(), []);

  const totalQuestions = useMemo(() => {
    return catalog.reduce((acc, e) => acc + getQuestionsForExam(e.examId).length, 0);
  }, [catalog]);

  return (
    <div className="space-y-8">
      <section className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/10 via-transparent to-aws-blue/10 pointer-events-none" />
        <div className="relative">
          <div className="text-xs font-semibold tracking-widest text-aws-orange uppercase">
            AWS certification exam prep
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">
            Learn the services. Practice the exam.
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            A focused hub for AWS certifications: take timed practice quizzes, track
            your progress locally, and study AWS services and exam tips (starting
            with CLF-C02).
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/40">
              {catalog.length} exams
            </span>
            <span className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/40">
              {totalQuestions} questions
            </span>
            <span className="px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900/40">
              Progress saved in localStorage
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6 md:p-7 flex flex-col">
          <div className="text-[11px] font-bold tracking-wider text-aws-orange uppercase">
            Practice Section
          </div>
          <div className="mt-2 text-xl font-extrabold">Timed quizzes</div>
          <p className="mt-2 text-sm text-slate-400 flex-1">
            Choose a certification, tune the topic and quiz length, then run a timed
            attempt. Review your score and detailed answers when you finish.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="btn-primary"
            >
              Go to Practice →
            </button>
            <button
              type="button"
              onClick={() => navigate('/practice/browse')}
              className="btn-secondary"
            >
              Question Bank
            </button>
          </div>
        </div>

        <div className="card p-6 md:p-7 flex flex-col">
          <div className="text-[11px] font-bold tracking-wider text-aws-orange uppercase">
            Learning Section
          </div>
          <div className="mt-2 text-xl font-extrabold">AWS service reference</div>
          <p className="mt-2 text-sm text-slate-400 flex-1">
            Browse AWS services grouped by clusters, search across descriptions and
            exam tips, and open a detail view to study without leaving the page.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="btn-primary"
            >
              Go to Learning →
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-lg font-bold">Why this helps</h2>
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
          <li className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="font-semibold text-slate-100">Curated question banks</div>
            <div className="text-slate-400 mt-1">
              Timed practice runs with a consistent scoring flow and a detailed review
              at the end.
            </div>
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="font-semibold text-slate-100">Structured service reference</div>
            <div className="text-slate-400 mt-1">
              Clustered AWS services with real-world use cases and exam tips for quick
              recall.
            </div>
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="font-semibold text-slate-100">Fast navigation</div>
            <div className="text-slate-400 mt-1">
              Jump between Home, Practice, and Learning at any time — without losing
              your place.
            </div>
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="font-semibold text-slate-100">Local progress tracking</div>
            <div className="text-slate-400 mt-1">
              Attempt history stays in your browser via localStorage — no sign-in.
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}

