import { Link, NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-aws-orange/15 text-aws-orange'
      : 'text-slate-300 hover:text-white hover:bg-slate-800'
  }`;

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-aws-dark flex items-center justify-center text-aws-orange font-extrabold text-xs">
            AWS
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm group-hover:text-aws-orange transition-colors">
              Certification Hub
            </div>
            <div className="text-[10px] text-slate-500 -mt-0.5">
              Multi-cert practice quizzes
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/practice" className={linkClass}>
            Practice
          </NavLink>
          <NavLink to="/practice/browse" className={linkClass}>
            Question Bank
          </NavLink>
          <NavLink to="/learning" className={linkClass}>
            Learning
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
