import type { Question } from '../types';
import { OptionButton } from './OptionButton';

interface Props {
  question: Question;
  selected: string[];
  /** When true, reveal which options are correct / incorrect. */
  showSolution: boolean;
  onToggleOption: (id: string) => void;
}

export function QuestionCard({
  question,
  selected,
  showSolution,
  onToggleOption,
}: Props) {
  // Questions with a double newline have a scenario prefix (e.g. SOA-C03).
  // Split it so the scenario renders as a distinct paragraph.
  const hasScenario = question.question.includes('\n\n');
  const [scenarioPart, questionPart] = hasScenario
    ? question.question.split('\n\n')
    : [null, question.question];

  // Rationales are present on SOA-C03 options. Only shown after solution is revealed.
  const hasRationales = showSolution && question.options.some((o) => o.rationale);

  return (
    <div className="card p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-aws-orange/15 text-aws-orange font-semibold">
          {question.topic}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
          {question.examCode}
        </span>
        {question.isMultiple && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-aws-blue/20 text-sky-300 font-semibold">
            Multi-select · choose all that apply
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">#{question.id}</span>
      </div>

      {/* Scenario prefix (SOA-C03 and similar multi-paragraph stems) */}
      {hasScenario && scenarioPart && (
        <p className="text-sm text-slate-300 leading-relaxed mb-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 whitespace-pre-line">
          {scenarioPart}
        </p>
      )}

      <h2 className="text-lg md:text-xl font-semibold leading-snug mb-6">
        {questionPart}
      </h2>

      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = question.correctAnswers.includes(opt.id);
          return (
            <OptionButton
              key={opt.id}
              letter={opt.id}
              text={opt.text}
              selected={isSelected}
              showGrading={showSolution}
              isCorrect={isCorrect}
              isIncorrectSelection={
                showSolution && isSelected && !isCorrect
              }
              onClick={() => onToggleOption(opt.id)}
              disabled={showSolution}
            />
          );
        })}
      </div>

      {/* Per-option rationales (SOA-C03 only, shown after solution is revealed) */}
      {hasRationales && (
        <div className="mt-5 space-y-2 border-t border-slate-700/40 pt-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Explanations
          </p>
          {question.options.map((opt) => {
            if (!opt.rationale) return null;
            const isCorrect = question.correctAnswers.includes(opt.id);
            return (
              <div
                key={opt.id}
                className={`flex gap-3 text-sm rounded-lg px-3 py-2.5 border ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-700/30 bg-slate-900/30'
                }`}
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5 ${
                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {opt.id}
                </span>
                <p className={`leading-relaxed ${isCorrect ? 'text-slate-200' : 'text-slate-400'}`}>
                  {opt.rationale}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
