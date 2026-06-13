import type { Question } from '../types';

/**
 * Builds a Google search URL for a question with options and a justification ask.
 */
export function buildLearnMoreUrl(question: Question): string {
  const optionsBlock = question.options
    .map((opt) => `${opt.id}. ${opt.text}`)
    .join('\n');

  const query = [
    question.question,
    '',
    'Options:',
    optionsBlock,
    '',
    `Which option(s) is correct for this ${question.examCode} certification question and why? Explain the justification.`,
  ].join('\n');

  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Opens the learn-more search in a new browser tab. */
export function openLearnMore(question: Question): void {
  window.open(buildLearnMoreUrl(question), '_blank', 'noopener,noreferrer');
}
