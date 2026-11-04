import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronDown, Users, X, FileText, LayoutList, ListTree, Check, Minus } from 'lucide-react';
import { FAMILIAS_DATA, ALL_SPECIALTIES, specialtyKey } from '../data/bookData';
import { CANDIDATE_COUNT_BY_FAMILY, CANDIDATE_COUNT_BY_SPECIALTY, FAMILY_BY_ID, SPECIALTY_BY_KEY } from '../data/indexes';
import { EspecialidadBook, FamiliaOcupacional } from '../types';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { plural } from '../utils/format';

type NavigateFilter = { familia?: string; especialidad?: string };

interface BookSectionProps {
  onNavigateToCandidates: (filterParams?: NavigateFilter) => void;
  /** Opens this specialty's family page and sheet (from global search). `key` makes repeats re-apply. */
  focusSpecialty?: { specialtyKey: string; key: number } | null;
}

/* Candidate counts per taxonomy node, precomputed once in data/indexes */
const countForFamily = (family: FamiliaOcupacional) => CANDIDATE_COUNT_BY_FAMILY.get(family.id) ?? 0;
const countForSpecialty = (s: EspecialidadBook) => CANDIDATE_COUNT_BY_SPECIALTY.get(s.key) ?? 0;

const specialtiesOf = (family: FamiliaOcupacional): EspecialidadBook[] =>
  family.especialidades.flatMap(s => SPECIALTY_BY_KEY.get(specialtyKey(family.id, s.nombre)) ?? []);

/* Lower-cased searchable text per specialty, built once instead of on every keystroke */
const SPECIALTY_SEARCH_TEXT: ReadonlyMap<string, string> = new Map(
  ALL_SPECIALTIES.map(s => [s.key, [s.nombre, s.familia, s.descripcion, ...s.roles.map(r => r.nombre), ...s.habilidades].join('\n').toLowerCase()])
);

const toCandidates = (s: EspecialidadBook): NavigateFilter => ({ familia: s.familia, especialidad: s.nombre });

/**
 * The Book reads like a reference book: a running index of families on the
 * left, the open family's page on the right. Two levels only, family and
 * specialty; "Outline" shows every family expanded for scanning at once.
 */
