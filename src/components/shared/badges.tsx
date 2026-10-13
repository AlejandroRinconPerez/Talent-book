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

export const FitBadge: React.FC<{
  level: EvaluacionCandidato['nivelAjusteGeneral'];
  prefix?: string;
  /** 0-100 fit score, shown next to the label so the judgement carries a number. */
  score?: number;
}> = ({ level, prefix = 'Fit', score }) => {
  const fit = normalizeFit(level);
  const tone = fit === 'High' ? 'chip-ok' : fit === 'Medium' ? 'chip-warn' : 'chip-accent';
  return (
    <span className={`chip ${tone} text-[13px] px-2`}>
      {prefix}: {fit}
      {score !== undefined ? (
        <>
          <span aria-hidden="true" className="mx-1.5 opacity-40">
            |
          </span>
          <span className="font-semibold tabular-nums">{score}</span>
          <span className="opacity-70">/100</span>
        </>
      ) : null}
    </span>
  );
};

/** Per-dimension meter: one hue, fill over a lighter step of the same ramp. */
export const ScoreBreakdown: React.FC<{ dimensions: EvaluacionCandidato['desglosePuntaje'] }> = ({ dimensions }) => (
  <dl className="space-y-2">
    {dimensions.map(d => {
      const pct = d.peso === 0 ? 0 : Math.round((d.obtenido / d.peso) * 100);
      return (
        <div key={d.criterio} className="grid grid-cols-[9.5rem_1fr_3.5rem] items-center gap-x-3 gap-y-1">
          <dt className="truncate text-[13px] text-ink-2" title={d.detalle}>
            {d.criterio}
          </dt>
          <dd
            className="h-1.5 overflow-hidden rounded-full bg-brand-wash-2"
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${d.criterio}: ${d.detalle}`}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </dd>
          <dd className="text-right text-[13px] tabular-nums text-ink-3">
            {Math.round(d.obtenido)}/{d.peso}
          </dd>
        </div>
      );
    })}
  </dl>
);

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
