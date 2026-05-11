import { Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { Learning } from './pages/Learning';
import { Quiz } from './pages/Quiz';
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
          <Route path="/results" element={<Results />} />
          <Route path="/practice/browse" element={<Browse />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-500 py-6">
        Timed certification quizzes — results and attempt history remain in your
        browser via localStorage.
      </footer>
    </div>
  );
}
