import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PageTransition } from './components/PageTransition';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Learning } from './pages/Learning';
import { Quiz } from './pages/Quiz';
import { GuidedPractice } from './pages/GuidedPractice';
import { Results } from './pages/Results';
import { Browse } from './pages/Browse';

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.key}>
            <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
            <Route path="/practice" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/quiz" element={<PageTransition><Quiz /></PageTransition>} />
            <Route path="/guided" element={<PageTransition><GuidedPractice /></PageTransition>} />
            <Route path="/results" element={<PageTransition><Results /></PageTransition>} />
            <Route path="/practice/browse" element={<PageTransition><Browse /></PageTransition>} />
            <Route path="/learning" element={<PageTransition><Learning /></PageTransition>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <footer className="border-t border-slate-800/60 mt-auto">
        {/* Top divider glow */}
        <div className="h-px bg-gradient-to-r from-transparent via-aws-orange/30 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* Main footer row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Brand / project identity */}
            <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-aws-dark flex items-center justify-center text-aws-orange font-extrabold text-[10px] border border-aws-orange/20">
                  AWS
                </div>
                <span className="font-bold text-slate-200 text-sm">AWS Certification Hub</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Free, community-focused browser app for AWS exam prep — no account needed.
              </p>
            </div>

            {/* Links cluster */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Portfolio link */}
              <a
                href="https://gazimaksudur.me"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-aws-orange hover:border-aws-orange/40 hover:bg-slate-800 transition-all duration-200 text-xs font-medium group"
              >
                <span className="text-base">🌐</span>
                <span>gazimaksudur.me</span>
              </a>

              {/* GitHub repo link */}
              <a
                href="https://github.com/gazimaksudur2/aws-certification-prep"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all duration-200 text-xs font-medium group"
              >
                {/* GitHub SVG icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Source on GitHub</span>
              </a>

              {/* Star CTA */}
              <a
                href="https://github.com/gazimaksudur2/aws-certification-prep"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-aws-orange/10 border border-aws-orange/30 text-aws-orange hover:bg-aws-orange/20 hover:border-aws-orange/50 transition-all duration-200 text-xs font-semibold"
              >
                <span>⭐</span>
                <span>Star the repo</span>
              </a>
            </div>
          </div>

          {/* Attribution row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-800/60 text-xs text-slate-600">
            <span>
              Built with{' '}
              <span className="text-slate-500">React · TypeScript · Vite · Tailwind CSS</span>
            </span>
            <span className="text-slate-600">
              Crafted by{' '}
              <a
                href="https://gazimaksudur.me"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-aws-orange transition-colors font-medium"
              >
                Gazi Maksudur Rahman
              </a>
              {' '}· Not affiliated with AWS
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
