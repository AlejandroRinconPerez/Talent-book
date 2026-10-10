import { ActividadBusqueda, BusquedaComercial, EstadoBusqueda, EtapaCandidato, TipoActividad } from '../types';

/** Appends an activity entry (newest first) and stamps the search as updated now. */
export function withActivity(busqueda: BusquedaComercial, tipo: TipoActividad, detalle: string): BusquedaComercial {
  const now = new Date().toISOString();
  const entry: ActividadBusqueda = { fecha: now, tipo, detalle };
  return { ...busqueda, actualizadoEn: now, actividad: [entry, ...busqueda.actividad] };
}

export const ESTADO_LABEL: Record<EstadoBusqueda, string> = {
  abierta: 'Open',
  en_proceso: 'In progress',
  cerrada: 'Closed'
};

export const ESTADO_ORDER: EstadoBusqueda[] = ['abierta', 'en_proceso', 'cerrada'];

export const ETAPA_LABEL: Record<EtapaCandidato, string> = {
  shortlist: 'Shortlisted',
  presentado: 'Presented',
  entrevista: 'Interviewing',
  oferta: 'Offer',
  descartado: 'Declined'
};

export const ETAPA_ORDER: EtapaCandidato[] = ['shortlist', 'presentado', 'entrevista', 'oferta', 'descartado'];

export const ACTIVIDAD_LABEL: Record<TipoActividad, string> = {
  creada: 'Search created',
  candidatos_vinculados: 'Candidates linked',
  candidato_retirado: 'Candidate removed',
  criterios_actualizados: 'Criteria updated',
  exportado_ceipal: 'Exported to CEIPAL',
  presentada: 'Presented to client',
  etapa_cambiada: 'Stage changed',
  estado_cambiado: 'Status changed'
};

/** "2 hours ago", "3 days ago", or the date for anything older than a month. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (minutes < 1) return 'just now';
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (days < 31) return rtf.format(-days, 'day');
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(then);
}
