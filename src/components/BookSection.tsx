import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronDown, Users, X, FileText, LayoutList, ListTree, Check, Minus } from 'lucide-react';
import { FAMILIAS_DATA, ALL_PROFILES } from '../data/bookData';
import { CANDIDATE_COUNT_BY_FAMILY, CANDIDATE_COUNT_BY_SPECIALTY, CANDIDATE_IDS_BY_PROFILE, FAMILY_BY_ID } from '../data/indexes';
import { FamiliaOcupacional, PerfilOcupacional } from '../types';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Modal } from './ui/Modal';
import { plural } from '../utils/format';

type NavigateFilter = { familia?: string; especialidad?: string; perfilId?: string };

interface BookSectionProps {
  onNavigateToCandidates: (filterParams?: NavigateFilter) => void;
}

/* Candidate counts per taxonomy node, precomputed once in data/indexes */
const countForProfile = (profileId: string) => CANDIDATE_IDS_BY_PROFILE.get(profileId)?.length ?? 0;
const countForFamily = (family: FamiliaOcupacional) => CANDIDATE_COUNT_BY_FAMILY.get(family.id) ?? 0;
const countForSpecialty = (family: FamiliaOcupacional, specialtyName: string) => CANDIDATE_COUNT_BY_SPECIALTY.get(`${family.id}:${specialtyName}`) ?? 0;

/* Lower-cased searchable text per profile, built once instead of on every keystroke */
const PROFILE_SEARCH_TEXT: ReadonlyMap<string, string> = new Map(
  ALL_PROFILES.map(p => [p.id, [p.nombre, p.descripcion, p.especialidad, p.familia, p.id, ...p.habilidades].join('\n').toLowerCase()])
);

const profilesInFamily = (family: FamiliaOcupacional) => family.especialidades.reduce((acc, s) => acc + s.perfiles.length, 0);

/**
 * The Book reads like a reference book: a running index of families on the
 * left, the open family's page on the right. "Outline" shows every family
 * expanded for scanning the whole taxonomy at once.
 */
