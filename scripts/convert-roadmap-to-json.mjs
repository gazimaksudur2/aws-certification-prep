/**
 * One-time converter: AWS_Study_Roadmap_CLF_SAA.html → public/data/aws-learning-roadmap.json
 * Run: node scripts/convert-roadmap-to-json.mjs
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const inputHtml = resolve(projectRoot, 'public', 'AWS_Study_Roadmap_CLF_SAA.html');
const legacyJson = resolve(projectRoot, 'public', 'data', 'aws-clf-c02-study-guide.json');
const outputJson = resolve(projectRoot, 'public', 'data', 'aws-learning-roadmap.json');

const DOMAIN_COLORS = {
  compute: '#f59e0b',
  storage: '#10b981',
  databases: '#3b82f6',
  networking: '#8b5cf6',
  security: '#ef4444',
  monitoring: '#06b6d4',
  migration: '#f97316',
  analytics: '#6366f1',
  ml: '#ec4899',
  containers: '#14b8a6',
  serverless: '#eab308',
  integration: '#a855f7',
  governance: '#64748b',
  cost: '#22c55e',
  'ha-dr': '#ef4444',
  waf: '#8b5cf6',
  billing: '#10b981',
  strategy: '#3b82f6',
  checklist: '#10b981',
};

const DOMAIN_ICONS = {
  compute: '⚙️',
  storage: '🗄️',
  databases: '🛢️',
  networking: '🌐',
  security: '🔐',
  monitoring: '📊',
  migration: '🚚',
  analytics: '📈',
  ml: '🤖',
  containers: '📦',
  serverless: '⚡',
  integration: '🔗',
  governance: '📋',
  cost: '💰',
  'ha-dr': '🔄',
  waf: '🏛️',
  billing: '🧾',
};

const PHASE_BY_DOMAIN = {
  compute: 1,
  storage: 1,
  networking: 1,
  databases: 2,
  security: 2,
  monitoring: 3,
  migration: 3,
  analytics: 3,
  ml: 3,
  containers: 3,
  serverless: 3,
  integration: 3,
  governance: 4,
  cost: 4,
  'ha-dr': 4,
  waf: 4,
  billing: 4,
};

const CHECKLIST_TOPICS = [
  'S3 storage classes: Standard → Intelligent-Tiering → IA → One Zone-IA → Glacier tiers',
  'EC2 purchasing: On-Demand vs Reserved vs Spot vs Savings Plans vs Dedicated',
  'VPC components: IGW, NAT Gateway, Route Tables, Security Groups, NACLs',
  'IAM: Users, Groups, Roles, Policies, Permission Boundaries, SCPs',
  'RDS Multi-AZ (HA) vs Read Replicas (performance) — key difference',
  'SQS Standard vs FIFO, visibility timeout, DLQ, long polling',
  'Shared Responsibility Model: AWS OF the cloud vs Customer IN the cloud',
  'Well-Architected 6 Pillars: OpEx, Security, Reliability, Perf, Cost, Sustainability',
  'Route 53 routing policies: Simple, Weighted, Latency, Failover, Geolocation',
  'CloudFront: OAC, signed URLs, caching, Lambda@Edge, price classes',
  'Aurora: 6-copy storage, 15 Read Replicas, Global Database, Serverless v2',
  'DynamoDB: partition key, sort key, GSI, LSI, Streams, DAX, Global Tables',
  'Lambda: 15min limit, concurrency, cold start, layers, triggers, VPC access',
  'ECS + Fargate vs EKS + Fargate: AWS-native vs Kubernetes',
  'SNS pub/sub: fan-out pattern, message filtering, FIFO topics',
  'EventBridge: event patterns, rules, targets, custom buses, Scheduler',
  'KMS: CMKs, envelope encryption, key policies, multi-region keys',
  'CloudTrail: management vs data events, multi-region, organization trail',
  'CloudWatch: metrics, alarms, logs, dashboards, custom metrics, agent',
  'EBS: gp3 vs io2, AZ-locked, snapshots, encryption, Multi-Attach',
  'EFS: NFS, Linux-only, multi-AZ, storage tiers, performance modes',
  'Auto Scaling: policies (target tracking, step), cooldown, lifecycle hooks',
  'ALB vs NLB vs GWLB: Layer 7 routing vs Layer 4 static IP vs L3 appliances',
  'VPC Peering (non-transitive) vs Transit Gateway (transitive, hub-spoke)',
  'Direct Connect (private physical link) vs Site-to-Site VPN (internet IPsec)',
  'S3 encryption: SSE-S3, SSE-KMS, SSE-C, client-side',
  'GuardDuty: threat detection, ML-based, no agents, analyzes logs',
  'WAF: web ACL rules, attach to ALB/CloudFront, rate limiting, geo-blocking',
  'Shield Standard (free, L3/L4) vs Shield Advanced (paid, L7, DRT)',
  'Cognito: User Pools (authentication) vs Identity Pools (AWS credentials)',
  'Step Functions: Standard vs Express, state types, error handling',
  'API Gateway: REST vs HTTP vs WebSocket, authorizers, stages, throttling',
  'Kinesis: Data Streams (custom consumers) vs Firehose (managed delivery)',
  'Redshift: OLAP/data warehouse, columnar, MPP, Spectrum for S3 queries',
  'Athena: serverless SQL on S3, pay per scan, columnar format optimization',
  'Glue: serverless ETL, Data Catalog, Crawlers, integrates with Athena',
  'CloudFormation: templates, stacks, StackSets, change sets, drift detection',
  'Systems Manager: Session Manager, Parameter Store, Patch Manager, Run Command',
  'DR strategies: Backup/Restore vs Pilot Light vs Warm Standby vs Multi-Site',
  'RTO vs RPO: time to recover vs data loss tolerance',
  'AWS Organizations: SCPs (restrict only), OUs, consolidated billing, AWS RAM',
  'Snow Family: Snowcone (8TB) vs Snowball Edge (80TB) vs Snowmobile (100PB)',
  'DMS: database migration, CDC for ongoing replication, Schema Conversion Tool',
  'ElastiCache: Redis (persistent, Multi-AZ, pub/sub) vs Memcached (simple cache)',
  'Storage Gateway: S3 File, Volume Cached/Stored, Tape — hybrid storage bridge',
  'Cost tools: Cost Explorer (history) vs Budgets (alerts) vs Compute Optimizer (right-sizing)',
  'Support plans: Basic→Developer→Business→Enterprise. Business = full Trusted Advisor',
  'AWS Global Infrastructure: Regions → AZs → Edge Locations → Local Zones',
  'S3 Versioning, MFA Delete, Object Lock (WORM), Replication (CRR/SRR)',
  'VPC Endpoints: Gateway (S3/DynamoDB, free) vs Interface/PrivateLink (most services)',
];

const STUDY_PHASES = [
  {
    week: 1,
    title: 'Foundations',
    focus: 'Compute (EC2, Lambda, ASG) + Storage (S3, EBS, EFS) + Networking basics (VPC, SG, NACL)',
    domainIds: ['compute', 'storage', 'networking'],
  },
  {
    week: 2,
    title: 'Data & Security',
    focus: 'Databases (RDS, Aurora, DynamoDB) + Security (IAM, KMS, WAF, Shield) + Route 53 + CloudFront',
    domainIds: ['databases', 'security', 'networking'],
  },
  {
    week: 3,
    title: 'Integration & Ops',
    focus: 'Application Integration (SQS, SNS, EventBridge) + Serverless + Containers + Monitoring',
    domainIds: ['integration', 'serverless', 'containers', 'monitoring', 'analytics', 'ml', 'migration'],
  },
  {
    week: 4,
    title: 'Architecture & Exam Prep',
    focus: 'Well-Architected Framework + Billing + HA/DR + Practice exams + review weak areas',
    domainIds: ['waf', 'billing', 'cost', 'governance', 'ha-dr'],
  },
];

function stripHtml(el) {
  if (!el) return '';
  return el.text.replace(/\s+/g, ' ').trim();
}

function parsePriority(badgeEl) {
  if (!badgeEl) return 'medium';
  const cls = badgeEl.getAttribute('class') ?? '';
  if (cls.includes('badge-critical')) return 'critical';
  if (cls.includes('badge-very-high')) return 'very-high';
  if (cls.includes('badge-high')) return 'high';
  if (cls.includes('badge-medium')) return 'medium';
  if (cls.includes('badge-low')) return 'low';
  const text = stripHtml(badgeEl).toLowerCase();
  if (text.includes('critical')) return 'critical';
  if (text.includes('very high')) return 'very-high';
  if (text.includes('high')) return 'high';
  if (text.includes('low')) return 'low';
  return 'medium';
}

function listItemsFromUl(ul) {
  if (!ul) return [];
  return ul.querySelectorAll('li').map((li) => stripHtml(li)).filter(Boolean);
}

function parseComparisons(section) {
  const results = [];
  for (const comp of section.querySelectorAll('.comparison-section')) {
    const titleEl = comp.querySelector('.comparison-title');
    const title = stripHtml(titleEl);
    if (!title) continue;
    const cards = comp.querySelectorAll('.comp-card').map((card) => {
      const cardTitle = stripHtml(card.querySelector('.comp-card-title'));
      const rows = card.querySelectorAll('.comp-row').map((row) => {
        const key = stripHtml(row.querySelector('.comp-key'));
        const val = stripHtml(row.querySelector('.comp-val'));
        return { key, val };
      }).filter((r) => r.key || r.val);
      return { title: cardTitle, rows };
    }).filter((c) => c.title);
    if (cards.length) results.push({ title, cards });
  }
  return results;
}

function parseCallouts(section) {
  const results = [];
  for (const el of section.querySelectorAll('.callout')) {
    if (el.closest('.comparison-section')) continue;
    const cls = el.getAttribute('class') ?? '';
    let kind = 'info';
    if (cls.includes('callout-trap')) kind = 'trap';
    else if (cls.includes('callout-tip')) kind = 'tip';
    const title = stripHtml(el.querySelector('.callout-title'));
    const ul = el.querySelector('ul');
    const items = ul
      ? listItemsFromUl(ul)
      : [stripHtml(el.querySelector('p'))].filter(Boolean);
    if (title && items.length) results.push({ kind, title, items });
  }
  return results;
}

function parseInfoCards(section) {
  const cards = [];
  const selectors = ['.security-card', '.arch-card'];
  for (const sel of selectors) {
    for (const card of section.querySelectorAll(sel)) {
      const titleEl =
        card.querySelector('.security-card-title') ??
        card.querySelector('.arch-card-title');
      const iconEl = card.querySelector('.arch-card-icon');
      const title = stripHtml(titleEl);
      const intro = stripHtml(card.querySelector('p'));
      const items = listItemsFromUl(card.querySelector('ul'));
      if (title) {
        cards.push({
          icon: iconEl ? stripHtml(iconEl) : undefined,
          title,
          intro: intro || undefined,
          items,
        });
      }
    }
  }
  return cards;
}

function parseServiceTable(section) {
  const services = [];
  const table = section.querySelector('.service-table');
  if (!table) return services;

  for (const row of table.querySelectorAll('tbody tr')) {
    const name = stripHtml(row.querySelector('.service-name'));
    const desc = stripHtml(row.querySelector('.service-desc'));
    const badge = row.querySelector('.badge');
    const priority = parsePriority(badge);
    const examTopics = listItemsFromUl(
      row.querySelector('.exam-topics ul') ?? row.querySelector('.exam-topics'),
    );
    if (!name || !desc) continue;
    services.push({
      name,
      desc,
      priority,
      examTopics,
      exam: priority === 'critical' ? true : undefined,
    });
  }
  return services;
}

function parseStrategy(section) {
  const cards = [];
  let idx = 0;
  for (const card of section.querySelectorAll('.strategy-card')) {
    const title = stripHtml(card.querySelector('.strategy-card-title'));
    const ol = card.querySelector('ol');
    const ul = card.querySelector('ul');
    const items = ol ? listItemsFromUl(ol) : listItemsFromUl(ul);
    if (!title || !items.length) continue;
    idx += 1;
    cards.push({
      id: `strategy-${idx}`,
      title,
      ordered: !!ol,
      items,
    });
  }
  return cards;
}

function cleanDomainTitle(raw) {
  return raw.replace(/^\d+\.\s*/, '').trim();
}

