#!/usr/bin/env node
/**
 * scripts/ingest-soa-from-js.mjs
 *
 * Reads src/data/soac03/d1.js – d5.js, validates the data,
 * and writes src/data/exams/aws-soa-c03.json.
 *
 * Run:  npm run ingest:soa
 *
 * Schema of source records:
 *   { id, d, q, o, a, r }
 *   id  – "d1-01" … "d5-65"  (string)
 *   d   – domain number 1-5   (number)
 *   q   – scenario + "\n\n" + question (string)
 *   o   – option texts         (string[])
 *   a   – 0-based correct indices (number[])
 *   r   – per-option rationale (string[], same length as o)
 *
 * Output Question shape (extends existing ExamBankJson questions):
 *   id, question, options[{id,text,rationale}], correctAnswers, isMultiple, topic
 */

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── domain meta ──────────────────────────────────────────────────────────────
const DOMAIN_META = [
  { d: 1, topic: 'Monitoring, Logging, Analysis, Remediation, and Performance Optimization', file: 'd1.js' },
  { d: 2, topic: 'Reliability and Business Continuity', file: 'd2.js' },
  { d: 3, topic: 'Deployment, Provisioning, and Automation', file: 'd3.js' },
  { d: 4, topic: 'Security and Compliance', file: 'd4.js' },
  { d: 5, topic: 'Networking and Content Delivery', file: 'd5.js' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const QUESTIONS_PER_DOMAIN = 65;
const TOTAL_QUESTIONS = 325;
const MULTI_COUNT = 23;

// ── load source files ─────────────────────────────────────────────────────────
function loadDomainFile(meta) {
  const filePath = resolve(root, 'src', 'data', 'soac03', meta.file);
  const code = readFileSync(filePath, 'utf8');

  const sandbox = { window: { QUESTIONS: [] } };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: meta.file });

  return sandbox.window.QUESTIONS;
}

// ── validate invariants ───────────────────────────────────────────────────────
function validateSource(records) {
  const errors = [];

  // id uniqueness
  const ids = records.map((r) => r.id);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`Duplicate source ids: ${[...new Set(dupes)].join(', ')}`);
  }

  // duplicate stems
  const stems = new Map();
  for (const r of records) {
    const stem = r.q.slice(0, 200);
    if (stems.has(stem)) errors.push(`Duplicate stem for ids ${stems.get(stem)} / ${r.id}`);
    else stems.set(stem, r.id);
  }

  for (const r of records) {
    const prefix = `[${r.id}]`;

    if (!r.q || typeof r.q !== 'string' || r.q.trim().length === 0)
      errors.push(`${prefix} empty question text`);

    if (!Array.isArray(r.o) || r.o.length < 4 || r.o.length > 5)
      errors.push(`${prefix} expected 4–5 options, got ${r.o?.length}`);

    if (!Array.isArray(r.a) || r.a.length < 1 || r.a.length > 2)
      errors.push(`${prefix} expected 1–2 answer indices, got ${r.a?.length}`);

    if (!Array.isArray(r.r) || r.r.length !== (r.o?.length ?? 0))
      errors.push(`${prefix} rationale count ${r.r?.length} ≠ option count ${r.o?.length}`);

    if (r.o && r.a) {
      for (const idx of r.a) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= r.o.length)
          errors.push(`${prefix} answer index ${idx} out of range (0–${r.o.length - 1})`);
      }
    }
  }

  // per-domain counts
  for (const meta of DOMAIN_META) {
    const count = records.filter((r) => r.d === meta.d).length;
    if (count !== QUESTIONS_PER_DOMAIN)
      errors.push(`Domain ${meta.d}: expected ${QUESTIONS_PER_DOMAIN} questions, found ${count}`);
  }

  return errors;
}

