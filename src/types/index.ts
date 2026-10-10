export interface PerfilOcupacional {
  id: string; // e.g. "perfil-d079285b516c"
  nombre: string;
  familia: string;
  especialidad: string;
  descripcion: string;
  criteriosInclusion: string[];
  criteriosExclusion: string[];
  habilidades: string[];
  vacantesRespaldo: string[]; // Referencias internas comerciales
}

export interface Especialidad {
  nombre: string;
  perfiles: PerfilOcupacional[];
}

export interface FamiliaOcupacional {
  id: string;
  nombre: string;
  descripcionBreve: string;
  especialidades: Especialidad[];
}

export type NivelIngles = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Not specified' | 'Sin información';

export interface ExperienciaLaboral {
  cargo: string;
  sectorEmpresa: string; // Anonymized, e.g. "Global Fintech", "Regional Retail"
  duracion: string;
  logros: string[];
}

export interface Candidato {
  id: string; // e.g. "CAN-8821"
  nombre: string; // Simulated full name (e.g. "Sofia Ramirez")
  perfilesAsociados: string[]; // IDs of PerfilOcupacional
  experienciaAnos: number;
  experienciaTexto: string;
  nivelIngles: NivelIngles;
  pais: string;
  ciudad: string;
  modalidad: 'Remote' | 'Hybrid' | 'On-site' | 'Remoto' | 'Híbrido' | 'Presencial';
  habilidades: string[];
  resumenProfesional: string;
  trayectoria: ExperienciaLaboral[];
  competenciasClave: string[];
  educacion: string;
  certificaciones: string[];
  disponibilidad: string;
  rangoSalarialInterno?: string; // Internal commercial range
}

export interface VacancyRequisitos {
  experienciaMinimaAnos: number;
  nivelInglesMinimo: NivelIngles;
  ubicacionRequerida: string;
  modalidad: string;
  habilidadesIndispensables: string[];
  habilidadesDeseables: string[];
}

export interface Vacancy {
  titulo: string;
  descripcion: string;
  cliente?: string;
  requisitos: VacancyRequisitos;
}

export type EstadoCumplimiento = 'cumple' | 'no_cumple' | 'sin_informacion' | 'meets' | 'gap' | 'pending';

export interface ItemEvaluacion {
  criterio: string;
  estado: EstadoCumplimiento;
  detalle: string;
}

export interface EvaluacionCandidato {
  candidatoId: string;
  requisitosCumplidos: ItemEvaluacion[];
  brechasEncontradas: ItemEvaluacion[];
  informacionPorValidar: ItemEvaluacion[];
  sintesisAjuste: string;
  nivelAjusteGeneral: 'High' | 'Medium' | 'Partial with gaps' | 'Alto' | 'Medio' | 'Parcial con brechas';
}

/* ========================================================================= */
/* COMMERCIAL SEARCHES AND CEIPAL PIPELINE SYNC ENTITIES                     */
/* ========================================================================= */

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  departamento: string;
}

export type EstadoCargaCeipal = 'no_cargado' | 'cargado' | 'error';

export interface CandidatoVinculadoBusqueda {
  candidatoId: string;
  fechaVinculacion: string; // e.g. "2026-10-06"
  estadoCeipal: EstadoCargaCeipal;
  serviceOrderId?: string;
  fechaCargaCeipal?: string;
  errorCeipal?: string;
}

export interface BusquedaComercial {
  id: string; // e.g. "BUSQ-101"
  usuarioId: string;
  nombre: string;
  clienteEmpresa?: string;
  descripcion: string;
  perfilBookId?: string;
  perfilNombre?: string;
  fechaCreacion: string;
  requisitos: VacancyRequisitos;
  candidatosVinculados: CandidatoVinculadoBusqueda[];
}

export interface ServiceOrderSimulada {
  id: string; // e.g. "SO-99214"
  cliente: string;
  posicion: string;
  estado: 'Open' | 'In progress' | 'Closed' | 'Abierta' | 'En proceso' | 'Cerrada';
  fechaRequerimiento: string;
  vacantesDisponibles: number;
}
