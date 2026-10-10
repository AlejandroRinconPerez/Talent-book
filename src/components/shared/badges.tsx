import React from 'react';
import { Candidato, EstadoBusqueda, EtapaCandidato, EvaluacionCandidato, NivelIngles } from '../../types';
import { ESTADO_LABEL, ETAPA_LABEL } from '../../utils/activity';

/** Search status. Open reads as brand, in progress as warm, closed as neutral. */
export const StatusChip: React.FC<{ estado: EstadoBusqueda }> = ({ estado }) => {
  const tone = estado === 'abierta' ? 'chip-brand' : estado === 'en_proceso' ? 'chip-warn' : 'chip-neutral';
  return <span className={`chip ${tone}`}>{ESTADO_LABEL[estado]}</span>;
};

/** Candidate stage inside a search. */
export const StageChip: React.FC<{ etapa: EtapaCandidato | undefined }> = ({ etapa = 'shortlist' }) => {
  const tone =
    etapa === 'oferta' ? 'chip-ok' : etapa === 'entrevista' ? 'chip-brand' : etapa === 'presentado' ? 'chip-warn' : etapa === 'descartado' ? 'chip-danger' : 'chip-neutral';
  return <span className={`chip ${tone}`}>{ETAPA_LABEL[etapa]}</span>;
};

/** English level chip. Strong levels read as positive, missing data as neutral. */
export const EnglishChip: React.FC<{ level: NivelIngles; withLabel?: boolean }> = ({ level, withLabel }) => {
  const isStrong = level === 'C1' || level === 'C2';
  const isUnknown = level === 'Sin información' || level === 'Not specified';
  const tone = isStrong ? 'chip-ok' : level === 'B2' ? 'chip-brand' : 'chip-neutral';
  const text = isUnknown ? 'English not assessed' : withLabel ? `English ${level}` : level;
  return <span className={`chip ${tone}`}>{text}</span>;
};

export type FitLevel = 'High' | 'Medium' | 'Partial with gaps';

export function normalizeFit(level: EvaluacionCandidato['nivelAjusteGeneral']): FitLevel {
  if (level === 'Alto' || level === 'High') return 'High';
  if (level === 'Medio' || level === 'Medium') return 'Medium';
  return 'Partial with gaps';
}

export const FitBadge: React.FC<{ level: EvaluacionCandidato['nivelAjusteGeneral']; prefix?: string }> = ({
  level,
  prefix = 'Fit'
}) => {
  const fit = normalizeFit(level);
  const tone = fit === 'High' ? 'chip-ok' : fit === 'Medium' ? 'chip-warn' : 'chip-accent';
  return (
    <span className={`chip ${tone} text-[13px] px-2`}>
      {prefix}: {fit}
    </span>
  );
};

/** Candidate ID, set in tabular figures so lists align. */
export const CandidateId: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => (
  <span className={`code text-[13px] text-ink-3 ${className}`} translate="no">
    {id}
  </span>
);

/** Normalizes the Spanish/English modality values present in mock data. */
export function modalityLabel(modalidad: Candidato['modalidad'] | string): string {
  const v = modalidad.toLowerCase();
  if (v.startsWith('remot')) return 'Remote';
  if (v.startsWith('h')) return 'Hybrid';
  if (v.startsWith('presen') || v.startsWith('on')) return 'On-site';
  return modalidad;
}

export function englishRequirementLabel(level: NivelIngles | string): string {
  if (level === 'Sin información' || level === 'Not specified') return 'Not required';
  return `${level} or higher`;
}
