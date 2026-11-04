import { FAMILIAS_DATA, ALL_PROFILES, ALL_SPECIALTIES, specialtyKey } from './bookData';
import { MOCK_CANDIDATES } from './candidatesData';
import { BusquedaComercial, Candidato, EspecialidadBook, FamiliaOcupacional, PerfilOcupacional } from '../types';

/* Index maps built once at module load so lookups inside render are O(1). */

export const CANDIDATE_BY_ID: ReadonlyMap<string, Candidato> = new Map(MOCK_CANDIDATES.map(c => [c.id, c]));

export const PROFILE_BY_ID: ReadonlyMap<string, PerfilOcupacional> = new Map(ALL_PROFILES.map(p => [p.id, p]));

export const FAMILY_BY_ID: ReadonlyMap<string, FamiliaOcupacional> = new Map(FAMILIAS_DATA.map(f => [f.id, f]));

export const FAMILY_BY_NAME: ReadonlyMap<string, FamiliaOcupacional> = new Map(FAMILIAS_DATA.map(f => [f.nombre, f]));

export const SPECIALTY_BY_KEY: ReadonlyMap<string, EspecialidadBook> = new Map(ALL_SPECIALTIES.map(s => [s.key, s]));

/** Specialty key of every generic profile, so candidate data tagged by profile resolves to a specialty. */
const SPECIALTY_KEY_BY_PROFILE: ReadonlyMap<string, string> = new Map(
  FAMILIAS_DATA.flatMap(f => f.especialidades.flatMap(s => s.perfiles.map(p => [p.id, specialtyKey(f.id, s.nombre)] as const)))
);

/** The Book specialties a candidate belongs to, without repeats. */
export const SPECIALTY_KEYS_BY_CANDIDATE: ReadonlyMap<string, readonly string[]> = new Map(
  MOCK_CANDIDATES.map(c => [c.id, Array.from(new Set(c.perfilesAsociados.flatMap(id => SPECIALTY_KEY_BY_PROFILE.get(id) ?? [])))])
);

export const candidateSpecialties = (c: Candidato): EspecialidadBook[] =>
  (SPECIALTY_KEYS_BY_CANDIDATE.get(c.id) ?? []).flatMap(key => SPECIALTY_BY_KEY.get(key) ?? []);

export const candidateSpecialtyNames = (c: Candidato): string[] => candidateSpecialties(c).map(s => s.nombre);

/** Candidate ids per specialty key. */
const CANDIDATE_IDS_BY_SPECIALTY: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const [candidateId, keys] of SPECIALTY_KEYS_BY_CANDIDATE) {
    for (const key of keys) {
      const list = map.get(key);
      if (list) list.push(candidateId);
      else map.set(key, [candidateId]);
    }
  }
  return map;
})();

export const CANDIDATE_COUNT_BY_SPECIALTY: ReadonlyMap<string, number> = new Map(
  ALL_SPECIALTIES.map(s => [s.key, CANDIDATE_IDS_BY_SPECIALTY.get(s.key)?.length ?? 0])
);

/** Distinct candidates per family id. */
export const CANDIDATE_COUNT_BY_FAMILY: ReadonlyMap<string, number> = new Map(
  FAMILIAS_DATA.map(f => {
    const seen = new Set<string>();
    for (const s of f.especialidades) for (const id of CANDIDATE_IDS_BY_SPECIALTY.get(specialtyKey(f.id, s.nombre)) ?? []) seen.add(id);
    return [f.id, seen.size];
  })
);

/** The specialty a search starts from; older searches that point at a profile resolve through it. */
export function busquedaSpecialty(b: BusquedaComercial): EspecialidadBook | undefined {
  if (b.especialidadKey) return SPECIALTY_BY_KEY.get(b.especialidadKey);
  const key = b.perfilBookId ? SPECIALTY_KEY_BY_PROFILE.get(b.perfilBookId) : undefined;
  return key ? SPECIALTY_BY_KEY.get(key) : undefined;
}
