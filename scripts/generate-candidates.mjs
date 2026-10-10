/**
 * Generates src/data/candidates.json: the 19 hand-written base candidates plus
 * ~230 synthetic ones spread across every Book profile.
 *
 * All names are fictional combinations from the pools below; no real person
 * is represented. The generator is seeded, so re-running it yields the same
 * file (change SEED to reshuffle).
 *
 *   node scripts/generate-candidates.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BOOK = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/book.json'), 'utf8'));
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidates.base.json'), 'utf8'));

const SEED = 20261010;
const TARGET_TOTAL = 250;

/* ------------------------------------------------------------------ */
/* Seeded random helpers                                                */
/* ------------------------------------------------------------------ */
let state = SEED;
function rand() {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(rand() * arr.length)];
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const weighted = pairs => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
};

/* ------------------------------------------------------------------ */
/* Pools (fictional)                                                    */
/* ------------------------------------------------------------------ */
const FIRST = [
  'Mariana', 'Andrés', 'Camila', 'Santiago', 'Valentina', 'Mateo', 'Isabella', 'Sebastián', 'Daniela', 'Nicolás',
  'Gabriela', 'Alejandro', 'Paula', 'Julián', 'Laura', 'Tomás', 'Natalia', 'Felipe', 'Luciana', 'Emilio',
  'Antonia', 'Rodrigo', 'Fernanda', 'Diego', 'Renata', 'Ignacio', 'Catalina', 'Joaquín', 'Ximena', 'Bruno',
  'Adriana', 'Esteban', 'Lucía', 'Martín', 'Juliana', 'Agustín', 'Carolina', 'Benjamín', 'Elena', 'Gonzalo',
  'Amara', 'Wanjiru', 'Kofi', 'Zuri', 'Tatiana', 'Óscar', 'Victoria', 'Samuel', 'Regina', 'Álvaro'
];
const LAST = [
  'Castillo', 'Rojas', 'Herrera', 'Navarro', 'Vargas', 'Salazar', 'Ortega', 'Medina', 'Cárdenas', 'Peña',
  'Guerrero', 'Molina', 'Reyes', 'Fuentes', 'Acosta', 'Cabrera', 'Paredes', 'Villalba', 'Quintero', 'Lozano',
  'Espinoza', 'Delgado', 'Zamora', 'Ibarra', 'Pacheco', 'Montoya', 'Serrano', 'Arce', 'Valdés', 'Bustamante',
  'Otieno', 'Mwangi', 'Achieng', 'Figueroa', 'Suárez', 'Ocampo', 'Cordero', 'Pineda', 'Ramos', 'Benítez'
];

