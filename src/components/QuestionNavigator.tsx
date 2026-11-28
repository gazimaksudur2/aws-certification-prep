import type { AnsweredQuestion } from '../types';

export function isQuestionAnswered(
  answers: Record<number, AnsweredQuestion>,
  questionId: number,
): boolean {
  const a = answers[questionId];
  return Boolean(a && !a.skipped && a.selectedAnswers.length > 0);
}

function paletteButtonClass(opts: {
  answered: boolean;
  flagged: boolean;
  current: boolean;
}): string {
  const base =
    'relative h-9 min-w-[2.25rem] px-2 rounded-md text-sm font-semibold tabular-nums border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aws-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

  let tone: string;
  if (opts.answered) {
    tone =
      'bg-sky-500/25 border-sky-400/50 text-sky-100 hover:bg-sky-500/35';
  } else {
    tone =
      'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200';
  }

  const current = opts.current
    ? ' ring-2 ring-aws-orange ring-offset-2 ring-offset-slate-950 z-[1]'
    : '';

  const flagged = opts.flagged ? ' shadow-[inset_0_0_0_1px_rgba(251,191,36,0.55)]' : '';

  return `${base} ${tone}${current}${flagged}`;
}

export function QuestionNavigator({
  questionIds,
  currentIndex,
  answers,
  flagged,
  onGoTo,
}: {
  questionIds: number[];
  currentIndex: number;
  answers: Record<number, AnsweredQuestion>;
  flagged: Record<number, boolean>;
  onGoTo: (index: number) => void;
}) {
  return (
    <nav
      className="space-y-3"
      aria-label="Question navigator"
    >
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2.5">
        {questionIds.map((id, index) => {
          const answered = isQuestionAnswered(answers, id);
          const isFlagged = Boolean(flagged[id]);
          const current = index === currentIndex;
          const parts = [
            `Question ${index + 1}`,
            answered ? 'answered' : 'unanswered',
            isFlagged ? 'flagged for review' : 'not flagged',
          ];
          if (current) parts.push('current');

          return (
            <button
              key={id}
              type="button"
              onClick={() => onGoTo(index)}
              className={paletteButtonClass({
                answered,
                flagged: isFlagged,
                current,
              })}
              aria-label={parts.join(', ')}
              aria-current={current ? 'true' : undefined}
            >
              {index + 1}
              {isFlagged && (
                <span
                  className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-slate-950"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 select-none">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-slate-700 bg-slate-900" aria-hidden="true" />
          Unanswered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-sky-400/50 bg-sky-500/25" aria-hidden="true" />
          Answered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          Flagged
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border-2 border-aws-orange bg-slate-900" aria-hidden="true" />
          Current
        </span>
      </div>
    </nav>
  );
}
