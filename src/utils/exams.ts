import catalogJson from '../data/exams/catalog.json';
import clfBank from '../data/exams/aws-clf-c02.json';
import saaBank from '../data/exams/aws-saa-c03.json';
import soaBank from '../data/exams/aws-soa-c03.json';

import type { ExamBankJson, ExamCatalogEntry, Question } from '../types';

const BANK_MAP = {
  [clfBank.examId]: clfBank as ExamBankJson,
  [saaBank.examId]: saaBank as ExamBankJson,
  [soaBank.examId]: soaBank as ExamBankJson,
} as Record<string, ExamBankJson>;

function normalizeExamBank(raw: ExamBankJson): Question[] {
  return raw.questions.map((q) => ({
    ...q,
    examId: raw.examId,
    examCode: raw.code,
  }));
}

export function listCatalog(): ExamCatalogEntry[] {
  return (catalogJson as { exams: ExamCatalogEntry[] }).exams.filter((e) =>
    Boolean(BANK_MAP[e.examId]),
  );
}

export function getQuestionsForExam(examId: string): Question[] {
  const raw = BANK_MAP[examId];
  if (!raw) return [];
  return normalizeExamBank(raw);
}

export function getExamBankMeta(examId: string): ExamBankJson | null {
  return BANK_MAP[examId] ?? null;
}

export function getTopicsForExam(examId: string): string[] {
  const qs = getQuestionsForExam(examId);
  const set = new Set(qs.map((q) => q.topic));
  return ['All', ...Array.from(set).sort()];
}
