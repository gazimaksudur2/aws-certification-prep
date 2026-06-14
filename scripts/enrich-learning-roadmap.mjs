/**
 * One-time enrichment: aligns public/data/aws-learning-roadmap.json with the
 * SAA-C03 must-learn reference (saa_c03_must_learn_resources.html).
 *
 * Run: node scripts/enrich-learning-roadmap.mjs
 *
 * Transforms (idempotent):
 *  1. Convert the Security domain's per-service cards into prioritized services.
 *  2. Add missing services (ACM, Network Firewall, Security Hub/Artifact/Audit/
 *     Detective, SSM Parameter Store, CodePipeline/CodeDeploy, Kinesis split).
 *  3. Re-tag the 67 reference services' priorities
 *     (Must-Know -> critical, Important -> high, Good-to-Know -> medium).
 *  4. Add the high-value comparison pairs.
 *  5. Enrich a few existing examTopics with reference specifics.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const jsonPath = resolve(projectRoot, 'public', 'data', 'aws-learning-roadmap.json');

/* ------------------------------------------------------------------ helpers */

function findDomain(data, id) {
  return data.domains.find((d) => d.id === id);
}

function setPriorityByName(data, retag) {
  let changed = 0;
  for (const domain of data.domains) {
    for (const svc of domain.services ?? []) {
      if (Object.prototype.hasOwnProperty.call(retag, svc.name)) {
        const next = retag[svc.name];
        if (svc.priority !== next) {
          svc.priority = next;
          changed += 1;
        }
        svc.exam = next === 'critical' ? true : undefined;
      }
    }
  }
  return changed;
}

function addComparisonIfMissing(domain, comparison) {
  domain.comparisons = domain.comparisons ?? [];
  if (domain.comparisons.some((c) => c.title === comparison.title)) return false;
  domain.comparisons.push(comparison);
  return true;
}

function appendExamTopicsIfMissing(service, bullets) {
  if (!service) return;
  service.examTopics = service.examTopics ?? [];
  for (const bullet of bullets) {
    const head = bullet.slice(0, 24).toLowerCase();
    const exists = service.examTopics.some((t) => t.toLowerCase().includes(head));
    if (!exists) service.examTopics.push(bullet);
  }
}

/* --------------------------------------------- 3. priority re-tag (by name) */

const RETAG = {
  // Must-Know (p1) -> critical
  'Amazon EC2': 'critical',
  'EC2 Auto Scaling': 'critical',
  'AWS Lambda': 'critical',
  'Amazon ECS': 'critical',
  'AWS Fargate': 'critical',
  'Amazon S3': 'critical',
  'Amazon EBS': 'critical',
  'Amazon EFS': 'critical',
  'Amazon RDS': 'critical',
  'Amazon Aurora': 'critical',
  'Amazon DynamoDB': 'critical',
  'Amazon ElastiCache': 'critical',
  'Amazon VPC': 'critical',
  'Elastic Load Balancing': 'critical',
  'Amazon Route 53': 'critical',
  'Amazon CloudFront': 'critical',
  'AWS Transit Gateway': 'critical',
  'Amazon CloudWatch': 'critical',
  'AWS CloudTrail': 'critical',
  'Amazon SQS': 'critical',
  'Amazon SNS': 'critical',
  'Amazon EventBridge': 'critical',
  'Amazon API Gateway': 'critical',
  'AWS CloudFormation': 'critical',
  // Important (p2) -> high
  'Elastic Beanstalk': 'high',
  'Amazon FSx': 'high',
  'AWS Storage Gateway': 'high',
  'AWS Backup': 'high',
  'AWS Snow Family': 'high',
  'Amazon Redshift': 'high',
  'Amazon Athena': 'high',
  'AWS Glue': 'high',
  'Amazon EKS': 'high',
  'AWS Direct Connect': 'high',
  'AWS VPN': 'high',
  'AWS Global Accelerator': 'high',
  'AWS Step Functions': 'high',
  'AWS SAM': 'high',
  'AWS Config': 'high',
  // Good-to-Know (p3) -> medium
  'AWS Outposts': 'medium',
  'Amazon QuickSight': 'medium',
  'Amazon OpenSearch': 'medium',
  'Amazon EMR': 'medium',
  'Amazon MQ': 'medium',
  'AWS DataSync': 'medium',
  'AWS Trusted Advisor': 'medium',
  'AWS Control Tower': 'medium',
  'AWS PrivateLink': 'medium',
  'AWS Cost Explorer': 'medium',
  'AWS Budgets': 'medium',
  'AWS App Runner': 'medium',
};

