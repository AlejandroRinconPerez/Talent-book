import React, { useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { BusquedaComercial } from '../types';
import { FAMILIAS_DATA } from '../data/bookData';
import { candidateSpecialtyNames } from '../data/indexes';
import { FILTER_LABEL, SearchFilters, isCefr, normalizeModality, parseRequirement, searchCandidates } from '../services/candidateSearch';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { CandidateId, EnglishChip, RelevanceChip, SearchHitNotes, modalityLabel } from './shared/badges';
import { IncludeToValidateToggle, RequirementSearchBox } from './shared/searchControls';
import { plural } from '../utils/format';

interface AddCandidatesToBusquedaModalProps {
  busqueda: BusquedaComercial;
  onClose: () => void;
  onLinkCandidates: (candidateIds: string[]) => void;
}

/** The text the vector search starts from: everything the search says about the role. */
function searchText(b: BusquedaComercial): string {
  const skills = [...b.requisitos.habilidadesIndispensables, ...b.requisitos.habilidadesDeseables];
  return [b.nombre, b.descripcion, skills.length > 0 ? `Skills: ${skills.join(', ')}` : ''].filter(Boolean).join('. ');
}

/** The search's criteria as filters. Location is free text, so countries are read out of it. */
function criteriaFilters(b: BusquedaComercial): SearchFilters {
  const r = b.requisitos;
  return {
    inglesMinimo: isCefr(r.nivelInglesMinimo) ? r.nivelInglesMinimo : undefined,
    experienciaMinima: r.experienciaMinimaAnos > 0 ? r.experienciaMinimaAnos : undefined,
    modalidad: normalizeModality(r.modalidad),
    paises: parseRequirement(r.ubicacionRequerida).filtros.paises
  };
}

/**
 * Opens already searching: the search's own text runs against every CV and its
 * criteria apply as filters. The rep can rewrite the text, drop the criteria or
 * narrow by family.
 */
export const AddCandidatesToBusquedaModal: React.FC<AddCandidatesToBusquedaModalProps> = ({ busqueda, onClose, onLinkCandidates }) => {
  const initialText = useMemo(() => searchText(busqueda), [busqueda]);
  const [queryDraft, setQueryDraft] = useState(initialText);
  const [query, setQuery] = useState(initialText);
  const [applyCriteria, setApplyCriteria] = useState(true);
  const [includeToValidate, setIncludeToValidate] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedCandidatesToLink, setSelectedCandidatesToLink] = useState<string[]>([]);

  const alreadyLinkedIds = useMemo(() => new Set(busqueda.candidatosVinculados.map(c => c.candidatoId)), [busqueda.candidatosVinculados]);

  const criteria = useMemo(() => criteriaFilters(busqueda), [busqueda]);
  const criteriaSummary = [
    criteria.inglesMinimo ? `English ${criteria.inglesMinimo} or higher` : null,
    criteria.experienciaMinima ? `${criteria.experienciaMinima}+ years` : null,
    criteria.modalidad ? modalityLabel(criteria.modalidad) : null,
    criteria.paises?.length ? criteria.paises.join(', ') : null
  ].filter(Boolean);

  const results = useMemo(
    () =>
      searchCandidates({
        texto: query,
        filtros: { ...(applyCriteria ? criteria : {}), familia: selectedFamily || undefined },
        incluirPorValidar: includeToValidate
      }),
    [query, applyCriteria, criteria, selectedFamily, includeToValidate]
  );

  const selectedSet = useMemo(() => new Set(selectedCandidatesToLink), [selectedCandidatesToLink]);

  const handleToggle = (id: string) => {
    if (alreadyLinkedIds.has(id)) return;
    setSelectedCandidatesToLink(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const unlinkedVisibleIds = results.hits.filter(h => !alreadyLinkedIds.has(h.candidato.id)).map(h => h.candidato.id);
  const allVisibleSelected = unlinkedVisibleIds.length > 0 && unlinkedVisibleIds.every(id => selectedSet.has(id));

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visible = new Set(unlinkedVisibleIds);
      setSelectedCandidatesToLink(prev => prev.filter(id => !visible.has(id)));
    } else {
      setSelectedCandidatesToLink(prev => Array.from(new Set([...prev, ...unlinkedVisibleIds])));
    }
  };

  const handleConfirm = () => {
    if (selectedCandidatesToLink.length === 0) return;
    onLinkCandidates(selectedCandidatesToLink);
    onClose();
  };

  const count = selectedCandidatesToLink.length;

  return (
    <Modal
      size="lg"
      context={
        <>
          Linking to: <span className="font-medium text-ink-2">{busqueda.nombre}</span>
        </>
      }
      title="Add candidates"
      onClose={onClose}
      bodyClassName="flex flex-col gap-4"
      footer={
        <>
          <span className="mr-auto text-[13px] text-ink-2" aria-live="polite">
            {count === 0 ? 'No candidates selected' : `${plural(count, 'candidate')} selected`}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={handleConfirm} disabled={count === 0}>
            {count === 0 ? 'Link candidates' : `Link ${plural(count, 'candidate')}`}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <p className="text-[13px] text-ink-3">Searching with this search's description. Edit the text and press Enter to search again.</p>
        <RequirementSearchBox
          id="add-search"
          value={queryDraft}
          onChange={setQueryDraft}
          onSubmit={() => setQuery(queryDraft.trim())}
          onClear={() => {
            setQueryDraft('');
            setQuery('');
          }}
          detected={[]}
          onRemoveDetected={() => {}}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-md bg-well/60 p-3 sm:grid-cols-[1fr_15rem] sm:items-start">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <input
              id="add-apply-criteria"
              type="checkbox"
              checked={applyCriteria}
              onChange={e => setApplyCriteria(e.target.checked)}
              className="mt-0.5 size-4 shrink-0"
              disabled={criteriaSummary.length === 0}
            />
            <label htmlFor="add-apply-criteria" className="text-sm">
              <span className="font-medium text-ink">Apply this search's criteria</span>
              <span className="block text-[13px] text-ink-3">{criteriaSummary.length > 0 ? criteriaSummary.join(' · ') : 'The search has no criteria set.'}</span>
            </label>
          </div>
          <IncludeToValidateToggle id="add-to-validate" checked={includeToValidate} onChange={setIncludeToValidate} />
        </div>
        <div>
          <label htmlFor="add-family" className="sr-only">
            Job family
          </label>
          <select id="add-family" value={selectedFamily} onChange={e => setSelectedFamily(e.target.value)} className="input select">
            <option value="">All job families</option>
            {FAMILIAS_DATA.map(f => (
              <option key={f.id} value={f.nombre}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-rule pb-2 text-[13px]">
        <p className="text-ink-2" aria-live="polite">
          {plural(results.hits.length, 'candidate')} {results.semantica ? 'ranked by similarity' : 'shown'}
          {results.porValidar > 0 ? <span className="text-ink-3">, {results.porValidar} to validate</span> : null}
        </p>
        {unlinkedVisibleIds.length > 0 && (
          <button type="button" onClick={handleSelectAllVisible} className="font-medium text-brand-ink hover:underline">
            {allVisibleSelected ? 'Deselect visible' : 'Select all visible'}
          </button>
        )}
      </div>

      {results.hits.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No candidates match"
          description="Describe the role with other words, turn off the search's criteria or include candidates with missing data."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.hits.map(({ candidato: candidate, relevancia, coincidencias, porValidar }) => {
            const isAlreadyLinked = alreadyLinkedIds.has(candidate.id);
            const isSelected = selectedSet.has(candidate.id);
            const checkboxId = `add-${candidate.id}`;

            return (
              <li key={candidate.id} className="select-card">
                <div className="flex items-start gap-3">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isSelected || isAlreadyLinked}
                    disabled={isAlreadyLinked}
                    onChange={() => handleToggle(candidate.id)}
                    className="mt-1 size-4 shrink-0"
                  />
                  <label htmlFor={checkboxId} className={`stretch min-w-0 flex-1 ${isAlreadyLinked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-ink">{candidate.nombre}</span>
                      {isAlreadyLinked ? (
                        <span className="chip chip-neutral shrink-0">Already linked</span>
                      ) : relevancia !== null ? (
                        <RelevanceChip value={relevancia} />
                      ) : null}
                    </span>
                    <span className="block text-[13px] text-ink-2">
                      <CandidateId id={candidate.id} className="mr-2" />
                      {candidate.ciudad}, {candidate.pais}
                    </span>
                  </label>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="chip chip-neutral tabular-nums">{candidate.experienciaTexto}</span>
                  <EnglishChip level={candidate.nivelIngles} withLabel />
                  <span className="chip chip-neutral">{modalityLabel(candidate.modalidad)}</span>
                </div>

                <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{candidate.resumenProfesional}</p>
                <p className="mt-2 truncate text-[13px] text-ink-3">{candidateSpecialtyNames(candidate).join(', ')}</p>
                <div className="mt-2">
                  <SearchHitNotes coincidencias={coincidencias} porValidar={porValidar.map(f => FILTER_LABEL[f])} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
