/**
 * Verify / sync learning JSON artifacts under public/data/learning/.
 * Keeps the legacy public/data/aws-learning-roadmap.json in sync with the
 * combined CLF+SAA pack for older bookmarks.
 *
 * Run: node scripts/build-learning.mjs
 */
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const learningDir = resolve(projectRoot, 'public', 'data', 'learning');
const legacyRoadmap = resolve(projectRoot, 'public', 'data', 'aws-learning-roadmap.json');

const REQUIRED = [
  'aws-clf-saa-combined.json',
  'aws-aif-c01.json',
  'aws-soa-c03.json',
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function assertLearningShape(name, data) {
  if (!data || typeof data !== 'object') {
    throw new Error(`${name}: not an object`);
  }
  if (!Array.isArray(data.domains) || data.domains.length === 0) {
    throw new Error(`${name}: domains[] required`);
  }
  if (!Array.isArray(data.strategy)) throw new Error(`${name}: strategy[] required`);
  if (!Array.isArray(data.checklist)) throw new Error(`${name}: checklist[] required`);
  if (!Array.isArray(data.phases)) throw new Error(`${name}: phases[] required`);
}

async function main() {
  await mkdir(learningDir, { recursive: true });

  for (const file of REQUIRED) {
    const path = resolve(learningDir, file);
    if (!(await exists(path))) {
      throw new Error(`Missing required learning file: ${path}`);
    }
    const data = JSON.parse(await readFile(path, 'utf8'));
    assertLearningShape(file, data);
    console.log(`✓ ${file} (${data.domains.length} domains, checklist ${data.checklist.length})`);
  }

  const combined = resolve(learningDir, 'aws-clf-saa-combined.json');
  await mkdir(dirname(legacyRoadmap), { recursive: true });
  await copyFile(combined, legacyRoadmap);
  console.log(`✓ Synced legacy roadmap → ${legacyRoadmap}`);

  // Touch a tiny manifest for debugging / future tooling
  const manifest = {
    generatedAt: new Date().toISOString(),
    files: REQUIRED,
  };
  await writeFile(
    resolve(learningDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log('✓ Learning build OK');
}

main().catch((err) => {
  console.error('✖ build-learning failed');
  console.error(err);
  process.exit(1);
});
