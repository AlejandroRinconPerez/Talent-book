import book from './book.json';
import { EspecialidadBook, FamiliaOcupacional, PerfilOcupacional } from '../types';

/**
 * Occupational taxonomy. book.json still holds families → specialties → generic
 * profiles so the catalog can be maintained without touching code, but the app
 * works on two levels only: family → specialty. Each specialty absorbs its
 * profiles' content (roles covered, scope, skills).
 */
export const FAMILIAS_DATA: FamiliaOcupacional[] = book as FamiliaOcupacional[];

export const ALL_PROFILES: PerfilOcupacional[] = FAMILIAS_DATA.flatMap(f => f.especialidades.flatMap(s => s.perfiles));

const unique = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter(item => {
    const k = item.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const firstSentence = (text: string) => text.match(/^[^.]*\./)?.[0] ?? text;

export const specialtyKey = (familiaId: string, nombre: string) => `${familiaId}:${nombre}`;

export const ALL_SPECIALTIES: EspecialidadBook[] = FAMILIAS_DATA.flatMap(f =>
  f.especialidades.map(s => ({
    key: specialtyKey(f.id, s.nombre),
    nombre: s.nombre,
    familia: f.nombre,
    familiaId: f.id,
    descripcion: s.perfiles.length === 1 ? s.perfiles[0].descripcion : s.perfiles.map(p => firstSentence(p.descripcion)).join(' '),
    roles: s.perfiles.map(p => ({ nombre: p.nombre, descripcion: p.descripcion })),
    criteriosInclusion: unique(s.perfiles.flatMap(p => p.criteriosInclusion)),
    criteriosExclusion: unique(s.perfiles.flatMap(p => p.criteriosExclusion)),
    habilidades: unique(s.perfiles.flatMap(p => p.habilidades)),
    vacantesRespaldo: s.perfiles.reduce((acc, p) => acc + p.vacantesRespaldo.length, 0)
  }))
);
