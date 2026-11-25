#!/usr/bin/env node
/**
 * scripts/ingest-aif-from-js.mjs
 *
 * Reads src/data/aifc01/qb-*.js, validates the data, and writes
 * src/data/exams/aws-aif-c01.json.
 *
 * Run:  npm run ingest:aif
 *
 * Schema of source records (window.QBANK.push(...)):
 *   id          – "1.1-001" … "5.2-032"  (string)
 *   domain      – 1–5                    (number)
 *   task        – "1.1"…"5.2"            (string)
 *   type        – "single" | "multi" | "ordering"
 *   difficulty  – "easy" | "medium" | "hard"
 *   stem        – question text           (string)
 *   options     – option texts            (string[])
 *   answer      – 0-based correct indices (number[])
 *   explanation – full answer explanation (string)
 *   rationales  – per-option distractor notes; empty [] for ordering items (string[])
 *   services    – AWS service names mentioned (string[])
 *   tags        – topic keywords           (string[])
 *
 * single/multi:
 *   - correct option rationale is always "" in source → filled from explanation.
 *   - wrong option rationale is filled in source → preserved as-is.
 *
 * ordering (24 items):
 *   - answer[] is a permutation of step indices giving the correct order.
 *   - converted to a single-select question where each option is a formatted
 *     step sequence; correct = explanation, wrong = "That is not the correct order."
 *
 * Output Question shape:
 *   id, question, options[{id,text,rationale}], correctAnswers, isMultiple, topic
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── domain meta ───────────────────────────────────────────────────────────────
const DOMAIN_META = [
  { d: 1, topic: 'Fundamentals of AI and ML',                              dir: '1' },
  { d: 2, topic: 'Fundamentals of GenAI',                                  dir: '2' },
  { d: 3, topic: 'Applications of Foundation Models',                      dir: '3' },
  { d: 4, topic: 'Guidelines for Responsible AI',                          dir: '4' },
  { d: 5, topic: 'Security, Compliance, and Governance for AI Solutions',  dir: '5' },
];

// Expected counts per domain (from exam guide domain weights over 528 total)
const DOMAIN_COUNTS = { 1: 108, 2: 124, 3: 152, 4: 72, 5: 72 };
const TOTAL_QUESTIONS = 528;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ── load source files ─────────────────────────────────────────────────────────
function loadAllSourceFiles() {
  const srcDir = resolve(root, 'src', 'data', 'aifc01');
  const files = readdirSync(srcDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  if (files.length === 0) throw new Error(`No .js files found in ${srcDir}`);

  const all = [];
  for (const filename of files) {
    const filePath = resolve(srcDir, filename);
    const code = readFileSync(filePath, 'utf8');
    const sandbox = { window: { QBANK: [] } };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename });
    const qs = sandbox.window.QBANK;
    if (!Array.isArray(qs) || qs.length === 0)
      throw new Error(`${filename}: window.QBANK is empty or not an array`);
    all.push(...qs);
    console.log(`  ${filename}: ${qs.length} questions`);
  }
  return all;
}

// ── validate source records ───────────────────────────────────────────────────
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
    const stem = r.stem.slice(0, 300);
    if (stems.has(stem)) errors.push(`Duplicate stem for ids ${stems.get(stem)} / ${r.id}`);
    else stems.set(stem, r.id);
  }

  for (const r of records) {
    const p = `[${r.id}]`;

    if (!r.stem || typeof r.stem !== 'string' || !r.stem.trim())
      errors.push(`${p} empty stem`);

    if (!Array.isArray(r.options) || r.options.length < 4 || r.options.length > 5)
      errors.push(`${p} expected 4–5 options, got ${r.options?.length}`);

    if (!Array.isArray(r.answer) || r.answer.length < 1)
      errors.push(`${p} answer array empty or missing`);

    if (!r.explanation || !String(r.explanation).trim())
      errors.push(`${p} explanation missing`);

    if (!['single', 'multi', 'ordering'].includes(r.type))
      errors.push(`${p} unknown type "${r.type}"`);

    // per-index answer range check
    if (Array.isArray(r.answer) && Array.isArray(r.options)) {
      for (const idx of r.answer) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= r.options.length)
          errors.push(`${p} answer index ${idx} out of range (0–${r.options.length - 1})`);
      }
    }

    if (r.type === 'single' && Array.isArray(r.answer) && r.answer.length !== 1)
      errors.push(`${p} type=single but ${r.answer.length} answer indices`);

    if (r.type === 'multi' && Array.isArray(r.answer) && r.answer.length < 2)
      errors.push(`${p} type=multi but only ${r.answer.length} answer index`);

    // rationale length for single/multi
    if (r.type !== 'ordering') {
      if (!Array.isArray(r.rationales) || r.rationales.length !== (r.options?.length ?? 0))
        errors.push(`${p} rationales.length ${r.rationales?.length} ≠ options.length ${r.options?.length}`);
    }

    // ordering must have rationales: []
    if (r.type === 'ordering') {
      if (!Array.isArray(r.rationales) || r.rationales.length !== 0)
        errors.push(`${p} ordering item should have rationales: []`);
    }
  }

  // per-domain counts
  for (const meta of DOMAIN_META) {
    const count = records.filter((r) => r.domain === meta.d).length;
    if (count !== DOMAIN_COUNTS[meta.d])
      errors.push(`Domain ${meta.d}: expected ${DOMAIN_COUNTS[meta.d]}, found ${count}`);
  }

  return errors;
}

// ── ordering → single-select conversion ──────────────────────────────────────
function formatSequence(steps, permutation) {
  return permutation.map((i, pos) => `${pos + 1}. ${steps[i]}`).join(' → ');
}

function generateWrongPermutations(correct, stepCount) {
  // Generate distinct wrong permutations
  const correctStr = correct.join(',');
  const candidates = [];

  // 1. Reverse
  candidates.push([...correct].reverse());

  // 2. Rotate left by 1
  candidates.push([...correct.slice(1), correct[0]]);

  // 3. Adjacent swap at position 0
  const swap01 = [...correct];
  [swap01[0], swap01[1]] = [swap01[1], swap01[0]];
  candidates.push(swap01);

  // 4. Adjacent swap at position 1 (or last-1 if stepCount < 4)
  const swap12 = [...correct];
  const swapPos = Math.min(1, stepCount - 2);
  [swap12[swapPos], swap12[swapPos + 1]] = [swap12[swapPos + 1], swap12[swapPos]];
  candidates.push(swap12);

  // 5. Rotate right by 1
  candidates.push([correct[stepCount - 1], ...correct.slice(0, stepCount - 1)]);

  // 6. Adjacent swap at second-to-last position
  const swapLast = [...correct];
  [swapLast[stepCount - 2], swapLast[stepCount - 1]] = [swapLast[stepCount - 1], swapLast[stepCount - 2]];
  candidates.push(swapLast);

  // Pick three distinct ones that differ from correct
  const seen = new Set([correctStr]);
  const chosen = [];
  for (const perm of candidates) {
    const key = perm.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      chosen.push(perm);
      if (chosen.length === 3) break;
    }
  }

  if (chosen.length < 3) throw new Error(`Could not generate 3 wrong permutations for sequence: ${correctStr}`);
  return chosen;
}

function convertOrdering(r, topic, numericId) {
  const steps = r.options; // original step texts indexed by position
  const correctPerm = r.answer; // e.g. [2, 0, 3, 1] → step order
  const wrongPerms = generateWrongPermutations(correctPerm, steps.length);

  // Build the four option texts
  const correctText = formatSequence(steps, correctPerm);
  const wrongTexts = wrongPerms.map((perm) => formatSequence(steps, perm));

  // Shuffle so correct is not always A — place it at a deterministic position
  // based on numericId to avoid always being option A.
  const correctPos = numericId % 4; // 0–3

  const optionTexts = [...wrongTexts];
  optionTexts.splice(correctPos, 0, correctText); // insert correct at position

  const options = optionTexts.map((text, i) => ({
    id: LETTERS[i],
    text,
    rationale: i === correctPos
      ? r.explanation
      : 'That is not the correct order for these steps.',
  }));

  return {
    id: numericId,
    question: r.stem,
    options,
    correctAnswers: [LETTERS[correctPos]],
    isMultiple: false,
    topic,
  };
}

// ── transform single/multi record to bank shape ───────────────────────────────
function transformSingleMulti(r, topic, numericId) {
  const options = r.options.map((text, i) => {
    const isCorrect = r.answer.includes(i);
    // Correct option rationale is always "" in source → fill from explanation.
    // Wrong option rationale is already filled in source.
    const rawRat = r.rationales[i] ?? '';
    const rationale = isCorrect && !rawRat.trim() ? r.explanation : rawRat;
    return { id: LETTERS[i], text, rationale };
  });

  return {
    id: numericId,
    question: r.stem,
    options,
    correctAnswers: r.answer.map((i) => LETTERS[i]),
    isMultiple: r.answer.length > 1,
    topic,
  };
}

// ── build stable sort key ─────────────────────────────────────────────────────
function sortKey(r) {
  // id format "1.1-001"
  const [taskPart, seqPart] = r.id.split('-');
  const [domStr, taskStr] = taskPart.split('.');
  return parseInt(domStr, 10) * 100000 + parseInt(taskStr, 10) * 1000 + parseInt(seqPart, 10);
}

// ── round-trip validation ─────────────────────────────────────────────────────
function validateBank(bank) {
  const errors = [];

  if (bank.questions.length !== TOTAL_QUESTIONS)
    errors.push(`Expected ${TOTAL_QUESTIONS} questions, found ${bank.questions.length}`);

  const topicCounts = {};
  const idSet = new Set();
  let emptyRationale = 0;

  for (const q of bank.questions) {
    if (idSet.has(q.id)) errors.push(`Duplicate numeric id: ${q.id}`);
    idSet.add(q.id);

    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;

    for (const ans of q.correctAnswers) {
      if (!q.options.some((o) => o.id === ans))
        errors.push(`Question ${q.id}: correctAnswer "${ans}" not found in options`);
    }

    for (const opt of q.options) {
      if (!opt.rationale || !opt.rationale.trim()) {
        emptyRationale++;
        errors.push(`Question ${q.id}, option ${opt.id}: empty rationale`);
      }
    }
  }

  for (const meta of DOMAIN_META) {
    const count = topicCounts[meta.topic] ?? 0;
    if (count !== DOMAIN_COUNTS[meta.d])
      errors.push(`Topic "${meta.topic}": expected ${DOMAIN_COUNTS[meta.d]}, found ${count}`);
  }

  return errors;
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('Loading AIF-C01 source files…');
  const rawRecords = loadAllSourceFiles();
  console.log(`\nTotal records loaded: ${rawRecords.length}`);

  console.log('\nValidating source records…');
  const sourceErrors = validateSource(rawRecords);
  if (sourceErrors.length > 0) {
    console.error('\nSource validation FAILED:');
    sourceErrors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Source validation passed');

  console.log('\nTransforming…');
  const domainTopicMap = new Map(DOMAIN_META.map((m) => [m.d, m.topic]));

  // Sort by domain → task → sequence
  rawRecords.sort((a, b) => sortKey(a) - sortKey(b));

  const questions = rawRecords.map((r, index) => {
    const numericId = index + 1;
    const topic = domainTopicMap.get(r.domain);
    if (!topic) throw new Error(`Unknown domain ${r.domain} for id ${r.id}`);

    if (r.type === 'ordering') return convertOrdering(r, topic, numericId);
    return transformSingleMulti(r, topic, numericId);
  });

  const bank = {
    examId: 'aws-aif-c01',
    code: 'AIF-C01',
    title: 'AWS Certified AI Practitioner',
    passThresholdPercent: 70,
    sourceNote:
      'Ingested from src/data/aifc01/qb-*.js via scripts/ingest-aif-from-js.mjs. ' +
      'Ordering items (24) are converted to single-select sequence questions. ' +
      'Numeric id = sequential 1–528 sorted by domain → task → source sequence. ' +
      'Correct option rationale is filled from explanation; distractor rationales preserved from source.',
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

  const outPath = resolve(root, 'src', 'data', 'exams', 'aws-aif-c01.json');
  writeFileSync(outPath, JSON.stringify(bank, null, 4), 'utf8');

  console.log(`\n✓ Written ${bank.questions.length} questions → ${outPath}`);
  const topicCounts = {};
  for (const q of bank.questions) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  const multiCount = bank.questions.filter((q) => q.isMultiple).length;
  console.log(`  Multi-select questions: ${multiCount}`);
  console.log('  Topics:');
  for (const [topic, count] of Object.entries(topicCounts)) {
    console.log(`    ${count}  ${topic}`);
  }

  console.log('\nAll checks passed. Run the app — AIF-C01 is ready.');
}

main();
