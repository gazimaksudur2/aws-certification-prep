import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const inputHtmlPath = resolve(projectRoot, 'public', 'aws-clf-c02-study-guide.html');
const outputJsonPath = resolve(
  projectRoot,
  'src',
  'data',
  'aws-clf-c02-study-guide.json',
);

function extractClustersArraySource(html) {
  const idx = html.indexOf('const clusters');
  if (idx < 0) throw new Error('Unable to find clusters array in study guide HTML.');

  const startBracket = html.indexOf('[', idx);
  if (startBracket < 0) throw new Error('Unable to locate clusters array start.');

  let depth = 0;
  let inString = null; // "'", '"', '`'
  let escaped = false;

  for (let i = startBracket; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }

    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) return html.slice(startBracket, i + 1);
    }
  }

  throw new Error('Unable to locate clusters array end.');
}

function sanitizeClusters(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const cluster = c;
      const services = Array.isArray(cluster.services) ? cluster.services : [];
      return {
        id: String(cluster.id ?? ''),
        name: String(cluster.name ?? ''),
        color: String(cluster.color ?? ''),
        icon: typeof cluster.icon === 'string' ? cluster.icon : undefined,
        services: services
          .filter((s) => s && typeof s === 'object')
          .map((s) => {
            const svc = s;
            const uses = Array.isArray(svc.uses) ? svc.uses : [];
            return {
              name: String(svc.name ?? ''),
              desc: String(svc.desc ?? ''),
              uses: [String(uses[0] ?? ''), String(uses[1] ?? '')],
              tip: typeof svc.tip === 'string' ? svc.tip : undefined,
              exam: svc.exam === true ? true : undefined,
            };
          })
          .filter((s) => s.name && s.desc && s.uses[0] && s.uses[1]),
      };
    })
    .filter((c) => c.id && c.name && c.color && c.services.length);
}

async function main() {
  // If the HTML source isn't available (e.g. CI/Netlify), but the JSON is already
  // committed, we can skip generation and proceed with the build.
  try {
    await access(inputHtmlPath);
  } catch {
    try {
      await access(outputJsonPath);
      console.log(`✓ Learning JSON already present → ${outputJsonPath}`);
      return;
    } catch {
      throw new Error(
        `Missing learning source HTML (${inputHtmlPath}) and JSON output (${outputJsonPath}).`,
      );
    }
  }

  const html = await readFile(inputHtmlPath, 'utf8');
  const arraySrc = extractClustersArraySource(html);

  // eslint-disable-next-line no-new-func
  const raw = Function(`"use strict"; return (${arraySrc});`)();
  const clusters = sanitizeClusters(raw);

  if (!clusters.length) {
    throw new Error('Parsed clusters are empty. Input HTML format may have changed.');
  }

  await mkdir(dirname(outputJsonPath), { recursive: true });
  await writeFile(
    outputJsonPath,
    JSON.stringify({ schemaVersion: 1, source: 'aws-clf-c02-study-guide.html', clusters }, null, 2) +
      '\n',
    'utf8',
  );

  console.log(`✓ Generated ${clusters.length} clusters → ${outputJsonPath}`);
}

main().catch((err) => {
  console.error('✖ Failed to generate learning JSON');
  console.error(err);
  process.exit(1);
});