/* --------------------------------------- 1+2. Security domain as services */

const SECURITY_SERVICES = [
  {
    name: 'AWS IAM',
    desc: 'Identity backbone of AWS — manage who can access which resources.',
    priority: 'critical',
    examTopics: [
      'Users, Groups, Roles, Policies',
      'Policies: Identity-based, Resource-based, Permission Boundaries, SCPs, Session policies',
      'Principle of Least Privilege — grant only what is needed',
      'IAM Roles for EC2: no long-term keys stored on the instance (instance profile)',
      'Cross-account access: trust policy + AssumeRole (STS)',
      'Policy evaluation: explicit Deny > Organization SCP > Resource-based > Identity-based',
      'IAM Access Analyzer: finds resources shared externally',
      'MFA: virtual, hardware, U2F (SMS not recommended)',
      'Inline vs Managed Policies: Managed = reusable, Inline = 1:1 attachment',
    ],
    tip: 'Identity-based vs resource-based policies; an explicit Deny always wins; use Roles (not access keys) for EC2 and cross-account access.',
  },
  {
    name: 'AWS KMS',
    desc: 'Managed encryption keys (CMKs) with envelope encryption.',
    priority: 'critical',
    examTopics: [
      'Key types: AWS managed, Customer Managed Key (CMK), customer-provided (SSE-C)',
      'Envelope encryption: a data key encrypts data, the CMK encrypts the data key',
      'Integrates with S3, EBS, RDS, DynamoDB, Lambda, SSM Parameter Store, Secrets Manager',
      'Multi-Region Keys: replicate a CMK across regions',
      'Key Policies + grants control who can use/manage keys',
      'Automatic key rotation (yearly) for customer managed keys',
      'CloudHSM: dedicated FIPS 140-2 Level 3 hardware you fully control',
    ],
    tip: 'KMS for managed keys + envelope encryption; choose CloudHSM when you need dedicated, FIPS 140-2 Level 3 hardware you control.',
  },
  {
    name: 'AWS WAF',
    desc: 'Layer 7 web application firewall filtering HTTP/HTTPS traffic.',
    priority: 'critical',
    examTopics: [
      'Protects against SQL injection, XSS, bad bots, and floods',
      'Attach Web ACLs to ALB, API Gateway, CloudFront, AppSync',
      'Rules and rule groups; AWS Managed Rules and Marketplace rules',
      'IP sets, geo match, and rate-based rules (rate limiting)',
      'vs Shield: WAF = L7 application rules; Shield = L3/L4 DDoS protection',
    ],
    tip: 'Attach WAF Web ACLs to ALB / API Gateway / CloudFront. Use rate-based rules to throttle floods and bad bots.',
  },
  {
    name: 'AWS Shield',
    desc: 'Managed DDoS protection for AWS resources.',
    priority: 'critical',
    examTopics: [
      'Shield Standard: free, automatic, protects all customers (L3/L4)',
      'Shield Advanced: paid (~$3,000/mo), adds L7 protection and 24/7 DRT',
      'Advanced includes DDoS cost protection and WAF at no extra charge',
      'Attach to ELB, CloudFront, Route 53, Global Accelerator, Elastic IP',
    ],
    tip: 'Standard is free and automatic (L3/L4). Advanced adds L7 protection, 24/7 response team, and DDoS cost protection.',
  },
  {
    name: 'Amazon Cognito',
    desc: 'Authentication and authorization for web and mobile apps.',
    priority: 'critical',
    examTopics: [
      'User Pools: user directory, sign-up/sign-in, JWT tokens',
      'Identity Pools: federated identities -> temporary AWS credentials',
      'Supports social IdPs (Google, Facebook), SAML, and OIDC',
      'Combine User Pools + Identity Pools: authenticate, then authorize to AWS services',
    ],
    tip: 'User Pools = authentication (JWT). Identity Pools = federated temporary AWS credentials. Use both to authenticate then access AWS services.',
  },
  {
    name: 'AWS Secrets Manager',
    desc: 'Store, rotate, and retrieve secrets like DB credentials and API keys.',
    priority: 'high',
    examTopics: [
      'Automatic rotation via Lambda (the key differentiator)',
      'Native integration with RDS, Redshift, DocumentDB',
      'Encrypted with KMS; fine-grained resource policies',
      'vs SSM Parameter Store: Secrets Manager costs more but auto-rotates',
    ],
    tip: 'Choose Secrets Manager over SSM Parameter Store when you need automatic credential rotation.',
  },
  {
    name: 'AWS Certificate Manager (ACM)',
    desc: 'Provision, manage, and deploy free TLS/SSL certificates.',
    priority: 'high',
    examTopics: [
      'Free public TLS certificates with automatic renewal',
      'Attach to ALB, CloudFront, and API Gateway (not directly to EC2)',
      'Public certs validated via DNS (Route 53) or email',
      'CloudFront requires the certificate in us-east-1',
      'ACM Private CA for internal/private certificates',
    ],
    tip: 'ACM = free auto-renewing TLS for ALB/CloudFront/API Gateway. For CloudFront the cert MUST be in us-east-1.',
  },
  {
    name: 'Amazon GuardDuty',
    desc: 'Intelligent, ML-based threat detection.',
    priority: 'high',
    examTopics: [
      'Agentless — analyzes CloudTrail, VPC Flow Logs, DNS logs, EKS audit logs, S3 logs',
      'Detects compromised instances, crypto-mining, unusual API calls',
      'Optional malware scanning',
      'Findings -> EventBridge -> Lambda for automated remediation',
    ],
    tip: 'GuardDuty is agentless threat detection. Route findings to EventBridge -> Lambda for automatic remediation.',
  },
  {
    name: 'AWS Organizations / SCPs',
    desc: 'Centrally manage and govern multiple AWS accounts.',
    priority: 'high',
    examTopics: [
      'OUs (Organizational Units) group accounts into a hierarchy',
      'SCPs (Service Control Policies): maximum-permission guardrails',
      'SCPs only restrict — they never grant permissions (even root is bound)',
      'Consolidated Billing: single payer, volume discounts',
      'AWS RAM (Resource Access Manager): share resources across accounts',
    ],
    tip: 'SCPs set the ceiling of what accounts can do — they restrict, never grant. The account root is still bound by SCPs.',
  },
  {
    name: 'IAM Identity Center (AWS SSO)',
    desc: 'Centralized single sign-on across AWS accounts and applications.',
    priority: 'high',
    examTopics: [
      'Single sign-on across all Organization accounts and SaaS apps',
      'Integrates with Active Directory and external IdPs via SAML 2.0',
      'Permission sets assigned per account/group',
      'Replaces creating IAM users in every account',
    ],
    tip: 'Use IAM Identity Center instead of per-account IAM users; federate with AD/external IdP via SAML 2.0.',
  },
  {
    name: 'AWS Network Firewall',
    desc: 'Managed stateful/stateless network firewall for your VPC.',
    priority: 'medium',
    examTopics: [
      'Filters traffic at the VPC perimeter (dedicated firewall subnets)',
      'Stateful (Suricata-compatible) and stateless rule groups',
      'Domain-name filtering and intrusion prevention (IPS)',
      'Centralized inspection across many VPCs via Transit Gateway',
      'vs Security Groups/NACLs: deep L3-L7 inspection, not just IP/port allow/deny',
    ],
    tip: 'Use Network Firewall for deep packet inspection / IPS at the VPC edge — Security Groups and NACLs only do basic allow/deny.',
  },
  {
    name: 'Amazon Macie',
    desc: 'ML-powered discovery and protection of sensitive data in S3.',
    priority: 'medium',
    examTopics: [
      'Finds PII, financial data, and credentials in S3',
      'Data classification: sensitive, personal',
      'Alerts via EventBridge or Security Hub',
    ],
    tip: 'Macie = find PII/sensitive data in S3 for compliance scenarios.',
  },
  {
    name: 'Amazon Inspector',
    desc: 'Automated vulnerability management for EC2, Lambda, and ECR.',
    priority: 'medium',
    examTopics: [
      'Scans for CVEs, network reachability, and software vulnerabilities',
      'Continuous, event-driven scanning (Inspector v2)',
      'Covers EC2, container images in ECR, and Lambda functions',
    ],
    tip: 'Inspector = continuous CVE/vulnerability scanning. Trusted Advisor = point-in-time best-practice checks (not vuln scanning).',
  },
  {
    name: 'AWS Security Hub',
    desc: 'Aggregated security findings and compliance checks across accounts.',
    priority: 'medium',
    examTopics: [
      'Single pane aggregating GuardDuty, Inspector, Macie, IAM Access Analyzer',
      'Automated CIS, AWS Foundational Security Best Practices, PCI-DSS checks',
      'Cross-account and cross-region aggregation',
      'Findings in AWS Security Finding Format (ASFF) -> EventBridge',
    ],
    tip: 'Security Hub = central dashboard consolidating other services findings plus compliance standards.',
  },
  {
    name: 'AWS Artifact',
    desc: 'Self-service portal for AWS compliance reports and agreements.',
    priority: 'low',
    examTopics: [
      'On-demand SOC, PCI-DSS, ISO compliance reports',
      'Download AWS agreements (e.g., BAA for HIPAA)',
    ],
    tip: 'Artifact = download compliance reports (SOC/PCI/ISO) on demand.',
  },
  {
    name: 'AWS Audit Manager',
    desc: 'Automates evidence collection for audits.',
    priority: 'low',
    examTopics: [
      'Continuously collects evidence mapped to frameworks (PCI, GDPR, SOC 2)',
      'Turns AWS usage data into audit-ready reports',
    ],
    tip: 'Audit Manager = automate audit evidence collection mapped to compliance frameworks.',
  },
  {
    name: 'Amazon Detective',
    desc: 'Analyze and visualize security data to find the root cause of issues.',
    priority: 'low',
    examTopics: [
      'Builds linked graphs from VPC Flow Logs, CloudTrail, and GuardDuty',
      'Used to investigate the root cause after a GuardDuty finding',
    ],
    tip: 'GuardDuty detects; Detective investigates root cause.',
  },
];