export const BookSection: React.FC<BookSectionProps> = ({ onNavigateToCandidates, focusSpecialty = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'browse' | 'outline'>('browse');

  // Browse view: open family
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<EspecialidadBook | null>(null);

  // A specialty handed in from global search opens its family page and sheet (derived during render)
  const [appliedFocus, setAppliedFocus] = useState(focusSpecialty);
  if (focusSpecialty !== appliedFocus) {
    setAppliedFocus(focusSpecialty);
    const specialty = focusSpecialty ? SPECIALTY_BY_KEY.get(focusSpecialty.specialtyKey) : undefined;
    if (specialty) {
      setSearchTerm('');
      setViewMode('browse');
      setSelectedFamilyId(specialty.familiaId);
      setActiveSheet(specialty);
    }
  }

  // Outline view: expanded families. The first three open by default.
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({ 'FAM-ADM': true, 'FAM-COB': true, 'FAM-FIN': true });

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return ALL_SPECIALTIES.filter(s => SPECIALTY_SEARCH_TEXT.get(s.key)!.includes(term));
  }, [searchTerm]);

  const currentFamily = selectedFamilyId ? (FAMILY_BY_ID.get(selectedFamilyId) ?? null) : null;

  const openFamily = (id: string | null) => {
    setSelectedFamilyId(id);
    window.scrollTo({ top: 0 });
  };

  const toggleFamily = (familyId: string) => setExpandedFamilies(prev => ({ ...prev, [familyId]: !prev[familyId] }));
  const handleExpandAll = () => setExpandedFamilies(Object.fromEntries(FAMILIAS_DATA.map(f => [f.id, true])));
  const handleCollapseAll = () => setExpandedFamilies({});

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Occupational book</h1>
          <p className="page-lede">
            {FAMILIAS_DATA.length} job families and {ALL_SPECIALTIES.length} specialties. Each specialty says which roles it covers and
            what is in and out of scope, so you can position candidates against the right benchmark.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-lg">
          <label htmlFor="book-search" className="sr-only">
            Search specialties
          </label>
          <Search className="input-icon" />
          <input
            id="book-search"
            type="search"
            name="specialty-search"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search specialties by name, role or skill…"
            className="input input-with-icon pr-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:bg-well hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {!isSearching && (
          <div className="flex items-center gap-3">
            {viewMode === 'outline' && (
              <div className="hidden items-center gap-2 text-[13px] sm:flex">
                <button type="button" onClick={handleExpandAll} className="font-medium text-brand-ink hover:underline">
                  Expand all
                </button>
                <span className="text-rule-strong" aria-hidden="true">
                  |
                </span>
                <button type="button" onClick={handleCollapseAll} className="font-medium text-brand-ink hover:underline">
                  Collapse all
                </button>
              </div>
            )}
            <div className="flex rounded-md border border-rule-strong bg-surface p-0.5" role="group" aria-label="View">
              <button type="button" aria-pressed={viewMode === 'browse'} onClick={() => setViewMode('browse')} className="segment">
                <LayoutList className="size-4" />
                Browse
              </button>
              <button type="button" aria-pressed={viewMode === 'outline'} onClick={() => setViewMode('outline')} className="segment">
                <ListTree className="size-4" />
                Outline
              </button>
            </div>
          </div>
        )}
      </div>

      {isSearching ? (
        <section aria-labelledby="results-heading" className="space-y-4">
          <h2 id="results-heading" className="text-base font-semibold" aria-live="polite">
            {plural(searchResults.length, 'specialty', 'specialties')} for “{searchTerm}”
          </h2>
          {searchResults.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Search className="size-5" />}
                title="No specialties match"
                description="Try a role keyword such as “collections”, “payroll”, “developer” or “assistant”."
                action={<Button onClick={() => setSearchTerm('')}>Clear search</Button>}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map(specialty => (
                <li key={specialty.key}>
                  <SpecialtyCard
                    specialty={specialty}
                    candidateCount={countForSpecialty(specialty)}
                    onOpenDetail={() => setActiveSheet(specialty)}
                    onViewCandidates={() => onNavigateToCandidates(toCandidates(specialty))}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : viewMode === 'browse' ? (
        <div className="grid gap-8 lg:grid-cols-[14rem_1fr] xl:grid-cols-[16rem_1fr]">
          {/* Index */}
          <nav aria-label="Job families" className="lg:sticky lg:top-20 lg:self-start" data-tour="book-index">
            <div className="lg:hidden">
              <label htmlFor="family-select" className="sr-only">
                Job family
              </label>
              <select id="family-select" value={selectedFamilyId ?? ''} onChange={e => openFamily(e.target.value || null)} className="input select">
                <option value="">All families</option>
                {FAMILIAS_DATA.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} ({f.especialidades.length})
                  </option>
                ))}
              </select>
            </div>

            <ol className="hidden lg:block">
              <li>
                <button
                  type="button"
                  aria-current={selectedFamilyId === null ? 'page' : undefined}
                  onClick={() => openFamily(null)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm font-semibold text-ink hover:bg-well aria-[current=page]:bg-brand-wash aria-[current=page]:text-brand-ink"
                >
                  All families
                  <span className="text-xs tabular-nums text-ink-3">{FAMILIAS_DATA.length}</span>
                </button>
              </li>
              <li aria-hidden="true" className="my-1.5 border-t border-rule" />
              {FAMILIAS_DATA.map(fam => (
                <li key={fam.id}>
                  <button
                    type="button"
                    aria-current={selectedFamilyId === fam.id ? 'page' : undefined}
                    onClick={() => openFamily(fam.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-ink-2 hover:bg-well hover:text-ink aria-[current=page]:bg-brand-wash aria-[current=page]:font-semibold aria-[current=page]:text-brand-ink"
                  >
                    <span className="truncate">{fam.nombre}</span>
                    <span className="text-xs tabular-nums text-ink-3">{fam.especialidades.length}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {/* Page */}
          {!currentFamily ? (
            <section aria-labelledby="families-heading" data-tour="book-page">
              <h2 id="families-heading" className="sr-only">
                All families
              </h2>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {FAMILIAS_DATA.map(family => {
                  const candidateCount = countForFamily(family);
                  return (
                    <li key={family.id}>
                      <button
                        type="button"
                        onClick={() => openFamily(family.id)}
                        className="panel group flex h-full w-full flex-col p-5 text-left transition-[border-color] duration-150 hover:border-brand focus-visible:border-brand"
                      >
                        <span className="code text-xs text-ink-3" translate="no">
                          {family.id}
                        </span>
                        <span className="mt-1 text-lg font-semibold leading-snug text-ink group-hover:text-brand-ink">{family.nombre}</span>
                        <span className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-2">{family.descripcionBreve}</span>
                        <span className="mt-auto flex items-center justify-between pt-4 text-[13px] tabular-nums text-ink-3">
                          <span>{plural(family.especialidades.length, 'specialty', 'specialties')}</span>
                          <span className={candidateCount > 0 ? 'font-medium text-ink' : ''}>
                            {candidateCount > 0 ? plural(candidateCount, 'candidate') : 'Sourced on demand'}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <FamilyPage family={currentFamily} onOpenSpecialty={setActiveSheet} onNavigateToCandidates={onNavigateToCandidates} />
          )}
        </div>
      ) : (
        <Outline expandedFamilies={expandedFamilies} onToggleFamily={toggleFamily} onOpenSpecialty={setActiveSheet} onNavigateToCandidates={onNavigateToCandidates} />
      )}

      {activeSheet && (
        <SpecialtySheet
          specialty={activeSheet}
          onClose={() => setActiveSheet(null)}
          onViewCandidates={() => {
            const s = activeSheet;
            setActiveSheet(null);
            onNavigateToCandidates(toCandidates(s));
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Browse: the open family's page                                       */
/* ------------------------------------------------------------------ */
interface FamilyPageProps {
  family: FamiliaOcupacional;
  onOpenSpecialty: (s: EspecialidadBook) => void;
  onNavigateToCandidates: (f?: NavigateFilter) => void;
}

const FamilyPage: React.FC<FamilyPageProps> = ({ family, onOpenSpecialty, onNavigateToCandidates }) => {
  const candidateCount = countForFamily(family);

  return (
    <article aria-labelledby={`family-${family.id}`} className="min-w-0" data-tour="book-page">
      <header className="border-b border-rule pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <span className="code text-[13px] text-ink-3" translate="no">
              {family.id}
            </span>
            <h2 id={`family-${family.id}`} className="mt-0.5 text-2xl font-semibold leading-tight">
              {family.nombre}
            </h2>
            <p className="mt-2 max-w-[64ch] text-[15px] leading-relaxed text-ink-2">{family.descripcionBreve}</p>
            <p className="mt-2 text-[13px] tabular-nums text-ink-3">
              {plural(family.especialidades.length, 'specialty', 'specialties')},{' '}
              {candidateCount > 0 ? `${plural(candidateCount, 'candidate')} in the pool` : 'candidates sourced on demand'}
            </p>
          </div>
          <Button variant="primary" icon={<Users className="size-4" />} onClick={() => onNavigateToCandidates({ familia: family.nombre })} className="shrink-0">
            View candidates ({candidateCount})
          </Button>
        </div>
      </header>

      <ul className="space-y-2 pt-6">
        {specialtiesOf(family).map(specialty => (
          <li key={specialty.key}>
            <SpecialtyRow
              specialty={specialty}
              candidateCount={countForSpecialty(specialty)}
              onOpenDetail={() => onOpenSpecialty(specialty)}
              onViewCandidates={() => onNavigateToCandidates(toCandidates(specialty))}
            />
          </li>
        ))}
      </ul>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Outline: every family, collapsible                                   */
/* ------------------------------------------------------------------ */
interface OutlineProps {
  expandedFamilies: Record<string, boolean>;
  onToggleFamily: (id: string) => void;
  onOpenSpecialty: (s: EspecialidadBook) => void;
  onNavigateToCandidates: (f?: NavigateFilter) => void;
}

const Outline: React.FC<OutlineProps> = ({ expandedFamilies, onToggleFamily, onOpenSpecialty, onNavigateToCandidates }) => (
  <div className="panel divide-y divide-rule">
    {FAMILIAS_DATA.map(family => {
      const isOpen = Boolean(expandedFamilies[family.id]);
      const candidateCount = countForFamily(family);
      const panelId = `outline-${family.id}`;

      return (
        <section key={family.id} aria-labelledby={`outline-h-${family.id}`}>
          <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
            <h2 id={`outline-h-${family.id}`} className="min-w-0 flex-1">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggleFamily(family.id)}
                className="flex w-full items-center gap-2.5 rounded-md py-1 text-left hover:text-brand-ink"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-sm text-ink-3">
                  {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </span>
                <span className="truncate text-base font-semibold text-ink">{family.nombre}</span>
                <span className="hidden text-[13px] tabular-nums text-ink-3 sm:inline">{plural(family.especialidades.length, 'specialty', 'specialties')}</span>
              </button>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateToCandidates({ familia: family.nombre })}
              className="shrink-0 text-[13px] font-medium tabular-nums text-brand-ink hover:underline"
            >
              {plural(candidateCount, 'candidate')}
            </button>
          </div>

          {isOpen && (
            <ul id={panelId} className="space-y-1 border-t border-rule bg-paper/60 px-3 py-3 sm:px-4">
              {specialtiesOf(family).map(specialty => {
                const specCount = countForSpecialty(specialty);
                return (
                  <li key={specialty.key} className="ml-3 flex items-center gap-2 border-l-2 border-mark-cyan/60 py-1 pl-3 sm:ml-6">
                    <button
                      type="button"
                      onClick={() => onOpenSpecialty(specialty)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink hover:text-brand-ink hover:underline"
                    >
                      {specialty.nombre}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToCandidates(toCandidates(specialty))}
                      className="shrink-0 text-[13px] text-ink-2 hover:text-brand-ink hover:underline"
                    >
                      {specCount > 0 ? `${specCount} in pool` : 'On demand'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* Specialty row (browse) and card (search results)                     */
/* ------------------------------------------------------------------ */
interface SpecialtyItemProps {
  specialty: EspecialidadBook;
  candidateCount: number;
  onOpenDetail: () => void;
  onViewCandidates: () => void;
}

const SkillsInline: React.FC<{ skills: string[]; max?: number }> = ({ skills, max = 5 }) => (
  <p className="text-[13px] text-ink-3">
    {skills.slice(0, max).join(', ')}
    {skills.length > max && <span> and {skills.length - max} more</span>}
  </p>
);

/** Role titles a specialty covers, as reference text; only shown when there is more than one. */
const RolesInline: React.FC<{ specialty: EspecialidadBook }> = ({ specialty }) =>
  specialty.roles.length > 1 ? (
    <p className="text-[13px] text-ink-2">
      <span className="text-ink-3">Covers:</span> {specialty.roles.map(r => r.nombre).join(', ')}
    </p>
  ) : null;

const SpecialtyRow: React.FC<SpecialtyItemProps> = ({ specialty, candidateCount, onOpenDetail, onViewCandidates }) => (
  <div className="panel relative flex flex-col gap-3 p-4 transition-[border-color] duration-150 hover:border-rule-strong focus-within:border-brand sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1 space-y-1.5">
      <h3 className="text-[15px] font-semibold leading-snug">
        <button type="button" onClick={onOpenDetail} className="stretch text-left text-ink hover:text-brand-ink focus-visible:outline-none">
          {specialty.nombre}
        </button>
      </h3>
      <p className="line-clamp-2 max-w-[80ch] text-[13px] leading-relaxed text-ink-2">{specialty.descripcion}</p>
      <RolesInline specialty={specialty} />
      <SkillsInline skills={specialty.habilidades} />
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
      <Button size="sm" variant={candidateCount > 0 ? 'subtle' : 'ghost'} icon={<Users className="size-4" />} className="above" onClick={onViewCandidates}>
        {candidateCount > 0 ? plural(candidateCount, 'candidate') : 'On demand'}
      </Button>
    </div>
  </div>
);

const SpecialtyCard: React.FC<SpecialtyItemProps> = ({ specialty, candidateCount, onOpenDetail, onViewCandidates }) => (
  <div className="panel relative flex h-full flex-col p-5 transition-[border-color] duration-150 hover:border-rule-strong focus-within:border-brand">
    <p className="text-[13px] text-ink-3">{specialty.familia}</p>
    <h3 className="mt-1 text-base font-semibold leading-snug">
      <button type="button" onClick={onOpenDetail} className="stretch text-left text-ink hover:text-brand-ink focus-visible:outline-none">
        {specialty.nombre}
      </button>
    </h3>
    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-2">{specialty.descripcion}</p>
    <div className="mt-2 space-y-1">
      <RolesInline specialty={specialty} />
      <SkillsInline skills={specialty.habilidades} max={4} />
    </div>
    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
      <button type="button" onClick={onOpenDetail} className="above inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-brand-ink">
        <FileText className="size-4" />
        Specialty sheet
      </button>
      <Button size="sm" variant={candidateCount > 0 ? 'subtle' : 'ghost'} icon={<Users className="size-4" />} className="above" onClick={onViewCandidates}>
        {candidateCount > 0 ? plural(candidateCount, 'candidate') : 'On demand'}
      </Button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Specialty sheet                                                      */
/* ------------------------------------------------------------------ */
const SpecialtySheet: React.FC<{ specialty: EspecialidadBook; onClose: () => void; onViewCandidates: () => void }> = ({ specialty, onClose, onViewCandidates }) => {
  const count = countForSpecialty(specialty);
  return (
    <Modal
      size="lg"
      context={specialty.familia}
      title={specialty.nombre}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-[13px] tabular-nums text-ink-2">
            {count > 0 ? `${plural(count, 'candidate')} in the pool` : 'No candidates in the pool yet; sourced on demand'}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={<Users className="size-4" />} onClick={onViewCandidates}>
            View candidates
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        {specialty.roles.length > 1 ? (
          <section>
            <h3 className="mb-2 text-base font-semibold">Roles it covers</h3>
            <ul className="space-y-2.5">
              {specialty.roles.map(role => (
                <li key={role.nombre}>
                  <p className="font-medium text-ink">{role.nombre}</p>
                  <p className="text-[13px] leading-relaxed text-ink-2">{role.descripcion}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="max-w-[70ch] text-[15px] leading-relaxed text-ink-2">{specialty.descripcion}</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
              <Check className="size-4 text-ok" />
              In scope
            </h3>
            <ul className="space-y-1.5 text-ink-2">
              {specialty.criteriosInclusion.map(c => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
              <Minus className="size-4 text-accent" />
              Not in scope
            </h3>
            <ul className="space-y-1.5 text-ink-2">
              {specialty.criteriosExclusion.map(c => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h3 className="mb-2 text-base font-semibold">Key skills</h3>
          <ul className="flex flex-wrap gap-1.5">
            {specialty.habilidades.map(skill => (
              <li key={skill} className="chip chip-neutral">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[13px] text-ink-3">Benchmarked against {plural(specialty.vacantesRespaldo, 'past vacancy', 'past vacancies')}.</p>
      </div>
    </Modal>
  );
};
