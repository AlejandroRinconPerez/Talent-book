import React from 'react';
import { Eye } from 'lucide-react';
import { Candidato } from '../../types';
import { profileName } from '../../data/indexes';
import { Button } from '../ui/Button';
import { CandidateId, EnglishChip, modalityLabel } from './badges';

interface CandidateCardProps {
  candidate: Candidato;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  /** Opens the candidate file. Same entry point in every zone, so the PDF export travels with it. */
  onOpenProfile: (candidate: Candidato) => void;
  /**
   * Namespaces the checkbox id so the same candidate can appear in two zones of
   * the app without colliding (e.g. "pool", "linked").
   */
  idPrefix: string;
  /** Top-right of the header: the stage chip inside a search, nothing in the pool. */
  badge?: React.ReactNode;
  /** Between the profile chips and the action bar (e.g. the CEIPAL status line). */
  children?: React.ReactNode;
  /** Left of the action bar (e.g. the stage select inside a search). */
  stageControl?: React.ReactNode;
  /** Zone-specific buttons, placed after "View profile". */
  actions?: React.ReactNode;
  /** Summary lines before truncation. Searches show fewer because the card carries more below. */
  summaryLines?: 2 | 3;
}

/**
 * One candidate as a selectable card. Shared by the candidate pool and the
 * linked list inside a search so both read and behave the same; what differs
 * per zone comes in as slots.
 */
export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  selected,
  onToggleSelect,
  onOpenProfile,
  idPrefix,
  badge,
  children,
  stageControl,
  actions,
  summaryLines = 3
}) => {
  const checkboxId = `${idPrefix}-${candidate.id}`;

  return (
    <li className="select-card flex flex-col">
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(candidate.id)}
          className="mt-1 size-4 shrink-0 rounded-sm border-rule-strong"
        />
        <label htmlFor={checkboxId} className="stretch min-w-0 flex-1 cursor-pointer">
          <span className="block truncate text-[15px] font-semibold text-ink">{candidate.nombre}</span>
          <span className="block text-[13px] text-ink-2">
            <CandidateId id={candidate.id} className="mr-2" />
            {candidate.ciudad}, {candidate.pais}
          </span>
        </label>
        {badge}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip chip-neutral tabular-nums">{candidate.experienciaTexto}</span>
        <EnglishChip level={candidate.nivelIngles} withLabel />
        <span className="chip chip-neutral">{modalityLabel(candidate.modalidad)}</span>
      </div>

      <p className={`mt-3 ${summaryLines === 2 ? 'line-clamp-2' : 'line-clamp-3'} text-[13px] leading-relaxed text-ink-2`}>
        {candidate.resumenProfesional}
      </p>

      <ul className="mt-2.5 flex flex-wrap gap-1">
        {candidate.perfilesAsociados.map(pId => (
          <li key={pId} className="chip chip-brand max-w-full">
            <span className="truncate">{profileName(pId)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3">
        {children ? <div className="mb-3">{children}</div> : null}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
          <div className="above flex items-center gap-2">{stageControl}</div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" icon={<Eye className="size-4" />} className="above" onClick={() => onOpenProfile(candidate)}>
              View profile
            </Button>
            {actions}
          </div>
        </div>
      </div>
    </li>
  );
};
