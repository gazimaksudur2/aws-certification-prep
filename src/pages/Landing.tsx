import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestionsForExam, listCatalog } from '../utils/exams';
import { 
  BookOpen, 
  Clock, 
  Database, 
  LayoutDashboard,
  Target,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Award,
  BarChart3,
  Lightbulb,
  Zap,
  Shield,
  Rocket
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const catalog = useMemo(() => listCatalog(), []);

  const totalQuestions = useMemo(() => {
    return catalog.reduce((acc, e) => acc + getQuestionsForExam(e.examId).length, 0);
  }, [catalog]);

  const stats = [
    { label: 'Certifications', value: catalog.length, icon: Award, color: 'text-aws-orange' },
    { label: 'Practice Questions', value: totalQuestions, icon: Database, color: 'text-blue-400' },
    { label: 'Service Clusters', value: '6+', icon: LayoutDashboard, color: 'text-emerald-400' },
    { label: 'Local Progress', value: 'Auto-saved', icon: Shield, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 border border-slate-700/50 shadow-2xl animate-slideUp">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/10 via-transparent to-aws-blue/10" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-aws-orange/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-aws-blue/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aws-orange/10 border border-aws-orange/20 text-aws-orange text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            AWS certification exam prep
          </div>
          
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Learn the services.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aws-orange to-aws-blue">
              Practice the exam.
            </span>
          </h1>
          
          <p className="mt-4 text-slate-300 max-w-2xl text-lg leading-relaxed">
            A focused hub for AWS certifications: take timed practice quizzes, track
            your progress locally, and study AWS services with real-world exam tips.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 text-xs text-slate-400">
              <Award className="w-3.5 h-3.5" />
              {catalog.length} exams
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5" />
              {totalQuestions} questions
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              Progress saved locally
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slideUp">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="card p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 animate-scaleIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}/10`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                  <div className="text-2xl font-bold text-white truncate">{stat.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
        <div className="group card p-6 md:p-8 flex flex-col bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 hover:border-aws-orange/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-aws-orange/5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-wider text-aws-orange uppercase flex items-center gap-2">
              <Target className="w-4 h-4" />
              Practice Section
            </div>
            <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
              Timed
            </div>
          </div>
          
          <h2 className="mt-3 text-2xl font-extrabold flex items-center gap-2">
            Timed quizzes
            <span className="text-sm font-normal text-slate-400">⏱️</span>
          </h2>
          
          <p className="mt-2 text-sm text-slate-400 flex-1 leading-relaxed">
            Choose a certification, tune the topic and quiz length, then run a timed
            attempt. Review your score and detailed answers when you finish.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="btn-primary group flex items-center gap-2 px-6"
            >
              Start Practice
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/practice/browse')}
              className="btn-secondary group flex items-center gap-2 px-6"
            >
              <BookOpen className="w-4 h-4" />
              Question Bank
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 pt-4 border-t border-slate-700/30">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              2 min per question
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Track progress
            </span>
          </div>
        </div>

        <div className="group card p-6 md:p-8 flex flex-col bg-gradient-to-br from-slate-800/30 to-slate-900/30 border-slate-700/50 hover:border-aws-blue/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-aws-blue/5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-wider text-aws-blue uppercase flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Learning Section
            </div>
            <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-semibold tracking-wider uppercase">
              Reference
            </div>
          </div>
          
          <h2 className="mt-3 text-2xl font-extrabold flex items-center gap-2">
            AWS service reference
            <span className="text-sm font-normal text-slate-400">📚</span>
          </h2>
          
          <p className="mt-2 text-sm text-slate-400 flex-1 leading-relaxed">
            Browse AWS services grouped by clusters, search across descriptions and
            exam tips, and open a detail view to study without leaving the page.
          </p>
          
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="btn-primary bg-gradient-to-r from-aws-blue to-blue-600 hover:from-aws-blue hover:to-blue-700 group flex items-center gap-2 px-6"
            >
              <Zap className="w-4 h-4" />
              Explore Services
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 pt-4 border-t border-slate-700/30">
            <span className="flex items-center gap-1">
              <LayoutDashboard className="w-3 h-3" />
              Clustered by domain
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Exam tips included
            </span>
          </div>
        </div>
      </div>

      {/* Why This Helps Section */}
      <section className="card p-6 md:p-8 border-slate-700/50 bg-gradient-to-br from-slate-800/20 to-slate-900/20 animate-slideUp">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-aws-orange/10 to-aws-blue/10">
            <Rocket className="w-6 h-6 text-aws-orange" />
          </div>
          <h2 className="text-2xl font-bold">Why this helps</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-aws-orange/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aws-orange/10 text-xl">
                📝
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                Curated questions
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Timed practice runs with a consistent scoring flow and detailed review
              at the end.
            </p>
          </div>

          <div className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-aws-blue/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aws-blue/10 text-xl">
                📚
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                Service reference
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Clustered AWS services with real-world use cases and exam tips for quick
              recall.
            </p>
          </div>

          <div className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-emerald-400/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-xl">
                🚀
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                Fast navigation
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Jump between Home, Practice, and Learning at any time without losing
              your place.
            </p>
          </div>

          <div className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 hover:border-purple-400/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-xl">
                💾
              </div>
              <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                Local tracking
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Attempt history stays in your browser via localStorage — no sign-in
              required.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-aws-orange/20 via-aws-blue/20 to-purple-500/20 border border-slate-700/50 p-6 md:p-8 animate-slideUp">
        <div className="absolute inset-0 bg-gradient-to-br from-aws-orange/5 via-transparent to-aws-blue/5" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-aws-orange" />
              Ready to start your AWS certification journey?
            </h3>
            <p className="text-sm text-slate-400">
              Choose a certification and begin practicing today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/practice')}
            className="btn-primary group flex items-center gap-2 px-6 py-3 whitespace-nowrap"
          >
            Get Started Now
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}