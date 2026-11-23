import catalogJson from '../data/exams/catalog.json';
import clfBank from '../data/exams/aws-clf-c02.json';
import saaBank from '../data/exams/aws-saa-c03.json';

import type { ExamBankJson, ExamCatalogEntry, Question } from '../types';

const BANK_MAP = {
  [clfBank.examId]: clfBank as ExamBankJson,
  [saaBank.examId]: saaBank as ExamBankJson,
} as Record<string, ExamBankJson>;

function normalizeExamBank(raw: ExamBankJson): Question[] {
  return raw.questions.map((q) => ({
    ...q,
    examId: raw.examId,
    examCode: raw.code,
  }));
}

function allCatalogEntries(): ExamCatalogEntry[] {
  return (catalogJson as { exams: ExamCatalogEntry[] }).exams;
}

/** Full catalog (learning packs, practice exams, coming-soon). */
export function listCatalog(): ExamCatalogEntry[] {
  return allCatalogEntries();
}

export function getCatalogEntry(examId: string): ExamCatalogEntry | null {
  return allCatalogEntries().find((e) => e.examId === examId) ?? null;
}

export function hasPracticeBank(examId: string): boolean {
  return Boolean(BANK_MAP[examId]);
}

export function isPracticeEnabled(entry: ExamCatalogEntry): boolean {
  if (entry.practice?.enabled === false) return false;
  return hasPracticeBank(entry.examId);
}

export function isLearningEnabled(entry: ExamCatalogEntry): boolean {
  return entry.learning?.enabled === true && Boolean(entry.learning.dataPath);
}

/** Exams that can start timed/guided practice (bank present). */
export function listPracticeCatalog(): ExamCatalogEntry[] {
  return allCatalogEntries().filter(isPracticeEnabled);
}

/**
 * Learning picker entries.
 * Dedupes by dataPath so CLF + SAA (same combined pack) collapse to one card
 * preferring the dedicated pack id when present.
 */
export function listLearningCatalog(): ExamCatalogEntry[] {
  const learning = allCatalogEntries().filter(isLearningEnabled);
  const byPath = new Map<string, ExamCatalogEntry>();

  for (const entry of learning) {
    const path = entry.learning!.dataPath;
    const existing = byPath.get(path);
    if (!existing) {
      byPath.set(path, entry);
      continue;
    }
    // Prefer explicit pack entries (packOf) or combined id over individual exams.
    const preferNew =
      Boolean(entry.learning?.packOf?.length) ||
      entry.examId.includes('combined') ||
      (!existing.learning?.packOf?.length && !existing.examId.includes('combined') && entry.code.includes('+'));
    if (preferNew) byPath.set(path, entry);
  }

  return Array.from(byPath.values());
}

export function getLearningDataPath(examId: string): string | null {
  const entry = getCatalogEntry(examId);
  if (!entry || !isLearningEnabled(entry)) return null;
  return entry.learning!.dataPath;
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

/** Distinct exam codes present on services in a learning file (for filters). */
export function collectExamTagsFromDomains(
  domains: { services: { exams?: string[] }[] }[],
  fallbackCodes: string[] = [],
): string[] {
  const set = new Set<string>(fallbackCodes);
  for (const d of domains) {
    for (const s of d.services) {
      for (const tag of s.exams ?? []) set.add(tag);
    }
  }
  return Array.from(set).sort();
}
