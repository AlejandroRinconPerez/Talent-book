import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILY_BY_NAME, PROFILE_BY_ID, SPECIALTY_KEYS_BY_CANDIDATE, candidateSpecialties } from '../data/indexes';
import { Candidato, NivelIngles } from '../types';

/**
 * Candidate search for the sales team, simulated in the browser.
 *
 * In production this is one call to the backend, which embeds the text and runs a
 * similarity query against the CV vectors in Postgres (pgvector). The structured
 * fields (English, years, country, work mode) live in the same table, so the
 * filters go into the same SQL:
 *
 *   POST /api/candidates/search  { texto, filtros, incluirPorValidar }
 *     → [{ candidatoId, similitud, porValidar[] }]
 *
 * Here a TF-IDF vector over each CV stands in for the embedding so the screens
 * behave the same way. The rules the client asked for are the real ones:
 *
 *  - The text always drives the ranking; filters are optional.
 *  - English and experience are minimums: B1 accepts B1, B2, C1 and C2; 3 years
 *    accepts 3 or more.
 *  - A filter only rules out a candidate who HAS the data and falls short. A
 *    candidate with no data for it stays in, flagged "to validate", below those
 *    who meet everything.
 */

/* ------------------------------------------------------------------ */
/* Filters                                                              */
/* ------------------------------------------------------------------ */

export const ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type NivelCefr = (typeof ENGLISH_LEVELS)[number];

export type Modalidad = 'Remote' | 'Hybrid' | 'On-site';

export interface SearchFilters {
  /** Job family name. */
  familia?: string;
  /** Book specialty key (`familiaId:nombre`). */
  especialidadKey?: string;
  /** Minimum level; anything at or above it passes. */
  inglesMinimo?: NivelCefr;
  /** Minimum years; anything at or above it passes. */
  experienciaMinima?: number;
  paises?: string[];
  modalidad?: Modalidad;
}

export type FilterField = 'ingles' | 'experiencia' | 'paises' | 'modalidad';

export const FILTER_LABEL: Record<FilterField, string> = {
  ingles: 'English',
  experiencia: 'Experience',
  paises: 'Country',
  modalidad: 'Work mode'
};

export const englishRank = (level: NivelIngles | string | undefined): number => {
  const i = ENGLISH_LEVELS.indexOf(level as NivelCefr);
  return i === -1 ? 0 : i + 1;
};

export const isCefr = (level: string | undefined): level is NivelCefr => englishRank(level) > 0;

/** Maps the Spanish and English spellings in the data to one value. */
export function normalizeModality(value: string | undefined): Modalidad | undefined {
  const v = (value ?? '').toLowerCase();
  if (v.includes('remot')) return 'Remote';
  if (v.includes('hybrid') || v.includes('híbrid') || v.includes('hibrid')) return 'Hybrid';
  if (v.includes('site') || v.includes('presencial')) return 'On-site';
  return undefined;
}

export const hasActiveFilters = (f: SearchFilters) =>
  Boolean(f.familia || f.especialidadKey || f.inglesMinimo || f.experienciaMinima || f.modalidad || (f.paises && f.paises.length > 0));

type Check = 'cumple' | 'no_cumple' | 'sin_dato';

function checkField(c: Candidato, field: FilterField, f: SearchFilters): Check | null {
  switch (field) {
    case 'ingles': {
      if (!f.inglesMinimo) return null;
      if (!isCefr(c.nivelIngles)) return 'sin_dato';
      return englishRank(c.nivelIngles) >= englishRank(f.inglesMinimo) ? 'cumple' : 'no_cumple';
    }
    case 'experiencia': {
      if (!f.experienciaMinima) return null;
      if (!(c.experienciaAnos > 0)) return 'sin_dato';
      return c.experienciaAnos >= f.experienciaMinima ? 'cumple' : 'no_cumple';
    }
    case 'paises': {
      if (!f.paises || f.paises.length === 0) return null;
      if (!c.pais) return 'sin_dato';
      return f.paises.includes(c.pais) ? 'cumple' : 'no_cumple';
    }
    case 'modalidad': {
      if (!f.modalidad) return null;
      const m = normalizeModality(c.modalidad);
      if (!m) return 'sin_dato';
      return m === f.modalidad ? 'cumple' : 'no_cumple';
    }
  }
}

