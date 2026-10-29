import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { RotateCcw, Users, X, FolderPlus, LayoutGrid, List, ShieldCheck, Check, ChevronLeft, ChevronRight, Columns3, FileSpreadsheet } from 'lucide-react';
import { exportCandidatesWorkbook } from '../utils/exportCandidates';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILIAS_DATA } from '../data/bookData';
import { specialtyKey } from '../data/bookData';
import { FAMILY_BY_NAME, candidateSpecialtyNames } from '../data/indexes';
import { Candidato, BusquedaComercial } from '../types';
import {
  CandidateSearchHit,
  DetectedRequirement,
  FILTER_LABEL,
  Modalidad,
  NivelCefr,
  SearchFilters,
  compareCompleteFirst,
  englishRank,
  hasActiveFilters as filtersAreActive,
  parseRequirement,
  searchCandidates
} from '../services/candidateSearch';
import { CandidateId, EnglishChip, RelevanceChip, SearchHitNotes, modalityLabel } from './shared/badges';
import { EnglishMinimumOptions, ExperienceMinimumOptions, IncludeToValidateToggle, ModalityOptions, RequirementSearchBox } from './shared/searchControls';
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

type SortKey = 'relevance' | 'name' | 'experience' | 'english' | 'updated';
const SORT_LABEL: Record<SortKey, string> = {
  relevance: 'Relevance to your text',
  name: 'Name',
  experience: 'Experience, most first',
  english: 'English, highest first',
  updated: 'Recently updated'
};

/** Within each group (full matches, then to validate), the order the rep picked. */
const SORTERS: Record<Exclude<SortKey, 'relevance'>, (a: CandidateSearchHit, b: CandidateSearchHit) => number> = {
  name: (a, b) => a.candidato.nombre.localeCompare(b.candidato.nombre),
  experience: (a, b) => b.candidato.experienciaAnos - a.candidato.experienciaAnos || a.candidato.nombre.localeCompare(b.candidato.nombre),
  english: (a, b) => englishRank(b.candidato.nivelIngles) - englishRank(a.candidato.nivelIngles) || b.candidato.experienciaAnos - a.candidato.experienciaAnos,
  updated: (a, b) => (b.candidato.ultimaActualizacion ?? '').localeCompare(a.candidato.ultimaActualizacion ?? '') || a.candidato.nombre.localeCompare(b.candidato.nombre)
};

const EXAMPLE_REQUESTS = [
  'Accountant for month-end close and bank reconciliations, B2, 3+ years, Colombia or Mexico',
  'Analista de cobranza de cartera, inglés intermedio, remoto',
  'React and TypeScript frontend developer, bilingual, 4 years'
];

const PAGE_SIZE: Record<'cards' | 'table', number> = { cards: 24, table: 50 };

interface CandidatesSectionProps {
  initialFilter?: { familia?: string; especialidad?: string };
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

  // Taxonomy: family → specialty
  const [selectedFamily, setSelectedFamily] = useState<string>(initialFilter?.familia || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialFilter?.especialidad || '');

  // When the Book hands over a new filter, reset the taxonomy filters during render (no effect, no extra pass)
  const [appliedFilter, setAppliedFilter] = useState(initialFilter);
  if (initialFilter !== appliedFilter) {
    setAppliedFilter(initialFilter);
    if (initialFilter?.familia) setSelectedFamily(initialFilter.familia);
    setSelectedSpecialty(initialFilter?.especialidad || '');
  }

  // What the client asked for: the draft in the box, and the text the results were run with
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [detected, setDetected] = useState<DetectedRequirement[]>([]);

  // Requirement filters, all optional. English and experience are minimums.
  const [minExperience, setMinExperience] = useState(0);
  const [minEnglish, setMinEnglish] = useState<NivelCefr | ''>('');
  const [modality, setModality] = useState<Modalidad | ''>('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [includeToValidate, setIncludeToValidate] = useState(true);

  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  const selectedFamilyObj = selectedFamily ? FAMILY_BY_NAME.get(selectedFamily) : undefined;
  const availableSpecialties = selectedFamilyObj?.especialidades ?? [];

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFamily(e.target.value);
    setSelectedSpecialty('');
  };

