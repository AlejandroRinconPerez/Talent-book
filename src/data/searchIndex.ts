import { ALL_SPECIALTIES } from './bookData';
import { MOCK_CANDIDATES } from './candidatesData';
import { BusquedaComercial } from '../types';

export type SearchHitType = 'search' | 'specialty' | 'candidate';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  title: string;
  subtitle: string;
  /** Lower-cased haystack used for matching. */
  text: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/* Static entries, built once. Searches are added per query because they change. */
const SPECIALTY_HITS: SearchHit[] = ALL_SPECIALTIES.map(s => ({
  type: 'specialty',
  id: s.key,
  title: s.nombre,
  subtitle: s.familia,
  text: norm([s.nombre, s.familia, ...s.roles.map(r => r.nombre), ...s.habilidades].join(' '))
}));

const CANDIDATE_HITS: SearchHit[] = MOCK_CANDIDATES.map(c => ({
  type: 'candidate',
  id: c.id,
  title: c.nombre,
  subtitle: `${c.id}, ${c.ciudad}, ${c.pais}`,
  text: norm([c.nombre, c.id, c.ciudad, c.pais, ...c.habilidades].join(' '))
}));

function searchHits(busquedas: BusquedaComercial[]): SearchHit[] {
  return busquedas.map(b => ({
    type: 'search',
    id: b.id,
    title: b.nombre,
    subtitle: [b.clienteEmpresa, b.id].filter(Boolean).join(', '),
    text: norm([b.nombre, b.id, b.clienteEmpresa ?? '', b.especialidadNombre ?? ''].join(' '))
  }));
}

function score(hit: SearchHit, terms: string[]): number {
  const title = norm(hit.title);
  let total = 0;
  for (const term of terms) {
    if (!hit.text.includes(term)) return -1;
    if (title.startsWith(term)) total += 3;
    else if (title.includes(term)) total += 2;
    else total += 1;
  }
  return total;
}

export interface SearchResults {
  searches: SearchHit[];
  specialties: SearchHit[];
  candidates: SearchHit[];
  total: number;
}

const PER_GROUP = 5;

/** Every term must match; results ranked by where the match lands, capped per group. */
export function queryIndex(query: string, busquedas: BusquedaComercial[]): SearchResults {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { searches: [], specialties: [], candidates: [], total: 0 };

  const rank = (hits: SearchHit[]) =>
    hits
      .map(h => ({ h, s: score(h, terms) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.h.title.localeCompare(b.h.title))
      .slice(0, PER_GROUP)
      .map(x => x.h);

  const searches = rank(searchHits(busquedas));
  const specialties = rank(SPECIALTY_HITS);
  const candidates = rank(CANDIDATE_HITS);
  return { searches, specialties, candidates, total: searches.length + specialties.length + candidates.length };
}
