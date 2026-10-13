import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { RotateCcw, Users, Search, X, FolderPlus, LayoutGrid, List, ShieldCheck, Check, ChevronLeft, ChevronRight, Columns3, FileSpreadsheet } from 'lucide-react';
import { exportCandidatesWorkbook } from '../utils/exportCandidates';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILIAS_DATA } from '../data/bookData';
import { FAMILY_BY_NAME, profileName as getProfileName } from '../data/indexes';
import { Candidato, BusquedaComercial } from '../types';
import { CandidateId, EnglishChip, modalityLabel } from './shared/badges';
import { CandidateCard } from './shared/CandidateCard';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Field } from './ui/Field';
import { Toast } from './ui/Toast';
import { plural } from '../utils/format';

// Modals load on first use
const LinkToBusquedaSelectorModal = lazy(() => import('./LinkToBusquedaSelectorModal').then(m => ({ default: m.LinkToBusquedaSelectorModal })));
const CandidateDetailModal = lazy(() => import('./shared/CandidateDetailModal').then(m => ({ default: m.CandidateDetailModal })));
const CompareCandidatesModal = lazy(() => import('./CompareCandidatesModal').then(m => ({ default: m.CompareCandidatesModal })));

/* Resizable filter panel: width in px, kept per browser as a convenience */
const FILTERS_WIDTH_KEY = 'talentbook.candidates.filtersWidth';
const FILTERS_WIDTH = { min: 240, max: 520, default: 272, step: 16 };

function readFiltersWidth(): number {
  try {
    const v = Number(window.localStorage.getItem(FILTERS_WIDTH_KEY));
    return Number.isFinite(v) && v >= FILTERS_WIDTH.min && v <= FILTERS_WIDTH.max ? v : FILTERS_WIDTH.default;
  } catch {
    return FILTERS_WIDTH.default;
  }
}

function storeFiltersWidth(width: number): void {
  try {
    window.localStorage.setItem(FILTERS_WIDTH_KEY, String(width));
  } catch {
    // Storage unavailable; the width still applies for this session.
  }
}

const clampWidth = (w: number) => Math.round(Math.min(FILTERS_WIDTH.max, Math.max(FILTERS_WIDTH.min, w)));

type SortKey = 'name' | 'experience' | 'english' | 'updated';
const SORT_LABEL: Record<SortKey, string> = { name: 'Name', experience: 'Experience, most first', english: 'English, highest first', updated: 'Recently updated' };
const ENGLISH_RANK: Record<string, number> = { C2: 6, C1: 5, B2: 4, B1: 3, A2: 2, A1: 1 };
const PAGE_SIZE: Record<'cards' | 'table', number> = { cards: 24, table: 50 };

interface CandidatesSectionProps {
  initialFilter?: { familia?: string; especialidad?: string; perfilId?: string };
  selectedCandidateIds: string[];
  onToggleCandidate: (id: string) => void;
  onClearSelection: () => void;
  onProceedToEvaluate: () => void;
  busquedas?: BusquedaComercial[];
  onLinkCandidatesToBusqueda?: (busquedaId: string, candidateIds: string[]) => void;
  onRequestCreateBusqueda?: () => void;
}