// ── transform to bank shape ───────────────────────────────────────────────────
function transformRecord(raw, domainTopicMap) {
  const topic = domainTopicMap.get(raw.d);
  if (!topic) throw new Error(`Unknown domain ${raw.d} for id ${raw.id}`);

  // stable numeric id: (domain-1)*65 + sequence (d1-01 → 1, d5-65 → 325)
  const [, dPart, seqPart] = raw.id.match(/^d(\d+)-(\d+)$/);
  const numericId = (parseInt(dPart, 10) - 1) * QUESTIONS_PER_DOMAIN + parseInt(seqPart, 10);

  const options = raw.o.map((text, i) => ({
    id: LETTERS[i],
    text,
    rationale: raw.r[i],
  }));

  const correctAnswers = raw.a.map((i) => LETTERS[i]);
  const isMultiple = raw.a.length > 1;

  return {
    id: numericId,
    question: raw.q,
    options,
    correctAnswers,
    isMultiple,
    topic,
  };
}

// ── round-trip validation ─────────────────────────────────────────────────────
function validateBank(bank) {
  const errors = [];

  if (bank.questions.length !== TOTAL_QUESTIONS)
    errors.push(`Expected ${TOTAL_QUESTIONS} questions, found ${bank.questions.length}`);

  const topicCounts = {};
  let multiCount = 0;

  for (const q of bank.questions) {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    if (q.isMultiple) multiCount++;

    for (const ans of q.correctAnswers) {
      if (!q.options.some((o) => o.id === ans))
        errors.push(`Question ${q.id}: correctAnswer "${ans}" not found in options`);
    }

    for (const opt of q.options) {
      if (!opt.rationale || opt.rationale.trim().length === 0)
        errors.push(`Question ${q.id}, option ${opt.id}: empty rationale`);
    }
  }

  for (const meta of DOMAIN_META) {
    const count = topicCounts[meta.topic] ?? 0;
    if (count !== QUESTIONS_PER_DOMAIN)
      errors.push(`Topic "${meta.topic}": expected ${QUESTIONS_PER_DOMAIN}, found ${count}`);
  }

  if (multiCount !== MULTI_COUNT)
    errors.push(`Expected ${MULTI_COUNT} multi-select questions, found ${multiCount}`);

  // id uniqueness in output
  const ids = bank.questions.map((q) => q.id);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) errors.push('Duplicate numeric ids in output bank');

  return errors;
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('Loading SOA-C03 source files…');
  const domainTopicMap = new Map(DOMAIN_META.map((m) => [m.d, m.topic]));

  const allRaw = [];
  for (const meta of DOMAIN_META) {
    const records = loadDomainFile(meta);
    console.log(`  ${meta.file}: ${records.length} questions loaded`);
    allRaw.push(...records);
  }

  console.log(`\nValidating ${allRaw.length} source records…`);
  const sourceErrors = validateSource(allRaw);
  if (sourceErrors.length > 0) {
    console.error('\nSource validation FAILED:');
    sourceErrors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Source validation passed');

  console.log('\nTransforming…');
  const questions = allRaw.map((r) => transformRecord(r, domainTopicMap));
  questions.sort((a, b) => a.id - b.id);

  const bank = {
    examId: 'aws-soa-c03',
    code: 'SOA-C03',
    title: 'AWS Certified SysOps Administrator – Associate',
    passThresholdPercent: 72,
    sourceNote:
      'Ingested from src/data/soac03/d1.js–d5.js via scripts/ingest-soa-from-js.mjs. ' +
      'Numeric id = (domain-1)*65 + sequence (d1-01→1, d5-65→325). ' +
      'Each option carries a rationale string; options are not shuffled at ingest time.',
    questions,
  };

  console.log('\nRound-trip validation…');
  const bankErrors = validateBank(bank);
  if (bankErrors.length > 0) {
    console.error('\nBank validation FAILED:');
    bankErrors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Bank validation passed');

  const outPath = resolve(root, 'src', 'data', 'exams', 'aws-soa-c03.json');
  writeFileSync(outPath, JSON.stringify(bank, null, 4), 'utf8');

  console.log(`\n✓ Written ${bank.questions.length} questions → ${outPath}`);
  console.log('  Multi-select questions:', bank.questions.filter((q) => q.isMultiple).length);
  console.log('  Topics:');
  const topicCounts = {};
  for (const q of bank.questions) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  for (const [topic, count] of Object.entries(topicCounts)) {
    console.log(`    ${count}  ${topic}`);
  }

  console.log('\nAll checks passed. Run the app — SOA-C03 is ready.');
}

main();
