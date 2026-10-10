import { FAMILIAS_DATA, ALL_PROFILES } from './bookData';
import { MOCK_CANDIDATES } from './candidatesData';
import { Candidato, FamiliaOcupacional, PerfilOcupacional } from '../types';

/* Index maps built once at module load so lookups inside render are O(1). */

export const CANDIDATE_BY_ID: ReadonlyMap<string, Candidato> = new Map(MOCK_CANDIDATES.map(c => [c.id, c]));

export const PROFILE_BY_ID: ReadonlyMap<string, PerfilOcupacional> = new Map(ALL_PROFILES.map(p => [p.id, p]));

export const FAMILY_BY_ID: ReadonlyMap<string, FamiliaOcupacional> = new Map(FAMILIAS_DATA.map(f => [f.id, f]));

export const FAMILY_BY_NAME: ReadonlyMap<string, FamiliaOcupacional> = new Map(FAMILIAS_DATA.map(f => [f.nombre, f]));

/** Candidate ids that carry each profile. */
export const CANDIDATE_IDS_BY_PROFILE: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const c of MOCK_CANDIDATES) {
    for (const profileId of c.perfilesAsociados) {
      const list = map.get(profileId);
      if (list) list.push(c.id);
      else map.set(profileId, [c.id]);
    }
  }
  return map;
})();

/** Number of distinct candidates across a set of profile ids. */
export function countCandidatesForProfiles(profileIds: readonly string[]): number {
  if (profileIds.length === 1) return CANDIDATE_IDS_BY_PROFILE.get(profileIds[0])?.length ?? 0;
  const seen = new Set<string>();
  for (const id of profileIds) {
    const list = CANDIDATE_IDS_BY_PROFILE.get(id);
    if (list) for (const cid of list) seen.add(cid);
  }
  return seen.size;
}

/** Distinct candidates per family id, and per `familyId:specialtyName`. */
export const CANDIDATE_COUNT_BY_FAMILY: ReadonlyMap<string, number> = new Map(
  FAMILIAS_DATA.map(f => [f.id, countCandidatesForProfiles(f.especialidades.flatMap(s => s.perfiles.map(p => p.id)))])
);

export const CANDIDATE_COUNT_BY_SPECIALTY: ReadonlyMap<string, number> = new Map(
  FAMILIAS_DATA.flatMap(f => f.especialidades.map(s => [`${f.id}:${s.nombre}`, countCandidatesForProfiles(s.perfiles.map(p => p.id))] as const))
);

export const profileName = (id: string): string => PROFILE_BY_ID.get(id)?.nombre ?? id;