  const allUniqueCountries = useMemo(() => Array.from(new Set(MOCK_CANDIDATES.map(c => c.pais))).sort(), []);
  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_CANDIDATES.forEach(c => map.set(c.pais, (map.get(c.pais) || 0) + 1));
    return map;
  }, []);

  /** A filter the rep changes by hand no longer counts as read from the text. */
  const forgetDetected = (field: DetectedRequirement['field']) => setDetected(prev => prev.filter(d => d.field !== field));

  const toggleCountryFilter = (country: string) => {
    forgetDetected('paises');
    setSelectedCountries(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));
  };

  const clearField = (field: DetectedRequirement['field']) => {
    if (field === 'ingles') setMinEnglish('');
    if (field === 'experiencia') setMinExperience(0);
    if (field === 'paises') setSelectedCountries([]);
    if (field === 'modalidad') setModality('');
  };

  /** Runs the semantic search and applies whatever requirements the text states, replacing those read last time. */
  const runSearch = (text: string) => {
    const trimmed = text.trim();
    for (const d of detected) clearField(d.field);
    setQuery(trimmed);
    const parsed = parseRequirement(trimmed);
    if (parsed.filtros.inglesMinimo) setMinEnglish(parsed.filtros.inglesMinimo);
    if (parsed.filtros.experienciaMinima) setMinExperience(parsed.filtros.experienciaMinima);
    if (parsed.filtros.paises) setSelectedCountries(parsed.filtros.paises);
    if (parsed.filtros.modalidad) setModality(parsed.filtros.modalidad);
    setDetected(parsed.detectados);
    if (trimmed) setSortKey('relevance');
  };

  const clearSearchText = () => {
    for (const d of detected) clearField(d.field);
    setDetected([]);
    setQueryDraft('');
    setQuery('');
  };

  const filters: SearchFilters = useMemo(
    () => ({
      familia: selectedFamily || undefined,
      especialidadKey: selectedFamilyObj && selectedSpecialty ? specialtyKey(selectedFamilyObj.id, selectedSpecialty) : undefined,
      inglesMinimo: minEnglish || undefined,
      experienciaMinima: minExperience || undefined,
      paises: selectedCountries,
      modalidad: modality || undefined
    }),
    [selectedFamily, selectedFamilyObj, selectedSpecialty, minEnglish, minExperience, selectedCountries, modality]
  );

  const results = useMemo(() => searchCandidates({ texto: query, filtros: filters, incluirPorValidar: includeToValidate }), [query, filters, includeToValidate]);
  const isSemantic = results.semantica;
  const effectiveSort: SortKey = sortKey === 'relevance' && !isSemantic ? 'updated' : sortKey;

  const sortedHits = useMemo(
    () => (effectiveSort === 'relevance' ? results.hits : [...results.hits].sort(compareCompleteFirst(SORTERS[effectiveSort]))),
    [results, effectiveSort]
  );

  // Pagination: go back to page 1 whenever the result set or layout changes (derived during render, no effect)
  const pageSize = PAGE_SIZE[displayMode];
  const pageCount = Math.max(1, Math.ceil(sortedHits.length / pageSize));
  const [pageResetKey, setPageResetKey] = useState<unknown>(sortedHits);
  if (pageResetKey !== sortedHits) {
    setPageResetKey(sortedHits);
    setPage(1);
  }
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageHits = sortedHits.slice(pageStart, pageStart + pageSize);
  const pageCandidates = pageHits.map(h => h.candidato);

  const selectedIdSet = useMemo(() => new Set(selectedCandidateIds), [selectedCandidateIds]);

  const handleClearAllFilters = () => {
    setSelectedFamily('');
    setSelectedSpecialty('');
    setMinExperience(0);
    setMinEnglish('');
    setModality('');
    setSelectedCountries([]);
    setIncludeToValidate(true);
    setDetected([]);
    setQueryDraft('');
    setQuery('');
  };

  const hasActiveFilters = filtersAreActive(filters) || Boolean(query) || !includeToValidate;

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
            Describe what the client needs. The text runs a semantic search over every CV; filters are optional, and a candidate with
            missing data stays in the list, marked to validate.
          </p>
        </div>
      </div>

      <section aria-label="Search the pool" className="panel panel-body" data-tour="semantic-search">
        <RequirementSearchBox
          id="candidate-search"
          value={queryDraft}
          onChange={setQueryDraft}
          onSubmit={() => runSearch(queryDraft)}
          onClear={clearSearchText}
          detected={detected}
          onRemoveDetected={field => {
            clearField(field);
            forgetDetected(field);
          }}
          examples={EXAMPLE_REQUESTS}
          onPickExample={text => {
            setQueryDraft(text);
            runSearch(text);
          }}
        />
        <p className="mt-2 text-[13px] text-ink-3">To find one person by name or ID, use the search in the header (press /).</p>
      </section>

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
              Filters <span className="font-normal text-ink-3">(optional)</span>
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
              <legend className="mb-3 text-[13px] font-semibold text-ink-3">Book</legend>
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
                <select value={selectedSpecialty} onChange={e => setSelectedSpecialty(e.target.value)} disabled={!selectedFamily} className="input select">
                  <option value="">{selectedFamily ? 'All specialties' : 'Choose a family first'}</option>
                  {availableSpecialties.map(s => (
                    <option key={s.nombre} value={s.nombre}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <div role="group" aria-labelledby="f-requirements" className="space-y-3 border-t border-rule pt-5">
              <p id="f-requirements" className="mb-3 text-[13px] font-semibold text-ink-3">
                Requirements
              </p>
              <Field id="f-exp" label="Minimum experience" hint="Counts this many years or more.">
                <select
                  value={minExperience}
                  onChange={e => {
                    forgetDetected('experiencia');
                    setMinExperience(Number(e.target.value));
                  }}
                  className="input select"
                >
                  <ExperienceMinimumOptions current={minExperience} />
                </select>
              </Field>
              <Field id="f-english" label="Minimum English" hint="Accepts this level or higher: B1 also brings B2, C1 and C2.">
                <select
                  value={minEnglish}
                  onChange={e => {
                    forgetDetected('ingles');
                    setMinEnglish(e.target.value as NivelCefr | '');
                  }}
                  className="input select"
                >
                  <EnglishMinimumOptions />
                </select>
              </Field>
              <Field id="f-modality" label="Work mode">
                <select
                  value={modality}
                  onChange={e => {
                    forgetDetected('modalidad');
                    setModality(e.target.value as Modalidad | '');
                  }}
                  className="input select"
                >
                  <ModalityOptions />
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
                  <button
                    type="button"
                    onClick={() => {
                      forgetDetected('paises');
                      setSelectedCountries([]);
                    }}
                    className="text-[13px] text-ink-2 hover:text-brand-ink hover:underline"
                  >
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

            <div className="border-t border-rule pt-5">
              <IncludeToValidateToggle id="f-to-validate" checked={includeToValidate} onChange={setIncludeToValidate} />
            </div>
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
            <div aria-live="polite">
              <p className="text-base">
                <strong className="font-semibold tabular-nums">{sortedHits.length}</strong>{' '}
                <span className="text-ink-2">{sortedHits.length === 1 ? 'candidate' : 'candidates'}</span>
                {isSemantic ? (
                  <span className="text-ink-3"> similar to “{query.length > 60 ? `${query.slice(0, 60)}…` : query}”</span>
                ) : hasActiveFilters ? (
                  <span className="text-ink-3"> match the filters</span>
                ) : (
                  <span className="text-ink-3"> in the pool</span>
                )}
              </p>
              {results.porValidar > 0 ? (
                <p className="text-[13px] tabular-nums text-ink-3">
                  {results.completos} meet every filter, {results.porValidar} to validate (missing data, listed after)
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-by" className="text-ink-3">
                  Sort by
                </label>
                <select id="sort-by" value={effectiveSort} onChange={e => setSortKey(e.target.value as SortKey)} className="input select h-8 w-auto text-[13px]">
                  {(Object.keys(SORT_LABEL) as SortKey[]).map(key => (
                    <option key={key} value={key} disabled={key === 'relevance' && !isSemantic}>
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

          {sortedHits.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Users className="size-5" />}
                title={isSemantic ? 'No CVs resemble this request with these filters' : 'No candidates match'}
                description={
                  isSemantic
                    ? 'Describe the role with other words, lower the minimums or include candidates with missing data.'
                    : 'Lower the minimums, add countries or clear the filters.'
                }
                action={<Button onClick={handleClearAllFilters}>Clear search and filters</Button>}
              />
            </div>
          ) : displayMode === 'cards' ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pageHits.map(({ candidato: candidate, relevancia, coincidencias, porValidar }) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  idPrefix="pool"
                  selected={selectedIdSet.has(candidate.id)}
                  onToggleSelect={onToggleCandidate}
                  onOpenProfile={setActiveCandidateDetail}
                  badge={relevancia !== null ? <RelevanceChip value={relevancia} /> : undefined}
                  actions={
                    <Button size="sm" variant="subtle" icon={<FolderPlus className="size-4" />} className="above" onClick={() => openLinkModal([candidate.id])}>
                      Add to search
                    </Button>
                  }
                >
                  <SearchHitNotes coincidencias={coincidencias} porValidar={porValidar.map(f => FILTER_LABEL[f])} />
                </CandidateCard>
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
                    {isSemantic ? (
                      <th scope="col" className="px-3 py-2.5 font-medium">
                        Match
                      </th>
                    ) : null}
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Specialty
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
                  {pageHits.map(({ candidato: candidate, relevancia, porValidar }) => {
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
                          {porValidar.length > 0 ? (
                            <div className="mt-1">
                              <span className="chip chip-warn">To validate: {porValidar.map(f => FILTER_LABEL[f]).join(', ')}</span>
                            </div>
                          ) : null}
                        </td>
                        {isSemantic ? <td className="px-3 py-3">{relevancia !== null ? <RelevanceChip value={relevancia} /> : null}</td> : null}
                        <td className="px-3 py-3 text-ink-2">
                          <ul className="space-y-0.5">
                            {candidateSpecialtyNames(candidate).map(name => (
                              <li key={name}>{name}</li>
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

          {sortedHits.length > pageSize ? (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-[13px]">
              <p className="tabular-nums text-ink-2">
                Showing {pageStart + 1}–{Math.min(pageStart + pageSize, sortedHits.length)} of {sortedHits.length}
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