export const BookSection: React.FC<BookSectionProps> = ({ onNavigateToCandidates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'browse' | 'outline'>('browse');

  // Browse view: open family and specialty filter
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Outline view: expanded nodes. The first three families open by default.
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({ 'FAM-ADM': true, 'FAM-COB': true, 'FAM-FIN': true });
  const [expandedSpecialties, setExpandedSpecialties] = useState<Record<string, boolean>>({});

  const [activeProfileModal, setActiveProfileModal] = useState<PerfilOcupacional | null>(null);

  const totalSpecialties = useMemo(() => FAMILIAS_DATA.reduce((acc, f) => acc + f.especialidades.length, 0), []);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return ALL_PROFILES.filter(p => PROFILE_SEARCH_TEXT.get(p.id)!.includes(term));
  }, [searchTerm]);

  const currentFamily = selectedFamilyId ? (FAMILY_BY_ID.get(selectedFamilyId) ?? null) : null;

  const openFamily = (id: string | null) => {
    setSelectedFamilyId(id);
    setSelectedSpecialty(null);
    window.scrollTo({ top: 0 });
  };

  const toggleFamily = (familyId: string) => setExpandedFamilies(prev => ({ ...prev, [familyId]: !prev[familyId] }));
  const toggleSpecialty = (key: string) => setExpandedSpecialties(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));

  const handleExpandAll = () => {
    const fams: Record<string, boolean> = {};
    const specs: Record<string, boolean> = {};
    FAMILIAS_DATA.forEach(f => {
      fams[f.id] = true;
      f.especialidades.forEach(s => (specs[`${f.id}:${s.nombre}`] = true));
    });
    setExpandedFamilies(fams);
    setExpandedSpecialties(specs);
  };

  const handleCollapseAll = () => {
    setExpandedFamilies({});
    setExpandedSpecialties(Object.fromEntries(FAMILIAS_DATA.flatMap(f => f.especialidades.map(s => [`${f.id}:${s.nombre}`, false]))));
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Occupational profiles book</h1>
          <p className="page-lede">
            {FAMILIAS_DATA.length} job families, {totalSpecialties} specialties and {ALL_PROFILES.length} generic profiles. Each profile says
            what the role includes and excludes, so you can position candidates against the right benchmark.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-lg">
          <label htmlFor="book-search" className="sr-only">
            Search profiles
          </label>
          <Search className="input-icon" />
          <input
            id="book-search"
            type="search"
            name="profile-search"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search profiles by title, specialty or skill…"
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
              <button
                type="button"
                aria-pressed={viewMode === 'browse'}
                onClick={() => setViewMode('browse')}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-[13px] font-medium text-ink-2 hover:text-ink aria-pressed:bg-ink aria-pressed:text-white"
              >
                <LayoutList className="size-4" />
                Browse
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'outline'}
                onClick={() => setViewMode('outline')}
                className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-[13px] font-medium text-ink-2 hover:text-ink aria-pressed:bg-ink aria-pressed:text-white"
              >
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
            {plural(searchResults.length, 'profile')} for “{searchTerm}”
          </h2>
          {searchResults.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Search className="size-5" />}
                title="No profiles match"
                description="Try a role keyword such as “collections”, “payroll”, “developer” or “assistant”."
                action={<Button onClick={() => setSearchTerm('')}>Clear search</Button>}
              />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searchResults.map(profile => (
                <li key={profile.id}>
                  <ProfileCard
                    profile={profile}
                    showFamily
                    candidateCount={countForProfile(profile.id)}
                    onOpenDetail={() => setActiveProfileModal(profile)}
                    onViewCandidates={() => onNavigateToCandidates({ familia: profile.familia, especialidad: profile.especialidad, perfilId: profile.id })}
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
                    {f.nombre} ({profilesInFamily(f)})
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
                    <span className="text-xs tabular-nums text-ink-3">{profilesInFamily(fam)}</span>
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
                          <span>
                            {plural(family.especialidades.length, 'specialty', 'specialties')}, {plural(profilesInFamily(family), 'profile')}
                          </span>
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
            <FamilyPage
              family={currentFamily}
              selectedSpecialty={selectedSpecialty}
              onSelectSpecialty={setSelectedSpecialty}
              onOpenProfile={setActiveProfileModal}
              onNavigateToCandidates={onNavigateToCandidates}
            />
          )}
        </div>
      ) : (
        <Outline
          expandedFamilies={expandedFamilies}
          expandedSpecialties={expandedSpecialties}
          onToggleFamily={toggleFamily}
          onToggleSpecialty={toggleSpecialty}
          onOpenProfile={setActiveProfileModal}
          onNavigateToCandidates={onNavigateToCandidates}
        />
      )}

      {activeProfileModal && (
        <ProfileSheet
          profile={activeProfileModal}
          onClose={() => setActiveProfileModal(null)}
          onViewCandidates={() => {
            const prof = activeProfileModal;
            setActiveProfileModal(null);
            onNavigateToCandidates({ familia: prof.familia, especialidad: prof.especialidad, perfilId: prof.id });
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
  selectedSpecialty: string | null;
  onSelectSpecialty: (name: string | null) => void;
  onOpenProfile: (p: PerfilOcupacional) => void;
  onNavigateToCandidates: (f?: NavigateFilter) => void;
}

const FamilyPage: React.FC<FamilyPageProps> = ({ family, selectedSpecialty, onSelectSpecialty, onOpenProfile, onNavigateToCandidates }) => {
  const specialties = selectedSpecialty ? family.especialidades.filter(s => s.nombre === selectedSpecialty) : family.especialidades;
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
              {plural(family.especialidades.length, 'specialty', 'specialties')}, {plural(profilesInFamily(family), 'profile')},{' '}
              {candidateCount > 0 ? `${plural(candidateCount, 'candidate')} in the pool` : 'candidates sourced on demand'}
            </p>
          </div>
          <Button variant="primary" icon={<Users className="size-4" />} onClick={() => onNavigateToCandidates({ familia: family.nombre })} className="shrink-0">
            View candidates ({candidateCount})
          </Button>
        </div>

        {family.especialidades.length > 1 && (
          <fieldset className="mt-5 flex flex-wrap gap-1.5">
            <legend className="sr-only">Specialty</legend>
            <button type="button" className="pill" aria-pressed={selectedSpecialty === null} onClick={() => onSelectSpecialty(null)}>
              All <span className="pill-count">{profilesInFamily(family)}</span>
            </button>
            {family.especialidades.map(spec => (
              <button
                key={spec.nombre}
                type="button"
                className="pill"
                aria-pressed={selectedSpecialty === spec.nombre}
                onClick={() => onSelectSpecialty(selectedSpecialty === spec.nombre ? null : spec.nombre)}
              >
                {spec.nombre} <span className="pill-count">{spec.perfiles.length}</span>
              </button>
            ))}
          </fieldset>
        )}
      </header>

      <div className="divide-y divide-rule">
        {specialties.map(spec => {
          const specCount = countForSpecialty(family, spec.nombre);
          return (
            <section key={spec.nombre} aria-labelledby={`spec-${family.id}-${spec.nombre}`} className="py-6">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`spec-${family.id}-${spec.nombre}`} className="text-base font-semibold">
                  {spec.nombre} <span className="font-normal tabular-nums text-ink-3">({spec.perfiles.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateToCandidates({ familia: family.nombre, especialidad: spec.nombre })}
                  className="text-[13px] font-medium text-brand-ink hover:underline"
                >
                  {specCount > 0 ? `${plural(specCount, 'candidate')} in pool` : 'Sourced on demand'}
                </button>
              </div>
              <ul className="space-y-2">
                {spec.perfiles.map(profile => (
                  <li key={profile.id}>
                    <ProfileRow
                      profile={profile}
                      candidateCount={countForProfile(profile.id)}
                      onOpenDetail={() => onOpenProfile(profile)}
                      onViewCandidates={() => onNavigateToCandidates({ familia: profile.familia, especialidad: profile.especialidad, perfilId: profile.id })}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Outline: every family, collapsible                                   */
/* ------------------------------------------------------------------ */
interface OutlineProps {
  expandedFamilies: Record<string, boolean>;
  expandedSpecialties: Record<string, boolean>;
  onToggleFamily: (id: string) => void;
  onToggleSpecialty: (key: string) => void;
  onOpenProfile: (p: PerfilOcupacional) => void;
  onNavigateToCandidates: (f?: NavigateFilter) => void;
}

const Outline: React.FC<OutlineProps> = ({ expandedFamilies, expandedSpecialties, onToggleFamily, onToggleSpecialty, onOpenProfile, onNavigateToCandidates }) => (
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
                <span className="hidden text-[13px] tabular-nums text-ink-3 sm:inline">
                  {plural(family.especialidades.length, 'specialty', 'specialties')}, {plural(profilesInFamily(family), 'profile')}
                </span>
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
            <div id={panelId} className="border-t border-rule bg-paper/60 px-3 pb-3 sm:px-4">
              {family.especialidades.map(spec => {
                const key = `${family.id}:${spec.nombre}`;
                const specOpen = expandedSpecialties[key] ?? true;
                const specCount = countForSpecialty(family, spec.nombre);
                const specPanelId = `outline-${family.id}-${spec.nombre.replace(/\W+/g, '-')}`;

                return (
                  <div key={spec.nombre} className="ml-3 border-l-2 border-mark-cyan/60 pl-3 pt-3 sm:ml-6">
                    <div className="flex items-center gap-2">
                      <h3 className="min-w-0 flex-1">
                        <button
                          type="button"
                          aria-expanded={specOpen}
                          aria-controls={specPanelId}
                          onClick={() => onToggleSpecialty(key)}
                          className="flex w-full items-center gap-2 rounded-md py-0.5 text-left text-sm font-semibold text-ink hover:text-brand-ink"
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center text-ink-3">
                            {specOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          </span>
                          <span className="truncate">{spec.nombre}</span>
                          <span className="font-normal tabular-nums text-ink-3">({spec.perfiles.length})</span>
                        </button>
                      </h3>
                      <button
                        type="button"
                        onClick={() => onNavigateToCandidates({ familia: family.nombre, especialidad: spec.nombre })}
                        className="shrink-0 text-[13px] text-ink-2 hover:text-brand-ink hover:underline"
                      >
                        {specCount > 0 ? `${specCount} in pool` : 'On demand'}
                      </button>
                    </div>

                    {specOpen && (
                      <ul id={specPanelId} className="mt-2 space-y-2 pl-7">
                        {spec.perfiles.map(profile => (
                          <li key={profile.id}>
                            <ProfileRow
                              profile={profile}
                              candidateCount={countForProfile(profile.id)}
                              onOpenDetail={() => onOpenProfile(profile)}
                              onViewCandidates={() =>
                                onNavigateToCandidates({ familia: profile.familia, especialidad: profile.especialidad, perfilId: profile.id })
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* Profile row (browse/outline) and card (search results)              */
/* ------------------------------------------------------------------ */
interface ProfileItemProps {
  profile: PerfilOcupacional;
  candidateCount: number;
  onOpenDetail: () => void;
  onViewCandidates: () => void;
  showFamily?: boolean;
}

const SkillsInline: React.FC<{ skills: string[]; max?: number }> = ({ skills, max = 4 }) => (
  <p className="text-[13px] text-ink-3">
    {skills.slice(0, max).join(', ')}
    {skills.length > max && <span> and {skills.length - max} more</span>}
  </p>
);

const ProfileRow: React.FC<ProfileItemProps> = ({ profile, candidateCount, onOpenDetail, onViewCandidates }) => (
  <div className="panel relative flex flex-col gap-3 p-4 transition-[border-color] duration-150 hover:border-rule-strong focus-within:border-brand sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 flex-1">
      <h4 className="text-[15px] font-semibold leading-snug">
        <button type="button" onClick={onOpenDetail} className="stretch text-left text-ink hover:text-brand-ink focus-visible:outline-none">
          {profile.nombre}
        </button>
      </h4>
      <p className="mt-1 line-clamp-2 max-w-[80ch] text-[13px] leading-relaxed text-ink-2">{profile.descripcion}</p>
      <div className="mt-1.5">
        <SkillsInline skills={profile.habilidades} />
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
      <Button size="sm" variant={candidateCount > 0 ? 'subtle' : 'ghost'} icon={<Users className="size-4" />} className="above" onClick={onViewCandidates}>
        {candidateCount > 0 ? plural(candidateCount, 'candidate') : 'On demand'}
      </Button>
    </div>
  </div>
);

const ProfileCard: React.FC<ProfileItemProps> = ({ profile, candidateCount, onOpenDetail, onViewCandidates, showFamily }) => (
  <div className="panel relative flex h-full flex-col p-5 transition-[border-color] duration-150 hover:border-rule-strong focus-within:border-brand">
    {showFamily && (
      <p className="text-[13px] text-ink-3">
        {profile.familia} <span className="text-rule-strong">/</span> {profile.especialidad}
      </p>
    )}
    <h3 className="mt-1 text-base font-semibold leading-snug">
      <button type="button" onClick={onOpenDetail} className="stretch text-left text-ink hover:text-brand-ink focus-visible:outline-none">
        {profile.nombre}
      </button>
    </h3>
    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink-2">{profile.descripcion}</p>
    <div className="mt-2">
      <SkillsInline skills={profile.habilidades} />
    </div>
    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
      <button type="button" onClick={onOpenDetail} className="above inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-brand-ink">
        <FileText className="size-4" />
        Profile sheet
      </button>
      <Button size="sm" variant={candidateCount > 0 ? 'subtle' : 'ghost'} icon={<Users className="size-4" />} className="above" onClick={onViewCandidates}>
        {candidateCount > 0 ? plural(candidateCount, 'candidate') : 'On demand'}
      </Button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Profile sheet                                                        */
/* ------------------------------------------------------------------ */
const ProfileSheet: React.FC<{ profile: PerfilOcupacional; onClose: () => void; onViewCandidates: () => void }> = ({ profile, onClose, onViewCandidates }) => {
  const count = countForProfile(profile.id);
  return (
    <Modal
      size="lg"
      context={
        <>
          {profile.familia} <span className="text-rule-strong">/</span> {profile.especialidad}
        </>
      }
      title={profile.nombre}
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
        <p className="max-w-[70ch] text-[15px] leading-relaxed text-ink-2">{profile.descripcion}</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
              <Check className="size-4 text-ok" />
              The role includes
            </h3>
            <ul className="space-y-1.5 text-ink-2">
              {profile.criteriosInclusion.map(c => (
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
              {profile.criteriosExclusion.map(c => (
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
            {profile.habilidades.map(skill => (
              <li key={skill} className="chip chip-neutral">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[13px] text-ink-3">
          Benchmarked against {plural(profile.vacantesRespaldo.length, 'past vacancy', 'past vacancies')}. Profile ID{' '}
          <span className="code" translate="no">
            {profile.id}
          </span>
          .
        </p>
      </div>
    </Modal>
  );
};