/* ------------------------------------------------- Kinesis split services */

const KINESIS_DATA_STREAMS = {
  name: 'Kinesis Data Streams',
  desc: 'Real-time, ordered, replayable data streaming with custom consumers.',
  priority: 'high',
  examTopics: [
    'Sharded throughput; retention 1-365 days; ordered per shard',
    'Custom consumers via KCL/KPL; Enhanced Fan-Out for dedicated throughput',
    'Replay data by re-reading from a position (SQS cannot replay)',
    'Producers: SDK, KPL, Kinesis Agent, CloudWatch Logs',
    'Related: Kinesis Data Analytics (SQL/Flink) and Kinesis Video Streams',
    'vs SQS: Kinesis = ordered streams + multiple consumers + replay; SQS = task queue',
  ],
  tip: 'Pick Kinesis Data Streams when order and replay matter, or when many consumers must read the same data.',
};

const KINESIS_FIREHOSE = {
  name: 'Kinesis Data Firehose',
  desc: 'Fully managed near-real-time delivery of streaming data to data stores.',
  priority: 'high',
  examTopics: [
    'Delivers to S3, Redshift, OpenSearch, Splunk — no consumers to manage',
    'Near real-time (buffer size/interval, ~60s)',
    'Built-in transform (Lambda) and format conversion (Parquet/ORC)',
    'No shards; auto-scales; not for sub-second or custom consumers',
    'vs Data Streams: Firehose = managed delivery/load; Streams = custom processing',
  ],
  tip: 'Firehose = zero-admin load into S3/Redshift/OpenSearch. Data Streams = build your own real-time consumers.',
};

