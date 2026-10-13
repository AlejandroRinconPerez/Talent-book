import { BusquedaComercial, Candidato } from '../types';
import { CANDIDATE_BY_ID, PROFILE_BY_ID, profileName } from '../data/indexes';
import { modalityLabel } from '../components/shared/badges';
import { ESTADO_LABEL, ETAPA_LABEL } from './activity';
import { todayIso } from './format';
import { CellValue, SheetColumn, downloadWorkbook } from './xlsx';

const CANDIDATE_COLUMNS: SheetColumn[] = [
  { header: 'ID', width: 11 },
  { header: 'Name', width: 24 },
  { header: 'Book profiles', width: 40 },
  { header: 'Job family', width: 24 },
  { header: 'Experience (years)', width: 12 },
  { header: 'English', width: 10 },
  { header: 'Country', width: 16 },
  { header: 'City', width: 16 },
  { header: 'Work mode', width: 11 },
  { header: 'Availability', width: 12 },
  { header: 'Education', width: 28 },
  { header: 'Skills', width: 48 },
  { header: 'Certifications', width: 36 },
  { header: 'Source', width: 16 },
  { header: 'Profile updated', width: 14 }
];

function candidateRow(c: Candidato): CellValue[] {
  const families = Array.from(new Set(c.perfilesAsociados.map(id => PROFILE_BY_ID.get(id)?.familia).filter(Boolean))).join(', ');
  return [
    c.id,
    c.nombre,
    c.perfilesAsociados.map(profileName).join('; '),
    families,
    c.experienciaAnos,
    c.nivelIngles === 'Sin información' || c.nivelIngles === 'Not specified' ? 'Not assessed' : c.nivelIngles,
    c.pais,
    c.ciudad,
    modalityLabel(c.modalidad),
    c.disponibilidad,
    c.educacion,
    c.habilidades.join('; '),
    c.certificaciones.join('; '),
    c.fuente ?? '',
    c.ultimaActualizacion ?? ''
  ];
}

/** The filtered candidate list as it is on screen, every page. Internal rate is deliberately left out. */
export function exportCandidatesWorkbook(candidates: Candidato[], label = 'candidates'): void {
  downloadWorkbook(`talent-book-${label}-${todayIso()}.xlsx`, 'Candidates', CANDIDATE_COLUMNS, candidates.map(candidateRow));
}

/** A search's shortlist with its pipeline state, one row per linked candidate (optionally only the given ids). */
export function exportSearchWorkbook(busqueda: BusquedaComercial, onlyIds?: ReadonlySet<string>): void {
  const columns: SheetColumn[] = [
    { header: 'Search', width: 32 },
    { header: 'Client', width: 24 },
    { header: 'Search status', width: 12 },
    { header: 'Stage', width: 13 },
    { header: 'Linked on', width: 12 },
    { header: 'CEIPAL', width: 14 },
    { header: 'Service order', width: 13 },
    ...CANDIDATE_COLUMNS
  ];
  const rows = busqueda.candidatosVinculados.flatMap(cv => {
    if (onlyIds && !onlyIds.has(cv.candidatoId)) return [];
    const c = CANDIDATE_BY_ID.get(cv.candidatoId);
    if (!c) return [];
    const ceipal = cv.estadoCeipal === 'cargado' ? 'Exported' : cv.estadoCeipal === 'error' ? 'Export failed' : 'Not exported';
    return [[busqueda.nombre, busqueda.clienteEmpresa ?? '', ESTADO_LABEL[busqueda.estado], ETAPA_LABEL[cv.etapa ?? 'shortlist'], cv.fechaVinculacion, ceipal, cv.serviceOrderId ?? '', ...candidateRow(c)]];
  });
  downloadWorkbook(`talent-book-${busqueda.id}-${todayIso()}.xlsx`, busqueda.id, columns, rows);
}
