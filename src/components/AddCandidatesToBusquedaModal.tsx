import React, { useMemo, useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { BusquedaComercial } from '../types';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILIAS_DATA } from '../data/bookData';
import { FAMILY_BY_ID, profileName } from '../data/indexes';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { CandidateId, EnglishChip, modalityLabel } from './shared/badges';
import { plural } from '../utils/format';

interface AddCandidatesToBusquedaModalProps {
  busqueda: BusquedaComercial;
  onClose: () => void;
  onLinkCandidates: (candidateIds: string[]) => void;
}

export const AddCandidatesToBusquedaModal: React.FC<AddCandidatesToBusquedaModalProps> = ({ busqueda, onClose, onLinkCandidates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCandidatesToLink, setSelectedCandidatesToLink] = useState<string[]>([]);

  const alreadyLinkedIds = useMemo(() => new Set(busqueda.candidatosVinculados.map(c => c.candidatoId)), [busqueda.candidatosVinculados]);

  const allUniqueCountries = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_CANDIDATES.forEach(c => map.set(c.pais, (map.get(c.pais) || 0) + 1));
    return Array.from(map.entries())
      .map(([pais, count]) => ({ pais, count }))
      .sort((a, b) => a.pais.localeCompare(b.pais));
  }, []);

  const toggleCountryFilter = (country: string) => {
    setSelectedCountries(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));
  };

  // Profile ids of the selected family, resolved once per filter change
  const familyProfileIds = useMemo(() => {
    if (selectedFamilyFilter === 'all') return null;
    const famObj = FAMILY_BY_ID.get(selectedFamilyFilter);
    return famObj ? new Set(famObj.especialidades.flatMap(s => s.perfiles.map(p => p.id))) : null;
  }, [selectedFamilyFilter]);

  const filteredCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return MOCK_CANDIDATES.filter(c => {
      if (term) {
        const matches =
          c.id.toLowerCase().includes(term) ||
          c.nombre.toLowerCase().includes(term) ||
          c.resumenProfesional.toLowerCase().includes(term) ||
          c.pais.toLowerCase().includes(term) ||
          c.ciudad.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (familyProfileIds && !c.perfilesAsociados.some(id => familyProfileIds.has(id))) return false;

      if (selectedCountries.length > 0 && !selectedCountries.includes(c.pais)) return false;

      return true;
    });
  }, [searchTerm, familyProfileIds, selectedCountries]);

  const selectedSet = useMemo(() => new Set(selectedCandidatesToLink), [selectedCandidatesToLink]);

  const handleToggle = (id: string) => {
    if (alreadyLinkedIds.has(id)) return;
    setSelectedCandidatesToLink(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const unlinkedVisibleIds = filteredCandidates.filter(c => !alreadyLinkedIds.has(c.id)).map(c => c.id);
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_15rem]">
        <div className="relative">
          <label htmlFor="add-search" className="sr-only">
            Search candidates
          </label>
          <Search className="input-icon" />
          <input
            id="add-search"
            type="search"
            name="candidate-search"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Name, ID, city or country…"
            className="input input-with-icon"
          />
        </div>
        <div>
          <label htmlFor="add-family" className="sr-only">
            Job family
          </label>
          <select id="add-family" value={selectedFamilyFilter} onChange={e => setSelectedFamilyFilter(e.target.value)} className="input select">
            <option value="all">All job families</option>
            {FAMILIAS_DATA.map(f => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="flex flex-wrap items-center gap-1.5">
        <legend className="sr-only">Filter by country</legend>
        <button type="button" className="pill" aria-pressed={selectedCountries.length === 0} onClick={() => setSelectedCountries([])}>
          All countries <span className="pill-count">{MOCK_CANDIDATES.length}</span>
        </button>
        {allUniqueCountries.map(({ pais, count: n }) => (
          <button key={pais} type="button" className="pill" aria-pressed={selectedCountries.includes(pais)} onClick={() => toggleCountryFilter(pais)}>
            {pais} <span className="pill-count">{n}</span>
          </button>
        ))}
      </fieldset>

      <div className="flex items-center justify-between border-b border-rule pb-2 text-[13px]">
        <p className="text-ink-2" aria-live="polite">
          {plural(filteredCandidates.length, 'candidate')} shown
        </p>
        {unlinkedVisibleIds.length > 0 && (
          <button type="button" onClick={handleSelectAllVisible} className="font-medium text-brand-ink hover:underline">
            {allVisibleSelected ? 'Deselect visible' : 'Select all visible'}
          </button>
        )}
      </div>

      {filteredCandidates.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No candidates match" description="Try other countries or a broader search term." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredCandidates.map(candidate => {
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
                      {isAlreadyLinked ? <span className="chip chip-neutral shrink-0">Already linked</span> : null}
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
                <p className="mt-2 truncate text-[13px] text-ink-3">
                  {profileName(candidate.perfilesAsociados[0])}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