const FIELDS: FilterField[] = ['ingles', 'experiencia', 'paises', 'modalidad'];

/** Taxonomy filters are always known for a candidate, so they are plain yes/no. */
function inTaxonomy(c: Candidato, f: SearchFilters): boolean {
  const keys = SPECIALTY_KEYS_BY_CANDIDATE.get(c.id) ?? [];
  if (f.especialidadKey) return keys.includes(f.especialidadKey);
  if (f.familia) {
    const familyId = FAMILY_BY_NAME.get(f.familia)?.id;
    return keys.some(k => k.startsWith(`${familyId}:`));
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Text → vector (stand-in for the embedding)                           */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const STOPWORDS = new Set(
  (
    'a an and are as at be by for from has have in into is it its of on or that the to with we our you your who will this ' +
    'el la los las un una unos unas y o de del en con para por que se su sus al lo como mas muy sin sobre entre ' +
    'need needs looking seeking candidate candidates client role position years year experience experiencia anos ano minimum least ' +
    'buscamos busca necesita necesitamos cliente perfil cargo vacante minimo english ingles level nivel'
  ).split(' ')
);

/** Spanish terms a rep may type, and a few shorthands, mapped to the vocabulary the CVs use. */
const EXPANSIONS: Record<string, string[]> = {
  contador: ['accountant', 'accounting'],
  contadora: ['accountant', 'accounting'],
  contable: ['accounting'],
  contabilidad: ['accounting'],
  cobranza: ['collections'],
  cobranzas: ['collections'],
  cobro: ['collections'],
  cartera: ['collections', 'receivable'],
  nomina: ['payroll'],
  desarrollador: ['developer', 'engineer'],
  desarrolladora: ['developer', 'engineer'],
  programador: ['developer'],
  ingeniero: ['engineer'],
  asistente: ['assistant'],
  ejecutivo: ['executive'],
  ejecutiva: ['executive'],
  reclutamiento: ['recruitment', 'recruiting'],
  reclutador: ['recruiter', 'recruitment'],
  seleccion: ['recruitment'],
  facturacion: ['billing'],
  medico: ['medical'],
  medica: ['medical'],
  salud: ['healthcare', 'medical'],
  servicio: ['service'],
  atencion: ['customer', 'support'],
  soporte: ['support'],
  ventas: ['sales'],
  logistica: ['logistics', 'freight'],
  compras: ['procurement', 'purchasing'],
  abogado: ['attorney', 'legal'],
  juridico: ['legal'],
  paralegal: ['legal'],
  datos: ['data'],
  analista: ['analyst'],
  finanzas: ['finance', 'financial'],
  financiero: ['financial', 'finance'],
  mercadeo: ['marketing'],
  contenido: ['content'],
  citas: ['appointment', 'scheduling'],
  agendamiento: ['scheduling'],
  despacho: ['dispatch'],
  conciliacion: ['reconciliation'],
  conciliaciones: ['reconciliation'],
  impuestos: ['tax'],
  auditoria: ['audit'],
  nube: ['cloud'],
  humanos: ['hr', 'human'],
  ar: ['receivable'],
  ap: ['payable'],
  bookkeeping: ['accounting'],
  bookkeeper: ['accounting'],
  frontend: ['react', 'frontend'],
  backend: ['api', 'backend'],
  devops: ['cloud', 'devops']
};

const stem = (t: string) => (t.length > 4 && t.endsWith('ies') ? t.slice(0, -3) + 'y' : t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);

function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of norm(text).match(/[a-z0-9][a-z0-9+#]*/g) ?? []) {
    if (raw.length < 2 || STOPWORDS.has(raw) || /^\d+$/.test(raw)) continue;
    out.push(raw);
  }
  return out;
}

type Vector = Map<string, number>;

function addTerms(target: Map<string, number>, text: string | string[], weight: number) {
  for (const t of tokens(Array.isArray(text) ? text.join(' ') : text)) {
    const s = stem(t);
    target.set(s, (target.get(s) ?? 0) + weight);
  }
}

/** The CV as the vector index sees it: what the person did, knows and is classified as. Location stays out. */
function candidateTerms(c: Candidato): Map<string, number> {
  const tf = new Map<string, number>();
  addTerms(tf, c.resumenProfesional, 1);
  addTerms(tf, c.habilidades, 2);
  addTerms(tf, c.competenciasClave, 1.5);
  addTerms(tf, c.trayectoria.map(t => t.cargo), 1.5);
  addTerms(tf, c.trayectoria.flatMap(t => t.logros), 0.5);
  addTerms(tf, [c.educacion, ...c.certificaciones], 1);
  addTerms(tf, candidateSpecialties(c).flatMap(s => [s.nombre, s.familia]), 1);
  addTerms(tf, c.perfilesAsociados.flatMap(id => PROFILE_BY_ID.get(id)?.nombre ?? []), 1);
  return tf;
}

const DOC_TF = new Map(MOCK_CANDIDATES.map(c => [c.id, candidateTerms(c)]));

const IDF: ReadonlyMap<string, number> = (() => {
  const df = new Map<string, number>();
  for (const tf of DOC_TF.values()) for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  const n = DOC_TF.size;
  return new Map(Array.from(df, ([term, d]) => [term, Math.log(1 + n / d)]));
})();

function toUnitVector(tf: Map<string, number>): Vector {
  const v: Vector = new Map();
  let sum = 0;
  for (const [term, f] of tf) {
    const idf = IDF.get(term);
    if (!idf) continue;
    const w = (1 + Math.log(f)) * idf;
    v.set(term, w);
    sum += w * w;
  }
  const len = Math.sqrt(sum) || 1;
  for (const [term, w] of v) v.set(term, w / len);
  return v;
}

const DOC_VECTORS = new Map(Array.from(DOC_TF, ([id, tf]) => [id, toUnitVector(tf)]));

interface QueryVector {
  vector: Vector;
  /** Display word for each term, as the rep typed it (or the expansion it came from). */
  surface: Map<string, string>;
}

function queryVector(text: string): QueryVector {
  const tf = new Map<string, number>();
  const surface = new Map<string, string>();
  for (const t of tokens(text)) {
    const s = stem(t);
    tf.set(s, (tf.get(s) ?? 0) + 1);
    if (!surface.has(s)) surface.set(s, t);
    for (const e of EXPANSIONS[t] ?? []) {
      const es = stem(e);
      tf.set(es, (tf.get(es) ?? 0) + 0.6);
      if (!surface.has(es)) surface.set(es, e);
    }
  }
  return { vector: toUnitVector(tf), surface };
}

function similarity(q: QueryVector, docId: string): { score: number; terms: string[] } {
  const d = DOC_VECTORS.get(docId);
  if (!d) return { score: 0, terms: [] };
  let score = 0;
  const parts: [string, number][] = [];
  for (const [term, qw] of q.vector) {
    const dw = d.get(term);
    if (!dw) continue;
    score += qw * dw;
    parts.push([term, qw * dw]);
  }
  parts.sort((a, b) => b[1] - a[1]);
  const terms = Array.from(new Set(parts.slice(0, 4).map(([t]) => q.surface.get(t) ?? t)));
  return { score, terms };
}

/* ------------------------------------------------------------------ */
/* Search                                                               */
/* ------------------------------------------------------------------ */

export interface CandidateSearchRequest {
  /** What the client asked for, in the rep's words. Empty: filters only. */
  texto: string;
  filtros: SearchFilters;
  /** Keep candidates who lack data for a filter (flagged). Off: complete matches only. */
  incluirPorValidar: boolean;
}

export interface CandidateSearchHit {
  candidato: Candidato;
  /** Similarity to the text, 0-1. Null when there is no text. */
  similitud: number | null;
  /** Similarity as 0-100 against the best result of this search. */
  relevancia: number | null;
  /** Words from the text that weighed most in the match. */
  coincidencias: string[];
  /** Filters this candidate has no data for. */
  porValidar: FilterField[];
}

export interface CandidateSearchResponse {
  hits: CandidateSearchHit[];
  /** True when the text drove the ranking. */
  semantica: boolean;
  completos: number;
  porValidar: number;
}

/** Results weaker than this share of the best match are dropped, as a top-K cut would. */
const RELATIVE_CUTOFF = 0.2;
const MIN_SIMILARITY = 0.03;

export function searchCandidates(req: CandidateSearchRequest, pool: readonly Candidato[] = MOCK_CANDIDATES): CandidateSearchResponse {
  const semantica = tokens(req.texto).length > 0;
  const q = semantica ? queryVector(req.texto) : null;

  const hits: CandidateSearchHit[] = [];
  for (const c of pool) {
    if (!inTaxonomy(c, req.filtros)) continue;

    const porValidar: FilterField[] = [];
    let excluded = false;
    for (const field of FIELDS) {
      const r = checkField(c, field, req.filtros);
      if (r === 'no_cumple') excluded = true;
      else if (r === 'sin_dato') porValidar.push(field);
    }
    if (excluded || (!req.incluirPorValidar && porValidar.length > 0)) continue;

    if (q) {
      const { score, terms } = similarity(q, c.id);
      if (score < MIN_SIMILARITY) continue;
      hits.push({ candidato: c, similitud: score, relevancia: null, coincidencias: terms, porValidar });
    } else {
      hits.push({ candidato: c, similitud: null, relevancia: null, coincidencias: [], porValidar });
    }
  }

  let ranked = [...hits].sort(compareCompleteFirst(() => 0));
  if (semantica) {
    const best = Math.max(0, ...hits.map(h => h.similitud ?? 0));
    ranked = hits
      .filter(h => (h.similitud ?? 0) >= best * RELATIVE_CUTOFF)
      .map(h => ({ ...h, relevancia: best === 0 ? 0 : Math.round(((h.similitud ?? 0) / best) * 100) }));
    ranked.sort(compareCompleteFirst((a, b) => (b.similitud ?? 0) - (a.similitud ?? 0)));
  }

  const completos = ranked.filter(h => h.porValidar.length === 0).length;
  return { hits: ranked, semantica, completos, porValidar: ranked.length - completos };
}

/** Candidates who meet every filter go first; within each group, the given order. */
export const compareCompleteFirst =
  (then: (a: CandidateSearchHit, b: CandidateSearchHit) => number) =>
  (a: CandidateSearchHit, b: CandidateSearchHit): number =>
    (a.porValidar.length > 0 ? 1 : 0) - (b.porValidar.length > 0 ? 1 : 0) || then(a, b);

/* ------------------------------------------------------------------ */
/* Reading requirements out of the text (stand-in for the LLM)          */
/* ------------------------------------------------------------------ */

export interface DetectedRequirement {
  field: FilterField;
  /** What the filter will say, e.g. "English B2 or higher". */
  label: string;
  /** The words in the text it came from. */
  source: string;
}

export interface ParsedRequirement {
  filtros: Pick<SearchFilters, 'inglesMinimo' | 'experienciaMinima' | 'paises' | 'modalidad'>;
  detectados: DetectedRequirement[];
}

const ENGLISH_WORDS: [RegExp, NivelCefr][] = [
  [/\b(upper[- ]intermediate|intermedio[- ]alto)\b/, 'B2'],
  [/\b(native|nativo|nativa)\b/, 'C2'],
  [/\b(bilingual|bilingue|fluent|fluido|fluida|advanced english|ingles avanzado|avanzado)\b/, 'C1'],
  [/\b(professional english|ingles profesional)\b/, 'B2'],
  [/\b(intermediate|intermedio|intermedia|conversational|conversacional)\b/, 'B1'],
  [/\b(basic english|ingles basico)\b/, 'A2']
];

/** Country names (and the pool's cities) in English and Spanish, to the value stored on the candidate. */
const PLACE_TO_COUNTRY: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const c of MOCK_CANDIDATES) {
    map.set(norm(c.pais), c.pais);
    if (c.ciudad) map.set(norm(c.ciudad), c.pais);
  }
  const aliases: Record<string, string> = {
    peru: 'Peru',
    mexico: 'Mexico',
    cdmx: 'Mexico',
    'republica dominicana': 'Dominican Republic',
    'el salvador': 'El Salvador',
    'costa rica': 'Costa Rica'
  };
  for (const [alias, country] of Object.entries(aliases)) if (map.has(norm(country))) map.set(alias, country);
  return map;
})();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Reads English level, minimum years, countries and work mode out of free text.
 * In production an LLM does this on the backend and returns the same shape; the
 * rep always sees what was read and can change it.
 */