/* ------------------------------------------------- Management additions */

const SSM_PARAMETER_STORE = {
  name: 'SSM Parameter Store',
  desc: 'Hierarchical storage for configuration data and secrets.',
  priority: 'high',
  examTopics: [
    'String, StringList, and SecureString (KMS-encrypted) parameter types',
    'Standard (free) vs Advanced (8 KB, parameter policies) tiers',
    'No built-in rotation (unlike Secrets Manager)',
    'Versioning; referenced from CloudFormation, Lambda, ECS',
    'Public parameters: AWS-published AMI IDs, region lists',
  ],
  tip: 'Parameter Store = free config + SecureString secrets WITHOUT auto-rotation. Need rotation -> Secrets Manager.',
};

const CODEPIPELINE = {
  name: 'CodePipeline / CodeDeploy',
  desc: 'CI/CD pipeline orchestration and automated deployments.',
  priority: 'medium',
  examTopics: [
    'CodePipeline orchestrates source -> build -> test -> deploy stages',
    'CodeBuild = managed build; CodeDeploy = automated deployments',
    'Deployment strategies: in-place vs blue/green (EC2, Lambda, ECS)',
    'CodeDeploy lifecycle hooks + automatic rollback on failure',
    'Sources: CodeCommit, GitHub, S3',
  ],
  tip: 'CodeDeploy = blue/green & in-place deploys to EC2/Lambda/ECS; CodePipeline = the end-to-end CI/CD orchestrator.',
};

