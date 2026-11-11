import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Learning } from './pages/Learning';
import { Quiz } from './pages/Quiz';
import { GuidedPractice } from './pages/GuidedPractice';
import { Results } from './pages/Results';
import { Browse } from './pages/Browse';

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-10">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/practice" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/guided" element={<GuidedPractice />} />
          <Route path="/results" element={<Results />} />
          <Route path="/practice/browse" element={<Browse />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800/80 text-center text-xs text-slate-500 py-8 px-4 space-y-3">
        <p className="leading-relaxed">
          Timed certification quizzes — results and attempt history remain in your
          browser via localStorage.
        </p>
        <p className="leading-relaxed">
          👋 Created and maintained with care by{' '}
          <a
            href="https://gazimaksudur.me"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 hover:text-aws-orange transition-colors"
          >
            Gazi Maksudur Rahman
          </a>
          {' · '}
          <a
            href="https://github.com/gazimaksudur2/aws-certification-prep"
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 hover:text-aws-orange transition-colors"
          >
            💻 View on GitHub
          </a>
        </p>
        <p className="text-slate-400 leading-relaxed">
          ⭐ Finding this resource helpful?{' '}
          <a
            href="https://github.com/gazimaksudur2/aws-certification-prep"
            target="_blank"
            rel="noreferrer"
            className="text-aws-orange hover:text-orange-300 font-medium transition-colors"
          >
            Star the repository
          </a>{' '}
          and help more AWS learners discover it. 🙏
        </p>
      </footer>
    </div>
  );
}
