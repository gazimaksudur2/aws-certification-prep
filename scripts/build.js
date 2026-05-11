// Cross-platform build script:
//   1. Run TypeScript project references build (`tsc -b`)
//   2. Run Vite production build
//
// Used instead of `tsc -b && vite build` because Windows PowerShell 5.1
// (the default `powershell.exe`) does not support `&&` as a statement
// separator. Invoking node directly also bypasses npm's local-bin PATH
// shim which can break when the project path contains '&'.

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const tsc = resolve(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const vite = resolve(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const genLearning = resolve(projectRoot, 'scripts', 'generate-learning-json.mjs');

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const res = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    cwd: projectRoot,
  });
  if (res.status !== 0) {
    console.error(`✖ ${label} failed (exit ${res.status})`);
    process.exit(res.status ?? 1);
  }
}

run('Generate learning JSON', [genLearning]);
run('Type-check (tsc -b)', [tsc, '-b']);
run('Vite build', [vite, 'build']);

console.log('\n✓ Build complete. Output: dist/');