/* ------------------------------------------------------ comparison pairs */

const CMP_NAT = {
  title: 'NAT Gateway vs NAT Instance',
  cards: [
    {
      title: 'NAT Gateway',
      rows: [
        { key: 'Managed:', val: 'AWS-managed, auto-scales' },
        { key: 'HA:', val: 'Per-AZ — deploy one per AZ' },
        { key: 'Bandwidth:', val: 'Up to 100 Gbps' },
        { key: 'Maintenance:', val: 'None' },
      ],
    },
    {
      title: 'NAT Instance',
      rows: [
        { key: 'Managed:', val: 'Self-managed EC2' },
        { key: 'HA:', val: 'Manual (script / ASG)' },
        { key: 'Bandwidth:', val: 'Depends on instance type' },
        { key: 'Maintenance:', val: 'You patch, scale, secure (SG)' },
      ],
    },
  ],
};

const CMP_ELB = {
  title: 'ALB vs NLB vs GWLB',
  cards: [
    {
      title: 'ALB',
      rows: [
        { key: 'Layer:', val: '7 (HTTP/HTTPS)' },
        { key: 'Routing:', val: 'Path, host, header, query' },
        { key: 'Targets:', val: 'EC2, IP, Lambda, containers' },
        { key: 'Best for:', val: 'Web apps, microservices, redirects' },
      ],
    },
    {
      title: 'NLB',
      rows: [
        { key: 'Layer:', val: '4 (TCP/UDP/TLS)' },
        { key: 'Perf:', val: 'Millions req/s, ultra-low latency' },
        { key: 'IPs:', val: 'Static / Elastic IP per AZ' },
        { key: 'Best for:', val: 'Extreme perf, static IP, TCP' },
      ],
    },
    {
      title: 'GWLB',
      rows: [
        { key: 'Layer:', val: '3/4 (GENEVE 6081)' },
        { key: 'Routing:', val: 'Transparent appliance insertion' },
        { key: 'Targets:', val: '3rd-party firewalls / IDS / IPS' },
        { key: 'Best for:', val: 'Inline virtual security appliances' },
      ],
    },
  ],
};

