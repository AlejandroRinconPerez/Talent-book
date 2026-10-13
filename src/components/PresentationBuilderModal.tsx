import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Presentation } from 'lucide-react';
import { Candidato, EtapaCandidato } from '../types';
import { profileName } from '../data/indexes';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { CandidateId, StageChip } from './shared/badges';
import { plural } from '../utils/format';

export interface PresentationPlan {
  candidates: Candidato[];
  coverNote: string;
  includeFit: boolean;
}

interface PresentationBuilderModalProps {
  /** Every candidate that could be presented, in the order they currently sit. */
  candidates: Candidato[];
  /** Pre-ticked ids; defaults to all. */
  initialSelectedIds?: string[];
  initialCoverNote?: string;
  initialIncludeFit?: boolean;
  /** Stage per candidate when building from a search, shown as a chip. */
  stages?: ReadonlyMap<string, EtapaCandidato | undefined>;
  clientName?: string;
  onClose: () => void;
  onConfirm: (plan: PresentationPlan) => void;
}

/**
 * Chooses who goes into the client presentation and in which order, with an
 * optional cover note. Reordering uses buttons so it works with a keyboard.
 */
export const PresentationBuilderModal: React.FC<PresentationBuilderModalProps> = ({
  candidates,
  initialSelectedIds,
  initialCoverNote = '',
  initialIncludeFit = true,
  stages,
  clientName,
  onClose,
  onConfirm
}) => {
  const [order, setOrder] = useState<Candidato[]>(candidates);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelectedIds ?? candidates.map(c => c.id)));
  const [coverNote, setCoverNote] = useState(initialCoverNote);
  const [includeFit, setIncludeFit] = useState(initialIncludeFit);

  const move = (index: number, delta: -1 | 1) => {
    setOrder(prev => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = order.filter(c => selected.has(c.id));
  const allChecked = selected.size === order.length;

  return (
    <Modal
      size="lg"
      title="Prepare the presentation"
      description={`Choose who to show${clientName ? ` ${clientName}` : ''} and in what order. The dossier opens in a clean view ready for screen sharing or PDF.`}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[13px] text-ink-2" aria-live="polite">
            {chosen.length === 0 ? 'No candidates selected' : `${plural(chosen.length, 'candidate')} in this order`}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="commercial" icon={<Presentation className="size-4" />} disabled={chosen.length === 0} onClick={() => onConfirm({ candidates: chosen, coverNote: coverNote.trim(), includeFit })}>
            Open presentation {chosen.length > 0 ? `(${chosen.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="order-heading">
          <div className="mb-2 flex items-center justify-between">
            <h3 id="order-heading" className="text-base font-semibold">
              Candidates
            </h3>
            <button
              type="button"
              onClick={() => setSelected(allChecked ? new Set() : new Set(order.map(c => c.id)))}
              className="text-[13px] font-medium text-brand-ink hover:underline"
            >
              {allChecked ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <ol className="divide-y divide-rule rounded-lg border border-rule">
            {order.map((c, index) => {
              const checkboxId = `present-${c.id}`;
              const position = chosen.findIndex(x => x.id === c.id);
              return (
                <li key={c.id} className={`flex items-center gap-3 px-3 py-2.5 ${selected.has(c.id) ? '' : 'opacity-60'}`}>
                  <span className="w-5 text-right text-[13px] tabular-nums text-ink-3" aria-hidden="true">
                    {position >= 0 ? position + 1 : '–'}
                  </span>
                  <input id={checkboxId} type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="size-4 shrink-0" />
                  <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate font-medium text-ink">{c.nombre}</span>
                    <span className="block truncate text-[13px] text-ink-3">
                      <CandidateId id={c.id} className="mr-2" />
                      {c.perfilesAsociados.map(profileName).join(', ')}
                    </span>
                  </label>
                  {stages ? <StageChip etapa={stages.get(c.id)} /> : null}
                  <div className="flex shrink-0 items-center">
                    <Button variant="icon" aria-label={`Move ${c.nombre} up`} onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button variant="icon" aria-label={`Move ${c.nombre} down`} onClick={() => move(index, 1)} disabled={index === order.length - 1}>
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <Field id="cover-note" label="Cover note" optional hint="Shown under the requirement on the first page. Keep it to what the client needs to know.">
          <textarea
            rows={3}
            value={coverNote}
            onChange={e => setCoverNote(e.target.value)}
            placeholder="Three profiles pre-screened this week; two can start within 15 days…"
            className="input textarea"
          />
        </Field>

        <label className="flex items-start gap-3">
          <input type="checkbox" checked={includeFit} onChange={e => setIncludeFit(e.target.checked)} className="mt-1 size-4" />
          <span>
            <span className="block font-medium text-ink">Include the fit assessment</span>
            <span className="block text-[13px] text-ink-2">Strengths and discussion points per candidate. Turn off for a plain profile dossier.</span>
          </span>
        </label>
      </div>
    </Modal>
  );
};