async function loadLegacyUses() {
  const map = new Map();
  try {
    await access(legacyJson);
    const raw = JSON.parse(await readFile(legacyJson, 'utf8'));
    for (const cluster of raw.clusters ?? []) {
      for (const svc of cluster.services ?? []) {
        if (svc.name && svc.uses?.[0] && svc.uses?.[1]) {
          map.set(svc.name.toLowerCase(), [svc.uses[0], svc.uses[1]]);
        }
        if (svc.tip) map.set(`${svc.name.toLowerCase()}::tip`, svc.tip);
      }
    }
  } catch {
    // optional merge
  }
  return map;
}

function mergeLegacy(services, legacyMap) {
  return services.map((s) => {
    const key = s.name.toLowerCase();
    const uses = legacyMap.get(key);
    const tip = legacyMap.get(`${key}::tip`);
    return {
      ...s,
      ...(uses ? { uses } : {}),
      ...(tip && !s.examTopics.some((t) => t.includes(tip.slice(0, 20)))
        ? { tip }
        : {}),
    };
  });
}

async function main() {
  const html = await readFile(inputHtml, 'utf8');
  const root = parse(html);
  const legacyMap = await loadLegacyUses();

  const skipIds = new Set(['strategy', 'checklist']);
  const domains = [];

  for (const section of root.querySelectorAll('section.section')) {
    const id = section.getAttribute('id');
    if (!id || skipIds.has(id)) continue;

    const titleRaw = stripHtml(section.querySelector('.section-title'));
    const subtitle = stripHtml(section.querySelector('.section-sub'));
    const name = cleanDomainTitle(titleRaw);

    const services = mergeLegacy(parseServiceTable(section), legacyMap);
    const comparisons = parseComparisons(section);
    const callouts = parseCallouts(section);
    const cards = parseInfoCards(section);

    if (!services.length && !cards.length) continue;

    domains.push({
      id,
      name,
      color: DOMAIN_COLORS[id] ?? '#64748b',
      icon: DOMAIN_ICONS[id],
      subtitle: subtitle || undefined,
      phase: PHASE_BY_DOMAIN[id],
      services,
      ...(comparisons.length ? { comparisons } : {}),
      ...(callouts.length ? { callouts } : {}),
      ...(cards.length ? { cards } : {}),
    });
  }

  const strategySection = root.querySelector('section#strategy');
  const strategy = strategySection ? parseStrategy(strategySection) : [];

  const checklist = CHECKLIST_TOPICS.map((text, i) => ({
    id: `check-${String(i + 1).padStart(2, '0')}`,
    text,
    exams: ['CLF-C02', 'SAA-C03'],
  }));

  const payload = {
    schemaVersion: 2,
    source: 'AWS_Study_Roadmap_CLF_SAA.html',
    domains,
    strategy,
    checklist,
    phases: STUDY_PHASES,
  };

  await writeFile(outputJson, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  const svcCount = domains.reduce((n, d) => n + d.services.length, 0);
  console.log(`✓ Generated ${domains.length} domains, ${svcCount} services`);
  console.log(`  Strategy cards: ${strategy.length}, Checklist: ${checklist.length}`);
  console.log(`→ ${outputJson}`);
}

main().catch((err) => {
  console.error('✖ Conversion failed');
  console.error(err);
  process.exit(1);
});