const COUNTRIES = [
  ['Colombia', ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga'], 34],
  ['Mexico', ['Mexico City', 'Guadalajara', 'Monterrey', 'Querétaro'], 18],
  ['Peru', ['Lima', 'Arequipa'], 9],
  ['Argentina', ['Buenos Aires', 'Córdoba', 'Rosario'], 9],
  ['Chile', ['Santiago', 'Valparaíso'], 6],
  ['Costa Rica', ['San José', 'Heredia'], 5],
  ['Guatemala', ['Guatemala City'], 4],
  ['Dominican Republic', ['Santo Domingo'], 4],
  ['Honduras', ['San Pedro Sula', 'Tegucigalpa'], 3],
  ['El Salvador', ['San Salvador'], 3],
  ['Kenya', ['Nairobi'], 3],
  ['Ecuador', ['Quito', 'Guayaquil'], 2]
];

const FAMILY_POOLS = {
  'FAM-ADM': {
    sectors: ['US Property Management Group', 'Regional Insurance Broker', 'Professional Services Firm', 'Nonprofit Organization', 'Real Estate Investment Firm'],
    earlier: ['Administrative Assistant', 'Office Coordinator', 'Receptionist & Admin Support'],
    competencies: ['Calendar & Travel Management', 'Executive Communication', 'Document Control', 'Vendor Coordination', 'Confidentiality', 'Process Discipline'],
    education: ['Business Administration', 'International Business', 'Executive Secretariat', 'Industrial Engineering'],
    certs: ['Microsoft Office Specialist', 'Google Workspace Administrator', 'Certified Administrative Professional (CAP)', 'Notion & Asana Workflows'],
    achievements: [
      'Managed calendars and travel for {k} executives across {z} time zones with no missed commitments in {m} months.',
      'Cut document turnaround from {a} to {b} days by standardizing filing and approval templates.',
      'Processed {n}+ vendor invoices per month at 99% accuracy.',
      'Onboarded {k} new hires per quarter with complete documentation on day one.'
    ],
    salary: [1100, 2300]
  },
  'FAM-COB': {
    sectors: ['Consumer Lending Company', 'Auto Finance Lender', 'Telecom Operator', 'Debt Recovery Agency', 'Retail Credit Chain'],
    earlier: ['Collections Agent', 'Customer Account Representative', 'Billing Assistant'],
    competencies: ['Negotiation', 'Portfolio Prioritization', 'Regulatory Compliance (FDCPA)', 'Dispute Resolution', 'Payment Plan Structuring', 'Call Quality'],
    education: ['Business Administration', 'Accounting Technician', 'Finance', 'Economics'],
    certs: ['FDCPA Compliance Training', 'Negotiation Skills Certificate', 'Salesforce Service Cloud Basics'],
    achievements: [
      'Recovered USD {n}K in 90+ day receivables within one quarter.',
      'Kept portfolio delinquency under {p}% across {n} active accounts.',
      'Negotiated {n}+ payment plans per month with a {q}% fulfillment rate.',
      'Reduced write-offs by {p}% through earlier contact cadences.'
    ],
    salary: [1000, 1900]
  },
  'FAM-FIN': {
    sectors: ['Manufacturing Group', 'Regional Retail Chain', 'SaaS Company', 'Hospitality Group', 'Logistics Operator', 'Professional Services Firm'],
    earlier: ['Accounting Assistant', 'Accounts Payable Clerk', 'Junior Financial Analyst'],
    competencies: ['Month-End Close', 'Reconciliations', 'US GAAP', 'Financial Modeling', 'Audit Readiness', 'ERP Data Integrity'],
    education: ['Public Accounting', 'Finance', 'Business Administration', 'Economics'],
    certs: ['CPA (local)', 'QuickBooks ProAdvisor', 'NetSuite Foundation', 'FMVA', 'SAP FI Fundamentals'],
    achievements: [
      'Closed the monthly books in {d} business days, down from {d2}.',
      'Reconciled {n}+ bank and intercompany accounts monthly with no audit findings.',
      'Built the annual budget model for {k} business units with {p}% variance.',
      'Processed payroll for {n} employees in {k} countries on time for {m} consecutive cycles.'
    ],
    salary: [1500, 3300]
  },
  'FAM-LEG': {
    sectors: ['Personal Injury Law Firm', 'Immigration Law Practice', 'Corporate Legal Department', 'Litigation Boutique', 'Insurance Defense Firm'],
    earlier: ['Legal Assistant', 'Intake Specialist', 'Records Clerk'],
    competencies: ['Case Management', 'Client Communication', 'Legal Drafting', 'Deadline Tracking', 'Medical Records Review', 'Confidentiality'],
    education: ['Law', 'Paralegal Studies', 'Business Administration', 'Political Science'],
    certs: ['Paralegal Certificate', 'Clio Certified', 'Filevine Administrator', 'HIPAA Awareness'],
    achievements: [
      'Managed a caseload of {n} active personal injury files from intake to settlement.',
      'Prepared demand packages that supported USD {n}K in settlements in one year.',
      'Reached {p}% intake-to-retainer conversion on inbound leads.',
      'Kept {n}+ case deadlines on track with zero missed filings.'
    ],
    salary: [1300, 2700]
  },
  'FAM-MKT': {
    sectors: ['D2C E-commerce Brand', 'Digital Marketing Agency', 'SaaS Scale-up', 'Media Group', 'Consumer Fintech'],
    earlier: ['Marketing Assistant', 'Content Writer', 'Paid Media Trainee'],
    competencies: ['Performance Marketing', 'Analytics & Attribution', 'Content Strategy', 'A/B Testing', 'Copywriting', 'Stakeholder Reporting'],
    education: ['Marketing', 'Communications', 'Advertising', 'Business Administration'],
    certs: ['Google Ads Search Certification', 'Meta Blueprint', 'HubSpot Content Marketing', 'Google Analytics 4'],
    achievements: [
      'Grew paid-search ROAS from {a}x to {b}x in six months.',
      'Scaled organic traffic by {p}% through a content and technical SEO program.',
      'Managed a USD {n}K monthly media budget across Google and Meta.',
      'Produced {n}+ long-form pieces that rank on page one for target keywords.'
    ],
    salary: [1400, 2900]
  },
  'FAM-OPE': {
    sectors: ['Freight Forwarding Company', '3PL Logistics Provider', 'Industrial Distributor', 'Food & Beverage Manufacturer', 'Retail Supply Chain'],
    earlier: ['Operations Coordinator', 'Logistics Assistant', 'Purchasing Assistant'],
    competencies: ['Carrier Coordination', 'Supplier Negotiation', 'Process Improvement', 'Inventory Control', 'KPI Reporting', 'Problem Solving'],
    education: ['Industrial Engineering', 'Logistics & Supply Chain', 'Business Administration', 'International Trade'],
    certs: ['Lean Six Sigma Yellow Belt', 'APICS CSCP (in progress)', 'Advanced Excel for Operations'],
    achievements: [
      'Coordinated {n}+ shipments per week with {p}% on-time delivery.',
      'Negotiated carrier rates saving {p}% annually.',
      'Reduced purchase order cycle time from {a} to {b} days.',
      'Maintained inventory accuracy above {q}% across {k} warehouses.'
    ],
    salary: [1300, 2700]
  },
  'FAM-OTR': {
    sectors: ['Telehealth Platform', 'Hospital Network', 'Legal Services Provider', 'Language Services Company'],
    earlier: ['Bilingual Customer Agent', 'Medical Receptionist', 'Translator'],
    competencies: ['Consecutive Interpretation', 'Medical Terminology', 'Legal Terminology', 'Cultural Mediation', 'Ethics & Confidentiality'],
    education: ['Modern Languages', 'Translation & Interpretation', 'Nursing', 'Law'],
    certs: ['CMI Medical Interpreter', 'Bridging the Gap', 'HIPAA Awareness', 'Court Interpreter Training'],
    achievements: [
      'Interpreted {n}+ medical consultations per month with full HIPAA compliance.',
      'Supported {n} legal depositions with certified consecutive interpretation.',
      'Maintained {q}% client satisfaction across remote interpretation sessions.'
    ],
    salary: [1500, 2600]
  },
  'FAM-PRO': {
    sectors: ['Home Health Agency', 'Field Services Company', 'Medical Staffing Agency', 'HVAC Services Provider'],
    earlier: ['Scheduling Assistant', 'Dispatcher', 'Customer Service Representative'],
    competencies: ['Shift Planning', 'Dispatch Coordination', 'Conflict Resolution', 'Multi-channel Communication', 'Attention to Detail'],
    education: ['Business Administration', 'Health Administration', 'Logistics'],
    certs: ['ServiceTitan Basics', 'Microsoft Excel Intermediate', 'Customer Service Excellence'],
    achievements: [
      'Scheduled {n}+ visits per week for a field team of {k} technicians.',
      'Reduced appointment no-shows by {p}% with confirmation workflows.',
      'Kept shift coverage at {q}% across {k} locations.'
    ],
    salary: [1000, 1900]
  },
  'FAM-SAL': {
    sectors: ['Hospital Network', 'Medical Billing Company', 'Multi-specialty Clinic', 'Health Insurance Carrier', 'Dental Group'],
    earlier: ['Medical Receptionist', 'Billing Assistant', 'Patient Services Representative'],
    competencies: ['Claims Processing', 'Insurance Verification', 'Patient Communication', 'EHR Navigation', 'HIPAA Compliance', 'Denial Management'],
    education: ['Health Administration', 'Nursing', 'Business Administration', 'Medical Billing & Coding'],
    certs: ['CPC (AAPC)', 'HIPAA Awareness', 'Epic Fundamentals', 'Athenahealth Basics'],
    achievements: [
      'Submitted {n}+ claims per month with a first-pass acceptance rate of {q}%.',
      'Reduced days in A/R from {a} to {b}.',
      'Obtained {n}+ prior authorizations per week with {q}% approval.',
      'Coordinated care for {n} patients with chronic conditions.'
    ],
    salary: [1100, 2300]
  },
  'FAM-SER': {
    sectors: ['SaaS Company', 'Travel & Hospitality Platform', 'Telecom Operator', 'E-commerce Marketplace', 'Subscription Box Company'],
    earlier: ['Customer Support Representative', 'Chat Agent', 'Help Desk Associate'],
    competencies: ['Account Management', 'De-escalation', 'CRM Hygiene', 'Product Knowledge', 'Churn Prevention', 'Written Communication'],
    education: ['Business Administration', 'Communications', 'International Business', 'Psychology'],
    certs: ['Zendesk Support Admin', 'HubSpot Service Hub', 'Salesforce Service Cloud Basics'],
    achievements: [
      'Maintained a CSAT of {q}% across {n}+ monthly tickets.',
      'Reduced average handle time by {p}% while keeping quality scores above {q}%.',
      'Managed a book of {n} B2B accounts with {q}% renewal.',
      'Resolved {q}% of cases on first contact.'
    ],
    salary: [1000, 2000]
  },
  'FAM-TAL': {
    sectors: ['BPO Operator', 'Staffing Agency', 'Technology Company', 'Retail Group', 'Healthcare Provider'],
    earlier: ['Recruiting Coordinator', 'HR Assistant', 'Sourcing Specialist'],
    competencies: ['Full-cycle Recruiting', 'Boolean Sourcing', 'Stakeholder Management', 'Employer Branding', 'HR Operations', 'Data-driven Hiring'],
    education: ['Psychology', 'Business Administration', 'Industrial Relations', 'Human Resources'],
    certs: ['LinkedIn Certified Recruiter', 'SHRM-CP (in progress)', 'Greenhouse Administrator', 'Workday HCM Basics'],
    achievements: [
      'Filled {n} positions per quarter with a {d}-day average time to fill.',
      'Built a sourcing pipeline of {n}+ qualified candidates for hard-to-fill roles.',
      'Reduced early attrition by {p}% through structured onboarding.',
      'Ran HR operations for {n} employees across {k} countries.'
    ],
    salary: [1300, 2700]
  },
  'FAM-TEC': {
    sectors: ['Fintech Platform', 'E-commerce Marketplace', 'Healthtech Startup', 'Enterprise Software Vendor', 'Logistics SaaS', 'Digital Bank'],
    earlier: ['Software Developer', 'Junior Developer', 'QA Automation Engineer', 'Data Analyst'],
    competencies: ['System Design', 'Code Review', 'Testing Discipline', 'Agile Delivery', 'Cloud Infrastructure', 'Performance Optimization'],
    education: ['Systems Engineering', 'Computer Science', 'Software Engineering', 'Electronic Engineering'],
    certs: ['AWS Certified Developer', 'Microsoft Azure Fundamentals', 'Scrum Master (PSM I)', 'Google Data Analytics', 'Kubernetes (CKAD)'],
    achievements: [
      'Shipped {n}+ production releases with a {p}% reduction in regressions.',
      'Cut page load time by {p}% through code splitting and caching.',
      'Designed REST APIs serving {n}K requests per day.',
      'Automated CI/CD pipelines, reducing deploy time from {a} to {b} minutes.',
      'Built dashboards used by {n} business users weekly.'
    ],
    salary: [2200, 4600]
  }
};

const GENERIC_SKILLS = ['Microsoft Excel', 'Google Workspace', 'Slack', 'Microsoft Teams', 'Written English', 'Time Management', 'CRM Tools', 'Reporting'];
const SOURCES = [['Internal database', 45], ['LinkedIn', 30], ['Referral', 15], ['Job board', 10]];
const AVAILABILITY = [['Immediate', 35], ['15 days', 30], ['30 days', 25], ['45 days', 10]];

const SUMMARY_TEMPLATES = [
  '{role} with {n} years supporting {sectorLower} teams in the US, focused on {s1}, {s2} and {s3}.',
  'Bilingual {role} who has spent {n} years in {sectorLower} environments; strongest in {s1} and {s2}, comfortable with distributed teams.',
  '{n}-year track record as {role} across {sector} and {sector2} companies, with hands-on {s1} and {s2}.',
  'Detail-oriented {role} ({n} years) used to high-volume {sectorLower} operations; brings {s1}, {s2} and reliable follow-through.',
  '{role} with {n} years of experience, most recently at a {sectorLower}; owns {s1} end to end and supports {s2} and {s3}.'
];

/* ------------------------------------------------------------------ */
/* Builders                                                             */
/* ------------------------------------------------------------------ */
function fill(template) {
  return template
    .replace('{n}', String(int(40, 320)))
    .replace('{k}', String(int(2, 8)))
    .replace('{z}', String(int(2, 5)))
    .replace('{m}', String(int(12, 36)))
    .replace('{a}', String(int(8, 14)))
    .replace('{b}', String(int(2, 6)))
    .replace('{d2}', String(int(8, 12)))
    .replace('{d}', String(int(3, 6)))
    .replace('{p}', String(int(12, 38)))
    .replace('{q}', String(int(91, 98)));
}

const roleBase = name => name.replace(/\s*\(.*?\)\s*/g, '').trim();
const yearsText = n => `${n} ${n === 1 ? 'year' : 'years'}`;

function englishFor(familyId, years) {
  const executive = familyId === 'FAM-OTR' || familyId === 'FAM-TEC' || familyId === 'FAM-MKT';
  const base = executive ? [['B1', 5], ['B2', 35], ['C1', 45], ['C2', 12], ['Not specified', 3]] : [['A2', 4], ['B1', 18], ['B2', 42], ['C1', 28], ['C2', 4], ['Not specified', 4]];
  if (years >= 7) return weighted(base.map(([l, w]) => [l, l === 'C1' || l === 'C2' ? w * 1.4 : w]));
  return weighted(base);
}

function salaryFor(familyId, years) {
  const [lo, hi] = FAMILY_POOLS[familyId].salary;
  const t = Math.min(years, 10) / 10;
  const base = Math.round((lo + (hi - lo) * t) / 50) * 50;
  return `USD ${base.toLocaleString('en-US')} - ${(base + int(4, 8) * 100).toLocaleString('en-US')} / month`;
}

function trajectoryFor(profile, familyId, years) {
  const pools = FAMILY_POOLS[familyId];
  const base = roleBase(profile.nombre);
  const roles = [];
  const now = 2026;
  let cursor = now;
  const spans = years >= 6 ? [int(2, 4), int(2, 3), Math.max(1, years - 6)] : years >= 3 ? [int(1, 2), years - 1] : [years];
  const titles = years >= 6 ? [`Senior ${base}`, base, pick(pools.earlier)] : [base, pick(pools.earlier)];
  const sectors = shuffle(pools.sectors);
  spans.forEach((span, i) => {
    const start = cursor - span;
    roles.push({
      cargo: titles[i],
      sectorEmpresa: sectors[i % sectors.length],
      duracion: i === 0 ? `${start} - Present` : `${start} - ${cursor}`,
      logros: shuffle(pools.achievements).slice(0, i === 0 ? 2 : 1).map(fill)
    });
    cursor = start;
  });
  return roles;
}

const usedNames = new Set(BASE.map(c => c.nombre));
function uniqueName() {
  for (let i = 0; i < 100; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  const name = `${pick(FIRST)} ${pick(LAST)} ${pick(LAST)}`;
  usedNames.add(name);
  return name;
}

const usedIds = new Set(BASE.map(c => c.id));
function uniqueId() {
  for (;;) {
    const id = `CAN-${int(1000, 9999)}`;
    if (!usedIds.has(id)) {
      usedIds.add(id);
      return id;
    }
  }
}

function pickCountry() {
  const [country, cities] = weighted(COUNTRIES.map(c => [c, c[2]]));
  return { pais: country, ciudad: pick(cities) };
}

function makeCandidate(profile, family, siblings) {
  const years = weighted([[1, 6], [2, 12], [3, 16], [4, 16], [5, 14], [6, 11], [7, 9], [8, 7], [10, 5], [12, 3]]);
  const pools = FAMILY_POOLS[family.id];
  const { pais, ciudad } = pickCountry();
  const skills = shuffle(profile.habilidades).slice(0, int(4, Math.min(6, profile.habilidades.length)));
  const extraSkills = shuffle(GENERIC_SKILLS).slice(0, int(1, 2));
  const sectors = shuffle(pools.sectors);
  const role = roleBase(profile.nombre);
  const perfiles = [profile.id];
  if (siblings.length > 0 && rand() < 0.22) perfiles.push(pick(siblings).id);

  const summary = pick(SUMMARY_TEMPLATES)
    .replace('{role}', role)
    .replace('{n}', String(years))
    .replace('{sectorLower}', sectors[0].toLowerCase())
    .replace('{sector}', sectors[0])
    .replace('{sector2}', sectors[1] ?? sectors[0])
    .replace('{s1}', skills[0])
    .replace('{s2}', skills[1])
    .replace('{s3}', skills[2] ?? skills[1]);

  const updatedDaysAgo = int(2, 180);
  const updated = new Date(Date.UTC(2026, 9, 10) - updatedDaysAgo * 86400000).toISOString().slice(0, 10);

  return {
    id: uniqueId(),
    nombre: uniqueName(),
    perfilesAsociados: perfiles,
    experienciaAnos: years,
    experienciaTexto: yearsText(years),
    nivelIngles: englishFor(family.id, years),
    pais,
    ciudad,
    modalidad: weighted([['Remote', 70], ['Hybrid', 20], ['On-site', 10]]),
    habilidades: [...skills, ...extraSkills],
    resumenProfesional: summary.charAt(0).toUpperCase() + summary.slice(1),
    trayectoria: trajectoryFor(profile, family.id, years),
    competenciasClave: shuffle(pools.competencies).slice(0, 3),
    educacion: pick(pools.education),
    certificaciones: shuffle(pools.certs).slice(0, weighted([[0, 25], [1, 50], [2, 25]])),
    disponibilidad: weighted(AVAILABILITY),
    rangoSalarialInterno: salaryFor(family.id, years),
    fuente: weighted(SOURCES),
    ultimaActualizacion: updated
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */
const profiles = BOOK.flatMap(f => f.especialidades.flatMap(s => s.perfiles.map(p => ({ profile: p, family: f, siblings: s.perfiles.filter(x => x.id !== p.id) }))));
const baseCountByProfile = new Map();
for (const c of BASE) for (const id of c.perfilesAsociados) baseCountByProfile.set(id, (baseCountByProfile.get(id) ?? 0) + 1);

const toGenerate = TARGET_TOTAL - BASE.length;
// Every profile gets at least 2 candidates; the remainder is spread by weight (tech, finance, admin heavier).
const weightFor = f => ({ 'FAM-TEC': 3, 'FAM-FIN': 2.2, 'FAM-ADM': 2, 'FAM-SER': 2, 'FAM-COB': 1.8, 'FAM-SAL': 1.6, 'FAM-LEG': 1.5, 'FAM-TAL': 1.4 }[f.id] ?? 1);
const plan = profiles.map(p => ({ ...p, count: Math.max(0, 2 - (baseCountByProfile.get(p.profile.id) ?? 0)) }));
let remaining = toGenerate - plan.reduce((s, p) => s + p.count, 0);
const totalWeight = plan.reduce((s, p) => s + weightFor(p.family), 0);
for (const p of plan) {
  const extra = Math.round((weightFor(p.family) / totalWeight) * remaining);
  p.count += extra;
}
let diff = toGenerate - plan.reduce((s, p) => s + p.count, 0);
while (diff !== 0) {
  const p = pick(plan);
  if (diff > 0) {
    p.count++;
    diff--;
  } else if (p.count > 2) {
    p.count--;
    diff++;
  }
}

const generated = [];
for (const p of plan) for (let i = 0; i < p.count; i++) generated.push(makeCandidate(p.profile, p.family, p.siblings));

const all = [...BASE, ...generated].sort((a, b) => a.nombre.localeCompare(b.nombre));
const out = path.join(ROOT, 'src/data/candidates.json');
fs.writeFileSync(out, JSON.stringify(all, null, 2) + '\n');

const byCountry = {};
for (const c of all) byCountry[c.pais] = (byCountry[c.pais] ?? 0) + 1;
console.log(`Wrote ${all.length} candidates to ${path.relative(ROOT, out)} (${BASE.length} base + ${generated.length} generated)`);
console.log('By country:', byCountry);
const emptyProfiles = profiles.filter(p => !all.some(c => c.perfilesAsociados.includes(p.profile.id)));
console.log('Profiles without candidates:', emptyProfiles.length);
