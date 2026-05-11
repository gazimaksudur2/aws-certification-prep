import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-aws-orange/15 text-aws-orange'
      : 'text-slate-300 hover:text-white hover:bg-slate-800'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-aws-orange/15 text-aws-orange'
      : 'text-slate-200 hover:bg-slate-900/60'
  }`;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = useMemo(
    () => [
      { to: '/', label: 'Home', end: true as const },
      { to: '/practice', label: 'Practice' },
      { to: '/practice/browse', label: 'Question Bank' },
      { to: '/learning', label: 'Learning' },
    ],
    [],
  );

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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={linkClass}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            className="btn-ghost px-3 py-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className="font-mono text-lg leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur">
          <div id="mobile-nav" className="max-w-5xl mx-auto px-4 py-3">
            <div className="card p-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