const CMP_SQS_SNS_KINESIS = {
  title: 'SQS vs SNS vs Kinesis',
  cards: [
    {
      title: 'SQS',
      rows: [
        { key: 'Model:', val: 'Queue (pull)' },
        { key: 'Consumers:', val: 'One per message' },
        { key: 'Order/Replay:', val: 'FIFO option; no replay' },
        { key: 'Best for:', val: 'Decoupling, task buffering' },
      ],
    },
    {
      title: 'SNS',
      rows: [
        { key: 'Model:', val: 'Pub/Sub (push)' },
        { key: 'Consumers:', val: 'Many subscribers' },
        { key: 'Order/Replay:', val: 'FIFO option; no replay' },
        { key: 'Best for:', val: 'Fan-out, notifications' },
      ],
    },
    {
      title: 'Kinesis',
      rows: [
        { key: 'Model:', val: 'Streaming (ordered)' },
        { key: 'Consumers:', val: 'Many, independent' },
        { key: 'Order/Replay:', val: 'Ordered + replay in retention' },
        { key: 'Best for:', val: 'Real-time analytics, ordered events' },
      ],
    },
  ],
};

const CMP_RDS = {
  title: 'RDS Multi-AZ vs Read Replicas',
  cards: [
    {
      title: 'Multi-AZ',
      rows: [
        { key: 'Purpose:', val: 'High availability / failover' },
        { key: 'Replication:', val: 'Synchronous' },
        { key: 'Reads:', val: 'Standby NOT readable' },
        { key: 'Failover:', val: 'Automatic (DNS) on failure' },
        { key: 'Scope:', val: 'Single region, 2 AZs' },
      ],
    },
    {
      title: 'Read Replicas',
      rows: [
        { key: 'Purpose:', val: 'Read scaling / performance' },
        { key: 'Replication:', val: 'Asynchronous' },
        { key: 'Reads:', val: 'Replicas serve read traffic' },
        { key: 'Failover:', val: 'Manual promotion' },
        { key: 'Scope:', val: 'Same/cross-region (5; Aurora 15)' },
      ],
    },
  ],
};

const CMP_SECRETS = {
  title: 'Secrets Manager vs SSM Parameter Store',
  cards: [
    {
      title: 'Secrets Manager',
      rows: [
        { key: 'Rotation:', val: 'Automatic (Lambda)' },
        { key: 'Cost:', val: 'Per secret + API calls' },
        { key: 'Integrations:', val: 'RDS / Redshift / DocumentDB' },
        { key: 'Best for:', val: 'Credentials needing rotation' },
      ],
    },
    {
      title: 'SSM Parameter Store',
      rows: [
        { key: 'Rotation:', val: 'None built-in' },
        { key: 'Cost:', val: 'Free (Standard tier)' },
        { key: 'Types:', val: 'String / StringList / SecureString' },
        { key: 'Best for:', val: 'Config + simple secrets' },
      ],
    },
  ],
};

const CMP_EBS = {
  title: 'EBS gp3 vs io2 vs Instance Store',
  cards: [
    {
      title: 'gp3 (General-purpose SSD)',
      rows: [
        { key: 'IOPS:', val: '3,000 baseline -> 16,000 (independent of size)' },
        { key: 'Throughput:', val: '125-1,000 MB/s, set independently' },
        { key: 'Persistence:', val: 'Persistent (network volume)' },
        { key: 'Best for:', val: 'Most workloads, cost-effective default' },
      ],
    },
    {
      title: 'io2 / io2 Block Express',
      rows: [
        { key: 'IOPS:', val: 'Up to 256,000' },
        { key: 'Durability:', val: '99.999%' },
        { key: 'Persistence:', val: 'Persistent (network volume)' },
        { key: 'Best for:', val: 'Critical high-IOPS DBs (Oracle, SAP)' },
      ],
    },
    {
      title: 'Instance Store',
      rows: [
        { key: 'IOPS:', val: 'Very high (physically attached NVMe)' },
        { key: 'Durability:', val: 'Ephemeral' },
        { key: 'Persistence:', val: 'LOST on stop / terminate' },
        { key: 'Best for:', val: 'Temp data, caches, buffers, scratch' },
      ],
    },
  ],
};

/* --------------------------------------------------------------- main */

