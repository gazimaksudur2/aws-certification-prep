# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

### Added
- Animated page transitions (framer-motion `AnimatePresence`)
- Keyboard shortcuts in timed quiz: `A–D` to select options, `Enter` to confirm, `S` to skip
- Toast notifications in guided practice mode showing correct/incorrect feedback
- Attempt history badge in navbar showing total saved quiz attempts
- Enhanced footer with portfolio link, GitHub source pill, and star CTA
- Rich Open Graph / Twitter Card meta tags for social sharing
- MIT License

### Changed
- Improved README with badge row, enriched Acknowledgement section, and portfolio link
- Navbar now shows portfolio link on desktop (subtle chip)

---

## [1.0.0] — 2026-11-01

### Added
- Multi-certification support: CLF-C02 and SAA-C03
- Timed quiz mode (120 s × questions) with countdown, skip, prev/next navigation
- Guided practice mode with instant correct/incorrect feedback per question
- Topic and question-count filtering
- Results page: score, pass/fail threshold, time spent, topic breakdown, per-question review
- Attempt history via `localStorage` (up to 10 per exam)
- Question bank: search, filter, and reveal answers
- Learning study hub: clustered AWS services, priority badges, exam tips, Top-50 checklist
- No login required — 100% client-side

### Tech
- React 18, TypeScript 5, Vite 5, React Router 6, Tailwind CSS 3, framer-motion, lucide-react
- Deployed on Netlify with SPA fallback config
