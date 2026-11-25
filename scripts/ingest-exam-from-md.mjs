/**
 * Stub: ingest a markdown question dump into an exam bank JSON.
 *
 * AIF-C01 and SOA-C03 are both live. Their banks are built from the JS source
 * files in src/data/aifc01/ and src/data/soac03/ using dedicated scripts:
 *   npm run ingest:aif   → scripts/ingest-aif-from-js.mjs
 *   npm run ingest:soa   → scripts/ingest-soa-from-js.mjs
 *
 * This stub is kept for future markdown-based ingestion of additional exams.
 * Expected markdown shape:
 *   ## Q1
 *   Question stem?
 *   A. option
 *   B. option
 *   Answer: A
 *   Topic: Fundamentals of GenAI
 *
 * Refuses to overwrite live banks until the parsing logic is implemented.
 * Prefer original practice questions — do not paste real AWS exam content.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, ...rest] = arg.slice(2).split('=');
    out[k] = rest.join('=') || true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const examId = args.exam;
const input = args.input;

const KNOWN = {
  'aws-aif-c01': {
    code: 'AIF-C01',
    title: 'AWS Certified AI Practitioner',
    out: 'src/data/exams/aws-aif-c01.json',
  },
  'aws-soa-c03': {
    code: 'SOA-C03',
    title: 'AWS Certified SysOps Administrator – Associate',
    out: 'src/data/exams/aws-soa-c03.json',
  },
};

if (!examId || !KNOWN[examId]) {
  console.error(
    'Usage: node scripts/ingest-exam-from-md.mjs --exam=aws-aif-c01|aws-soa-c03 --input=<file.md>',
  );
  process.exit(1);
}

if (!input) {
  console.error('Missing --input=<markdown file>');
  process.exit(1);
}

const meta = KNOWN[examId];
console.log(`Ingest stub for ${meta.code}`);
console.log(`  input : ${resolve(projectRoot, input)}`);
console.log(`  output: ${resolve(projectRoot, meta.out)}`);
console.log('');
console.log(
  'Markdown ingest not yet implemented for this exam. When implementing:',
);
console.log('  1. Parse MD into the ExamBankJson envelope (see src/types/index.ts)');
console.log('  2. Align topic strings with learning domain quizTopic values');
console.log('  3. Register the bank in src/utils/exams.ts BANK_MAP');
console.log('  4. Set catalog practice.enabled=true for this examId');
console.log('  5. Follow CONTRIBUTING.md (no real AWS exam questions)');
process.exit(2);