export function parseRequirement(text: string): ParsedRequirement {
  const t = norm(text);
  const filtros: ParsedRequirement['filtros'] = {};
  const detectados: DetectedRequirement[] = [];

  const cefr = t.match(/\b([abc][12])\b\+?/);
  if (cefr) {
    const level = cefr[1].toUpperCase() as NivelCefr;
    filtros.inglesMinimo = level;
    detectados.push({ field: 'ingles', label: `English ${level} or higher`, source: cefr[0] });
  } else {
    for (const [re, level] of ENGLISH_WORDS) {
      const m = t.match(re);
      if (m) {
        filtros.inglesMinimo = level;
        detectados.push({ field: 'ingles', label: `English ${level} or higher`, source: m[0] });
        break;
      }
    }
  }

  const years = t.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?|anos?)\b/);
  if (years) {
    const n = Number(years[1]);
    if (n > 0 && n <= 30) {
      filtros.experienciaMinima = n;
      detectados.push({ field: 'experiencia', label: `${n}+ years`, source: years[0] });
    }
  }

  const found: { country: string; at: number; source: string }[] = [];
  for (const [place, country] of PLACE_TO_COUNTRY) {
    const m = new RegExp(`\\b${escapeRe(place)}\\b`).exec(t);
    if (m && !found.some(f => f.country === country)) found.push({ country, at: m.index, source: m[0] });
  }
  if (found.length > 0) {
    found.sort((a, b) => a.at - b.at);
    filtros.paises = found.map(f => f.country);
    detectados.push({ field: 'paises', label: filtros.paises.join(', '), source: found.map(f => f.source).join(', ') });
  }

  const modes: [RegExp, Modalidad][] = [
    [/\b(remote|remoto|remota|teletrabajo|work from home)\b/, 'Remote'],
    [/\b(hybrid|hibrido|hibrida)\b/, 'Hybrid'],
    [/\b(on-?site|presencial|in[- ]office)\b/, 'On-site']
  ];
  const mode = modes
    .map(([re, value]) => ({ value, m: re.exec(t) }))
    .filter(x => x.m)
    .sort((a, b) => a.m!.index - b.m!.index)[0];
  if (mode) {
    filtros.modalidad = mode.value;
    detectados.push({ field: 'modalidad', label: MODALITY_LABEL[mode.value], source: mode.m![0] });
  }

  return { filtros, detectados };
}

export const MODALITY_LABEL: Record<Modalidad, string> = { Remote: 'Remote', Hybrid: 'Hybrid', 'On-site': 'On-site' };