export const CandidatesSection: React.FC<CandidatesSectionProps> = ({
  initialFilter,
  selectedCandidateIds,
  onToggleCandidate,
  onClearSelection,
  onProceedToEvaluate,
  busquedas = [],
  onLinkCandidatesToBusqueda = () => {},
  onRequestCreateBusqueda = () => {}
}) => {
  // Linking
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [candidatesToLink, setCandidatesToLink] = useState<string[]>([]);
  const [toolbarTargetBusquedaId, setToolbarTargetBusquedaId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success');
  const notify = (message: string, tone: 'success' | 'error' = 'success') => {
    setToastTone(tone);
    setToast(message);
  };

  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [page, setPage] = useState(1);

  // Filter panel width (desktop only); dragged with the pointer or nudged with the keyboard
  const [filtersWidth, setFiltersWidth] = useState<number>(readFiltersWidth);
  const commitFiltersWidth = (width: number) => {
    const next = clampWidth(width);
    setFiltersWidth(next);
    storeFiltersWidth(next);
  };

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = filtersWidth;
    let latest = startWidth;
    const previousSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMove = (ev: PointerEvent) => {
      latest = clampWidth(startWidth + (ev.clientX - startX));
      setFiltersWidth(latest);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.body.style.userSelect = previousSelect;
      document.body.style.cursor = previousCursor;
      storeFiltersWidth(latest);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  const onResizeKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number | undefined> = {
      ArrowLeft: filtersWidth - FILTERS_WIDTH.step,
      ArrowRight: filtersWidth + FILTERS_WIDTH.step,
      Home: FILTERS_WIDTH.min,
      End: FILTERS_WIDTH.max,
      Enter: FILTERS_WIDTH.default
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    commitFiltersWidth(next);
  };

  // Cascading taxonomy filters
  const [selectedFamily, setSelectedFamily] = useState<string>(initialFilter?.familia || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialFilter?.especialidad || '');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialFilter?.perfilId || '');

  // When the Book hands over a new filter, reset the taxonomy filters during render (no effect, no extra pass)
  const [appliedFilter, setAppliedFilter] = useState(initialFilter);
  if (initialFilter !== appliedFilter) {
    setAppliedFilter(initialFilter);
    if (initialFilter?.familia) setSelectedFamily(initialFilter.familia);
    if (initialFilter?.especialidad) setSelectedSpecialty(initialFilter.especialidad);
    if (initialFilter?.perfilId) setSelectedProfileId(initialFilter.perfilId);
  }

  const [experienceRange, setExperienceRange] = useState<string>('all');
  const [selectedEnglish, setSelectedEnglish] = useState<string>('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [keywordSearch, setKeywordSearch] = useState<string>('');

  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  const selectedFamilyObj = selectedFamily ? FAMILY_BY_NAME.get(selectedFamily) : undefined;
  const availableSpecialties = selectedFamilyObj?.especialidades ?? [];

  const availableProfiles = useMemo(() => {
    if (!selectedFamilyObj) return [];
    if (selectedSpecialty) return selectedFamilyObj.especialidades.find(s => s.nombre === selectedSpecialty)?.perfiles ?? [];
    return selectedFamilyObj.especialidades.flatMap(s => s.perfiles);
  }, [selectedFamilyObj, selectedSpecialty]);

  const availableProfileIds = useMemo(() => new Set(availableProfiles.map(p => p.id)), [availableProfiles]);

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFamily(e.target.value);
    setSelectedSpecialty('');
    setSelectedProfileId('');
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(e.target.value);
    setSelectedProfileId('');
  };

  const allUniqueCountries = useMemo(() => Array.from(new Set(MOCK_CANDIDATES.map(c => c.pais))).sort(), []);
  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_CANDIDATES.forEach(c => map.set(c.pais, (map.get(c.pais) || 0) + 1));
    return map;
  }, []);

  const toggleCountryFilter = (country: string) => {
    setSelectedCountries(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));
  };

  const filteredCandidates = useMemo(() => {
    const term = keywordSearch.trim().toLowerCase();
    return MOCK_CANDIDATES.filter(candidate => {
      if (term) {
        const matchesTerm =
          candidate.id.toLowerCase().includes(term) ||
          candidate.nombre.toLowerCase().includes(term) ||
          candidate.resumenProfesional.toLowerCase().includes(term) ||
          candidate.habilidades.some(h => h.toLowerCase().includes(term)) ||
          candidate.ciudad.toLowerCase().includes(term) ||
          candidate.pais.toLowerCase().includes(term);
        if (!matchesTerm) return false;
      }

      if (selectedProfileId) {
        if (!candidate.perfilesAsociados.includes(selectedProfileId)) return false;
      } else if (selectedFamily) {
        if (!candidate.perfilesAsociados.some(id => availableProfileIds.has(id))) return false;
      }

      if (experienceRange !== 'all') {
        const y = candidate.experienciaAnos;
        if (experienceRange === '1-2' && (y < 1 || y > 2)) return false;
        if (experienceRange === '3-5' && (y < 3 || y > 5)) return false;
        if (experienceRange === '6+' && y < 6) return false;
      }

      if (selectedEnglish !== 'all') {
        if (selectedEnglish === 'sin_info' && candidate.nivelIngles !== 'Sin información') return false;
        if (selectedEnglish !== 'sin_info' && candidate.nivelIngles !== selectedEnglish) return false;
      }

      if (selectedCountries.length > 0 && !selectedCountries.includes(candidate.pais)) return false;

      return true;
    });
  }, [keywordSearch, selectedFamily, selectedProfileId, availableProfileIds, experienceRange, selectedEnglish, selectedCountries]);

  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates];
    switch (sortKey) {
      case 'name':
        return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      case 'experience':
        return list.sort((a, b) => b.experienciaAnos - a.experienciaAnos || a.nombre.localeCompare(b.nombre));
      case 'english':
        return list.sort((a, b) => (ENGLISH_RANK[b.nivelIngles] ?? 0) - (ENGLISH_RANK[a.nivelIngles] ?? 0) || b.experienciaAnos - a.experienciaAnos);
      default:
        return list.sort((a, b) => (b.ultimaActualizacion ?? '').localeCompare(a.ultimaActualizacion ?? '') || a.nombre.localeCompare(b.nombre));
    }
  }, [filteredCandidates, sortKey]);

  // Pagination: go back to page 1 whenever the result set or layout changes (derived during render, no effect)
  const pageSize = PAGE_SIZE[displayMode];
  const pageCount = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));
  const [pageResetKey, setPageResetKey] = useState<unknown>(sortedCandidates);
  if (pageResetKey !== sortedCandidates) {
    setPageResetKey(sortedCandidates);
    setPage(1);
  }
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageCandidates = sortedCandidates.slice(pageStart, pageStart + pageSize);

  const selectedIdSet = useMemo(() => new Set(selectedCandidateIds), [selectedCandidateIds]);

  const handleClearAllFilters = () => {
    setSelectedFamily('');
    setSelectedSpecialty('');
    setSelectedProfileId('');
    setExperienceRange('all');
    setSelectedEnglish('all');
    setSelectedCountries([]);
    setKeywordSearch('');
  };

  const hasActiveFilters =
    Boolean(selectedFamily) || experienceRange !== 'all' || selectedEnglish !== 'all' || selectedCountries.length > 0 || Boolean(keywordSearch);

  const allVisibleSelected = pageCandidates.length > 0 && pageCandidates.every(c => selectedIdSet.has(c.id));
  const handleToggleVisible = () => {
    pageCandidates.forEach(c => {
      const isSelected = selectedIdSet.has(c.id);
      if (allVisibleSelected ? isSelected : !isSelected) onToggleCandidate(c.id);
    });
  };

  const dismissToast = useCallback(() => setToast(null), []);

  const openLinkModal = (ids: string[]) => {
    setCandidatesToLink(ids);
    setIsLinkModalOpen(true);
  };

  const handleLinkFromToolbar = () => {
    if (!toolbarTargetBusquedaId) {
      openLinkModal(selectedCandidateIds);
      return;
    }
    onLinkCandidatesToBusqueda(toolbarTargetBusquedaId, selectedCandidateIds);
    const target = busquedas.find(b => b.id === toolbarTargetBusquedaId);
    notify(`Linked ${plural(selectedCandidateIds.length, 'candidate')} to “${target?.nombre ?? 'the search'}”.`);
  };

  const selectedCount = selectedCandidateIds.length;
  const isDetailSelected = activeCandidateDetail ? selectedIdSet.has(activeCandidateDetail.id) : false;

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const selectedCandidates = useMemo(() => selectedCandidateIds.flatMap(id => MOCK_CANDIDATES.find(c => c.id === id) ?? []), [selectedCandidateIds]);
  const canCompare = selectedCandidates.length >= 2 && selectedCandidates.length <= 4;

  // Export is always one click: the selected candidates go out; with nothing selected the button explains what to do
  const handleExport = () => {
    if (selectedCandidates.length === 0) {
      notify('Nothing to export. Select at least one candidate first.', 'error');
      return;
    }
    exportCandidatesWorkbook(selectedCandidates, 'selected-candidates');
    notify(`Exported ${plural(selectedCandidates.length, 'candidate')} to Excel.`);
  };

  return (
    <div className={`space-y-6 ${selectedCount > 0 ? 'pb-28 lg:pb-24' : ''}`}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-lede">
            The pool, classified by Book profile. Select candidates to add them to a search or to evaluate their fit against a vacancy.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <label htmlFor="candidate-search" className="sr-only">
            Search candidates
          </label>
          <Search className="input-icon" />
          <input
            id="candidate-search"
            type="search"
            name="candidate-search"
            autoComplete="off"
            value={keywordSearch}
            onChange={e => setKeywordSearch(e.target.value)}
            placeholder="Name, ID, skill, city or country…"
            className="input input-with-icon pr-9"
          />
          {keywordSearch && (
            <button
              type="button"
              onClick={() => setKeywordSearch('')}
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:bg-well hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[var(--filters-w)_auto_minmax(0,1fr)] lg:gap-x-2"
        style={{ '--filters-w': `${filtersWidth}px` } as React.CSSProperties}
      >
        {/* Filters */}
        {/* Sticky, but never taller than the viewport: the filter body scrolls on its own */}
        <aside
          aria-labelledby="filters-heading"
          className="panel lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100dvh-6rem)] lg:flex-col"
          data-tour="filters"
        >
          <div className="panel-head">
            <h2 id="filters-heading" className="text-base font-semibold">
              Filters
            </h2>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearAllFilters} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-ink hover:underline">
                <RotateCcw className="size-3.5" />
                Clear all
              </button>
            )}
          </div>

          <div className="panel-body space-y-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            <fieldset className="space-y-3">
              <legend className="mb-3 text-[13px] font-semibold text-ink-3">Book profile</legend>
              <Field id="f-family" label="Job family">
                <select value={selectedFamily} onChange={handleFamilyChange} className="input select">
                  <option value="">All families</option>
                  {FAMILIAS_DATA.map(f => (
                    <option key={f.id} value={f.nombre}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="f-specialty" label="Specialty">
                <select value={selectedSpecialty} onChange={handleSpecialtyChange} disabled={!selectedFamily} className="input select">
                  <option value="">{selectedFamily ? 'All specialties' : 'Choose a family first'}</option>
                  {availableSpecialties.map(s => (
                    <option key={s.nombre} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="f-profile" label="Profile">
                <select value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)} disabled={!selectedFamily} className="input select">
                  <option value="">{selectedFamily ? 'All profiles' : 'Choose a family first'}</option>
                  {availableProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <div className="space-y-3 border-t border-rule pt-5">
              <Field id="f-exp" label="Experience">
                <select value={experienceRange} onChange={e => setExperienceRange(e.target.value)} className="input select">
                  <option value="all">Any</option>
                  <option value="1-2">1 to 2 years</option>
                  <option value="3-5">3 to 5 years</option>
                  <option value="6+">6 years or more</option>
                </select>
              </Field>
              <Field id="f-english" label="English">
                <select value={selectedEnglish} onChange={e => setSelectedEnglish(e.target.value)} className="input select">
                  <option value="all">Any level</option>
                  <option value="B1">B1, intermediate</option>
                  <option value="B2">B2, upper intermediate</option>
                  <option value="C1">C1, advanced</option>
                  <option value="C2">C2, bilingual</option>
                  <option value="sin_info">Not assessed</option>
                </select>
              </Field>
            </div>

            <fieldset className="border-t border-rule pt-5">
              <legend className="sr-only">Country</legend>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0" aria-hidden="true">
                  Country
                </span>
                {selectedCountries.length > 0 && (
                  <button type="button" onClick={() => setSelectedCountries([])} className="text-[13px] text-ink-2 hover:text-brand-ink hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allUniqueCountries.map(country => (
                  <button key={country} type="button" className="pill" aria-pressed={selectedCountries.includes(country)} onClick={() => toggleCountryFilter(country)}>
                    {country} <span className="pill-count">{countryCounts.get(country)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </aside>

        {/* Resize handle: drag, or focus it and use the arrow keys; double-click resets */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Filter panel width"
          aria-valuemin={FILTERS_WIDTH.min}
          aria-valuemax={FILTERS_WIDTH.max}
          aria-valuenow={filtersWidth}
          tabIndex={0}
          title="Drag to resize the filters. Double-click to reset."
          onPointerDown={startResize}
          onKeyDown={onResizeKey}
          onDoubleClick={() => commitFiltersWidth(FILTERS_WIDTH.default)}
          className="group hidden h-full min-h-40 w-4 cursor-col-resize touch-none items-stretch justify-center self-stretch lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100dvh-6rem)]"
        >
          <span aria-hidden="true" className="my-3 w-px rounded-full bg-rule transition-[background-color,width] duration-150 group-hover:w-0.5 group-hover:bg-brand group-focus-visible:w-0.5 group-focus-visible:bg-brand" />
        </div>

        {/* Results */}
        <div className="min-w-0 space-y-4" data-tour="results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base" aria-live="polite">
              <strong className="font-semibold tabular-nums">{filteredCandidates.length}</strong>{' '}
              <span className="text-ink-2">{filteredCandidates.length === 1 ? 'candidate' : 'candidates'}</span>
              {hasActiveFilters ? <span className="text-ink-3"> match the filters</span> : <span className="text-ink-3"> in the pool</span>}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-by" className="text-ink-3">
                  Sort by
                </label>
                <select id="sort-by" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="input select h-8 w-auto text-[13px]">
                  {(Object.keys(SORT_LABEL) as SortKey[]).map(key => (
                    <option key={key} value={key}>
                      {SORT_LABEL[key]}
                    </option>
                  ))}
                </select>
              </div>
              {pageCandidates.length > 0 ? (
                <button type="button" onClick={handleToggleVisible} className="font-medium text-brand-ink hover:underline">
                  {allVisibleSelected ? 'Deselect page' : 'Select page'}
                </button>
              ) : null}
              {selectedCount > 0 ? (
                <Button size="sm" variant="ghost" icon={<X className="size-4" />} onClick={onClearSelection} title="Deselect every candidate, on every page">
                  Clear selection ({selectedCount})
                </Button>
              ) : null}
              <Button
                size="sm"
                icon={<FileSpreadsheet className="size-4" />}
                onClick={handleExport}
                title={selectedCount > 0 ? `Download the ${plural(selectedCount, 'selected candidate')} as an Excel file` : 'Select candidates, then export them as an Excel file'}
              >
                Export to Excel{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Button>
              <div className="flex rounded-md border border-rule-strong bg-surface p-0.5" role="group" aria-label="Layout">
                <button type="button" aria-pressed={displayMode === 'cards'} aria-label="Cards" title="Cards" onClick={() => setDisplayMode('cards')} className="segment size-8 justify-center px-0">
                  <LayoutGrid className="size-4" />
                </button>
                <button type="button" aria-pressed={displayMode === 'table'} aria-label="Table" title="Table" onClick={() => setDisplayMode('table')} className="segment size-8 justify-center px-0">
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Users className="size-5" />}
                title="No candidates match"
                description="Widen the experience range, add countries or clear the filters."
                action={<Button onClick={handleClearAllFilters}>Clear all filters</Button>}
              />
            </div>
          ) : displayMode === 'cards' ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pageCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  idPrefix="pool"
                  selected={selectedIdSet.has(candidate.id)}
                  onToggleSelect={onToggleCandidate}
                  onOpenProfile={setActiveCandidateDetail}
                  actions={
                    <Button size="sm" variant="subtle" icon={<FolderPlus className="size-4" />} className="above" onClick={() => openLinkModal([candidate.id])}>
                      Add to search
                    </Button>
                  }
                />
              ))}
            </ul>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-[13px]">
                <caption className="sr-only">Candidates matching the current filters</caption>
                <thead>
                  <tr className="border-b border-rule text-ink-3">
                    <th scope="col" className="w-10 px-4 py-2.5">
                      <span className="sr-only">Select</span>
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Candidate
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Book profiles
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Experience
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      English
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {pageCandidates.map(candidate => {
                    const isSelected = selectedIdSet.has(candidate.id);
                    return (
                      <tr key={candidate.id} className={`align-top hover:bg-well/60 ${isSelected ? 'bg-brand-wash/40' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleCandidate(candidate.id)}
                            className="size-4"
                            aria-label={`Select ${candidate.nombre}`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-ink">{candidate.nombre}</div>
                          <CandidateId id={candidate.id} />
                        </td>
                        <td className="px-3 py-3 text-ink-2">
                          <ul className="space-y-0.5">
                            {candidate.perfilesAsociados.map(pId => (
                              <li key={pId}>{getProfileName(pId)}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-ink">{candidate.experienciaTexto}</td>
                        <td className="px-3 py-3">
                          <EnglishChip level={candidate.nivelIngles} />
                        </td>
                        <td className="px-3 py-3 text-ink-2">
                          <div>
                            {candidate.ciudad}, {candidate.pais}
                          </div>
                          <div className="text-ink-3">{modalityLabel(candidate.modalidad)}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setActiveCandidateDetail(candidate)}>
                              View
                            </Button>
                            <Button size="sm" variant="ghost" icon={<FolderPlus className="size-4" />} onClick={() => openLinkModal([candidate.id])}>
                              Add to search
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sortedCandidates.length > pageSize ? (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-[13px]">
              <p className="tabular-nums text-ink-2">
                Showing {pageStart + 1}–{Math.min(pageStart + pageSize, sortedCandidates.length)} of {sortedCandidates.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" icon={<ChevronLeft className="size-4" />} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                  Previous
                </Button>
                <span className="tabular-nums text-ink-2" aria-current="page">
                  Page {safePage} of {pageCount}
                </span>
                <Button size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount}>
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {/* Selection bar */}
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 animate-rise">
          <section aria-label="Selection actions" className="mx-auto max-w-7xl rounded-lg bg-inverse p-3 text-on-inverse shadow-bar sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm">
                <strong className="font-semibold tabular-nums">{selectedCount}</strong> {selectedCount === 1 ? 'candidate' : 'candidates'} selected
                {canCompare ? null : selectedCount > 4 ? <span className="ml-2 text-on-inverse/70">Select up to 4 to compare</span> : null}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="toolbar-search" className="sr-only">
                  Target search
                </label>
                <select
                  id="toolbar-search"
                  value={toolbarTargetBusquedaId}
                  onChange={e => setToolbarTargetBusquedaId(e.target.value)}
                  className="input select h-9 w-full border-on-inverse/20 bg-on-inverse/10 text-on-inverse sm:w-64 [&_option]:bg-surface [&_option]:text-ink"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">Choose a search…</option>
                  {busquedas.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                      {b.clienteEmpresa ? ` (${b.clienteEmpresa})` : ''}
                    </option>
                  ))}
                </select>
                <Button variant="primary" icon={<FolderPlus className="size-4" />} onClick={handleLinkFromToolbar}>
                  {toolbarTargetBusquedaId ? 'Add to search' : 'Choose search'}
                </Button>
                <Button variant="on-dark" onClick={onRequestCreateBusqueda}>
                  New search
                </Button>
                <Button variant="on-dark" icon={<ShieldCheck className="size-4" />} onClick={onProceedToEvaluate}>
                  Evaluate fit
                </Button>
                <Button variant="on-dark" icon={<Columns3 className="size-4" />} onClick={() => setIsCompareOpen(true)} disabled={!canCompare} title={canCompare ? 'Compare side by side' : 'Select 2 to 4 candidates to compare'}>
                  Compare
                </Button>
                <Button variant="on-dark" icon={<FileSpreadsheet className="size-4" />} onClick={handleExport}>
                  Export to Excel
                </Button>
                <Button variant="on-dark" icon={<X className="size-4" />} onClick={onClearSelection} title="Deselect every candidate, on every page">
                  Clear selection
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      <Toast message={toast} tone={toastTone} onDismiss={dismissToast} />

      <Suspense fallback={null}>
        {activeCandidateDetail ? (
          <CandidateDetailModal
            candidate={activeCandidateDetail}
            onClose={() => setActiveCandidateDetail(null)}
            action={
              <Button
                variant={isDetailSelected ? 'secondary' : 'primary'}
                icon={isDetailSelected ? <X className="size-4" /> : <Check className="size-4" />}
                onClick={() => {
                  onToggleCandidate(activeCandidateDetail.id);
                  setActiveCandidateDetail(null);
                }}
              >
                {isDetailSelected ? 'Remove from selection' : 'Select candidate'}
              </Button>
            }
          />
        ) : null}

        {isLinkModalOpen ? (
          <LinkToBusquedaSelectorModal
            candidateIds={candidatesToLink}
            busquedas={busquedas}
            onClose={() => setIsLinkModalOpen(false)}
            onLinkToExistingBusqueda={(busquedaId, ids) => {
              onLinkCandidatesToBusqueda(busquedaId, ids);
              const target = busquedas.find(b => b.id === busquedaId);
              notify(`Linked ${plural(ids.length, 'candidate')} to “${target?.nombre ?? 'the search'}”.`);
            }}
            onRequestCreateNewBusqueda={onRequestCreateBusqueda}
          />
        ) : null}

        {isCompareOpen && canCompare ? (
          <CompareCandidatesModal candidates={selectedCandidates} onClose={() => setIsCompareOpen(false)} onOpenProfile={setActiveCandidateDetail} />
        ) : null}
      </Suspense>
    </div>
  );
};