async function main() {
  const data = JSON.parse(await readFile(jsonPath, 'utf8'));

  // 1+2. Security domain: cards -> services
  const security = findDomain(data, 'security');
  if (security) {
    const existing = new Set((security.services ?? []).map((s) => s.name));
    security.services = [
      ...(security.services ?? []),
      ...SECURITY_SERVICES.filter((s) => !existing.has(s.name)),
    ];
    // Per-service info now lives in `services`; drop the duplicate cards.
    delete security.cards;
    // Add the Secrets Manager vs SSM Parameter Store comparison.
    addComparisonIfMissing(security, CMP_SECRETS);
  }

  // 2. Kinesis split (analytics)
  const analytics = findDomain(data, 'analytics');
  if (analytics) {
    const hasSplit = analytics.services.some((s) => s.name === 'Kinesis Data Streams');
    if (!hasSplit) {
      const idx = analytics.services.findIndex((s) => s.name === 'Amazon Kinesis');
      const insertAt = idx >= 0 ? idx : analytics.services.length;
      if (idx >= 0) analytics.services.splice(idx, 1);
      analytics.services.splice(insertAt, 0, KINESIS_DATA_STREAMS, KINESIS_FIREHOSE);
    }
  }

  // 2. Management additions
  const governance = findDomain(data, 'governance');
  if (governance) {
    const names = new Set(governance.services.map((s) => s.name));
    if (!names.has('SSM Parameter Store')) governance.services.push(SSM_PARAMETER_STORE);
    if (!names.has('CodePipeline / CodeDeploy')) governance.services.push(CODEPIPELINE);
  }

  // 3. Priority re-tag by name
  const retagged = setPriorityByName(data, RETAG);

  // 4. Comparison pairs
  const networking = findDomain(data, 'networking');
  if (networking) {
    addComparisonIfMissing(networking, CMP_NAT);
    addComparisonIfMissing(networking, CMP_ELB);
  }
  const integration = findDomain(data, 'integration');
  if (integration) addComparisonIfMissing(integration, CMP_SQS_SNS_KINESIS);
  const databases = findDomain(data, 'databases');
  if (databases) addComparisonIfMissing(databases, CMP_RDS);
  const storage = findDomain(data, 'storage');
  if (storage) addComparisonIfMissing(storage, CMP_EBS);

  // 5. Enrich a few existing entries
  const compute = findDomain(data, 'compute');
  const ec2 = compute?.services.find((s) => s.name === 'Amazon EC2');
  appendExamTopicsIfMissing(ec2, [
    'Spot: up to 90% off, 2-minute interruption notice; use Spot Fleet + capacity-optimized allocation for fault-tolerant/batch work',
    'Savings Plans: Compute (flexible across EC2/Fargate/Lambda) vs EC2 Instance (cheaper, family/region locked)',
  ]);
  const ebs = storage?.services.find((s) => s.name === 'Amazon EBS');
  appendExamTopicsIfMissing(ebs, [
    'gp3 decouples capacity from IOPS/throughput (set them independently); gp2 coupled IOPS to volume size',
    'Instance Store: ephemeral local disk, data lost on stop/terminate — never for persistent data',
  ]);

  data.source = 'AWS_Study_Roadmap_CLF_SAA.html + saa_c03_must_learn_resources.html';

  await writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  const allServices = data.domains.flatMap((d) => d.services ?? []);
  const counts = allServices.reduce((acc, s) => {
    acc[s.priority] = (acc[s.priority] ?? 0) + 1;
    return acc;
  }, {});
  const comparisons = data.domains.reduce((n, d) => n + (d.comparisons?.length ?? 0), 0);

  console.log(`✓ Enriched ${jsonPath}`);
  console.log(`  Services: ${allServices.length} (re-tagged ${retagged})`);
  console.log(`  Priority counts:`, counts);
  console.log(`  Security services: ${security?.services.length ?? 0}`);
  console.log(`  Comparison sets: ${comparisons}`);
}

main().catch((err) => {
  console.error('✖ Enrichment failed');
  console.error(err);
  process.exit(1);
});
