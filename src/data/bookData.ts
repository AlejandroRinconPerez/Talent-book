import book from './book.json';
import { FamiliaOcupacional, PerfilOcupacional } from '../types';

/**
 * Occupational taxonomy: 12 job families → specialties → generic profiles.
 * The source of truth is book.json so the catalog can be maintained without
 * touching code; this module only types it and derives the flat profile list.
 */
export const FAMILIAS_DATA: FamiliaOcupacional[] = book as FamiliaOcupacional[];

export const ALL_PROFILES: PerfilOcupacional[] = FAMILIAS_DATA.flatMap(f => f.especialidades.flatMap(s => s.perfiles));
