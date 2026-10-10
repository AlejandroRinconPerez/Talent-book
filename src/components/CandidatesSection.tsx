import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Users, 
  MapPin, 
  Globe, 
  Briefcase, 
  Check, 
  X, 
  Search, 
  ChevronDown, 
  ArrowRight, 
  Eye, 
  Calendar, 
  Building, 
  GraduationCap, 
  Award,
  FolderPlus,
  LayoutGrid,
  List
} from 'lucide-react';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILIAS_DATA, ALL_PROFILES } from '../data/bookData';
import { Candidato, NivelIngles, PerfilOcupacional, BusquedaComercial } from '../types';
import { LinkToBusquedaSelectorModal } from './LinkToBusquedaSelectorModal';

interface CandidatesSectionProps {
  initialFilter?: {
    familia?: string;
    especialidad?: string;
    perfilId?: string;
  };
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
  // Linking modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [candidatesToLink, setCandidatesToLink] = useState<string[]>([]);
  const [toolbarTargetBusquedaId, setToolbarTargetBusquedaId] = useState<string>('');
  const [linkSuccessToast, setLinkSuccessToast] = useState<string | null>(null);

  // Layout Display Mode: 'cards' by default as requested by user
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

  // Cascading Filter States
  const [selectedFamily, setSelectedFamily] = useState<string>(initialFilter?.familia || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialFilter?.especialidad || '');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialFilter?.perfilId || '');

  // Additional Filter States
  const [experienceRange, setExperienceRange] = useState<string>('all'); // 'all', '1-2', '3-5', '6+'
  const [selectedEnglish, setSelectedEnglish] = useState<string>('all');
  
  // Países como multi-selección con chips/pills (requisito del usuario)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [keywordSearch, setKeywordSearch] = useState<string>('');

  // Candidate Detail Drawer / Modal
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  // Sync initialFilter when changed externally
  useEffect(() => {
    if (initialFilter?.familia) setSelectedFamily(initialFilter.familia);
    if (initialFilter?.especialidad) setSelectedSpecialty(initialFilter.especialidad);
    if (initialFilter?.perfilId) setSelectedProfileId(initialFilter.perfilId);
  }, [initialFilter]);

  // Available Specialties depending on Selected Family
  const availableSpecialties = useMemo(() => {
    if (!selectedFamily) return [];
    const fam = FAMILIAS_DATA.find(f => f.nombre === selectedFamily);
    return fam ? fam.especialidades : [];
  }, [selectedFamily]);

  // Available Profiles depending on Selected Specialty and Family
  const availableProfiles = useMemo(() => {
    if (!selectedFamily) return [];
    const fam = FAMILIAS_DATA.find(f => f.nombre === selectedFamily);
    if (!fam) return [];

    if (selectedSpecialty) {
      const spec = fam.especialidades.find(s => s.nombre === selectedSpecialty);
      return spec ? spec.perfiles : [];
    }
    return fam.especialidades.flatMap(s => s.perfiles);
  }, [selectedFamily, selectedSpecialty]);

  // Reset dependent filters when family changes
  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFamily = e.target.value;
    setSelectedFamily(newFamily);
    setSelectedSpecialty('');
    setSelectedProfileId('');
  };

  // Reset dependent profile when specialty changes
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpec = e.target.value;
    setSelectedSpecialty(newSpec);
    setSelectedProfileId('');
  };

  // Unique locations (countries)
  const allUniqueCountries = useMemo(() => {
    const set = new Set<string>();
    MOCK_CANDIDATES.forEach(c => set.add(c.pais));
    return Array.from(set).sort();
  }, []);

  // Toggle country filter pill
  const toggleCountryFilter = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  // Filter application (a candidate appears ONCE)
  const filteredCandidates = useMemo(() => {
    return MOCK_CANDIDATES.filter((candidate) => {
      // 1. Keyword search (ID, summary, skills, location)
      if (keywordSearch.trim()) {
        const term = keywordSearch.toLowerCase();
        const matchesTerm =
          candidate.id.toLowerCase().includes(term) ||
          candidate.resumenProfesional.toLowerCase().includes(term) ||
          candidate.habilidades.some(h => h.toLowerCase().includes(term)) ||
          candidate.ciudad.toLowerCase().includes(term) ||
          candidate.pais.toLowerCase().includes(term);
        if (!matchesTerm) return false;
      }

      // 2. Profile Hierarchy Filter
      if (selectedProfileId) {
        if (!candidate.perfilesAsociados.includes(selectedProfileId)) return false;
      } else if (selectedSpecialty && selectedFamily) {
        const specProfileIds = availableProfiles.map(p => p.id);
        const matchesSpec = candidate.perfilesAsociados.some(id => specProfileIds.includes(id));
        if (!matchesSpec) return false;
      } else if (selectedFamily) {
        const famProfileIds = availableProfiles.map(p => p.id);
        const matchesFam = candidate.perfilesAsociados.some(id => famProfileIds.includes(id));
        if (!matchesFam) return false;
      }

      // 3. Experience Range
      if (experienceRange !== 'all') {
        if (experienceRange === '1-2' && (candidate.experienciaAnos < 1 || candidate.experienciaAnos > 2)) return false;
        if (experienceRange === '3-5' && (candidate.experienciaAnos < 3 || candidate.experienciaAnos > 5)) return false;
        if (experienceRange === '6+' && candidate.experienciaAnos < 6) return false;
      }

      // 4. English Level
      if (selectedEnglish !== 'all') {
        if (selectedEnglish === 'sin_info' && candidate.nivelIngles !== 'Sin información') return false;
        if (selectedEnglish !== 'sin_info' && candidate.nivelIngles !== selectedEnglish) return false;
      }

      // 5. Countries Multi-select (chips)
      if (selectedCountries.length > 0) {
        if (!selectedCountries.includes(candidate.pais)) return false;
      }

      return true;
    });
  }, [
    keywordSearch,
    selectedFamily,
    selectedSpecialty,
    selectedProfileId,
    availableProfiles,
    experienceRange,
    selectedEnglish,
    selectedCountries
  ]);

  // Clear all filters handler
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
    Boolean(selectedFamily) || 
    Boolean(selectedSpecialty) || 
    Boolean(selectedProfileId) || 
    experienceRange !== 'all' || 
    selectedEnglish !== 'all' || 
    selectedCountries.length > 0 ||
    Boolean(keywordSearch);

  // Helper to get profile name from ID
  const getProfileName = (id: string) => {
    const found = ALL_PROFILES.find(p => p.id === id);
    return found ? found.nombre : id;
  };

  return (
    <div className="space-y-6">
      {/* Top Context & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Candidate Directory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Filter pre-classified talent across occupational profiles. Taxonomy organizes talent; fit is evaluated against specific vacancy requirements.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={keywordSearch}
            onChange={(e) => setKeywordSearch(e.target.value)}
            placeholder="Search by ID, city, country, skill..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]"
          />
          {keywordSearch && (
            <button
              onClick={() => setKeywordSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Panel (1 Column) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 lg:sticky lg:top-20 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#007685]" />
              Progressive Filters
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="text-[11px] font-semibold text-[#007685] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* 1. Cascading Profile Filters */}
          <div className={`space-y-3 p-3 rounded-xl transition-all ${
            selectedFamily 
              ? 'bg-[#007685]/[0.05] border-2 border-[#007685] ring-2 ring-[#007685]/20 shadow-xs' 
              : 'border border-slate-200/60 bg-slate-50/50'
          }`}>
            {selectedFamily && (
              <div className="flex items-center justify-between text-[11px] font-bold text-[#007685] bg-[#007685]/10 px-2 py-1 rounded-md">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#007685]" />
                  Active Category Filter
                </span>
                <span className="truncate max-w-[130px] font-mono text-[10px]">{selectedFamily}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Job Family
              </label>
              <select
                value={selectedFamily}
                onChange={handleFamilyChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]"
              >
                <option value="">All families</option>
                {FAMILIAS_DATA.map(f => (
                  <option key={f.id} value={f.nombre}>{f.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Subcategory
              </label>
              <select
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                disabled={!selectedFamily}
                className={`w-full border rounded-lg py-1.5 px-2.5 text-xs transition-colors ${
                  selectedFamily 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value="">
                  {selectedFamily ? 'All subcategories' : 'Select a family first'}
                </option>
                {availableSpecialties.map(s => (
                  <option key={s.nombre} value={s.nombre}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Occupational Profile
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                disabled={!selectedFamily}
                className={`w-full border rounded-lg py-1.5 px-2.5 text-xs transition-colors ${
                  selectedFamily 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <option value="">
                  {selectedFamily ? 'All available profiles' : 'Select a family first'}
                </option>
                {availableProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3.5">
            {/* 2. Experience Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevant Experience
              </label>
              <select
                value={experienceRange}
                onChange={(e) => setExperienceRange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]"
              >
                <option value="all">Any experience</option>
                <option value="1-2">1 to 2 years</option>
                <option value="3-5">3 to 5 years</option>
                <option value="6+">6+ years</option>
              </select>
            </div>

            {/* 3. English Level Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                English Proficiency
              </label>
              <select
                value={selectedEnglish}
                onChange={(e) => setSelectedEnglish(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#007685]/30 focus:border-[#007685]"
              >
                <option value="all">All proficiency levels</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Professional Advanced</option>
                <option value="C2">C2 - Bilingual / Native</option>
                <option value="sin_info">Not specified</option>
              </select>
            </div>
          </div>

          {/* 4. Países Multi-select con pills (Reemplaza a habilidades como requested) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#007685]" />
                <span>Countries (Multi-select)</span>
              </label>
              {selectedCountries.length > 0 && (
                <button
                  onClick={() => setSelectedCountries([])}
                  className="text-[10px] text-slate-500 hover:text-[#007685] font-semibold"
                >
                  Clear ({selectedCountries.length})
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Click one or multiple countries to filter simultaneously:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {allUniqueCountries.map(country => {
                const isSelected = selectedCountries.includes(country);
                const count = MOCK_CANDIDATES.filter(c => c.pais === country).length;

                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleCountryFilter(country)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center font-medium cursor-pointer ${
                      isSelected
                        ? 'bg-[#007685] text-white shadow-xs font-semibold'
                        : 'bg-[#F5F5F6] hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{country}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Candidate Results Area (3 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Filter Chips & Counter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {filteredCandidates.length}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {filteredCandidates.length === 1 ? 'unique candidate found' : 'unique candidates found'}
              </span>
            </div>

            {/* Quick Actions & Layout Switcher */}
            <div className="flex items-center gap-3 text-xs">
              {/* Cards vs Table View Switcher */}
              <div className="flex items-center gap-1 bg-[#F5F5F6] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDisplayMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    displayMode === 'cards'
                      ? 'bg-white text-[#007685] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Card View (Default)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#007685]" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    displayMode === 'table'
                      ? 'bg-white text-[#007685] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Table Comparison View"
                >
                  <List className="w-3.5 h-3.5 text-[#007685]" />
                  <span>Table</span>
                </button>
              </div>

              <span className="text-slate-300">|</span>

              <button
                onClick={() => {
                  const allVisibleIds = filteredCandidates.map(c => c.id);
                  const allSelected = allVisibleIds.every(id => selectedCandidateIds.includes(id));
                  if (allSelected) {
                    allVisibleIds.forEach(id => {
                      if (selectedCandidateIds.includes(id)) onToggleCandidate(id);
                    });
                  } else {
                    allVisibleIds.forEach(id => {
                      if (!selectedCandidateIds.includes(id)) onToggleCandidate(id);
                    });
                  }
                }}
                className="font-medium text-slate-700 hover:text-[#007685] hover:underline"
              >
                {filteredCandidates.every(c => selectedCandidateIds.includes(c.id)) && filteredCandidates.length > 0
                  ? 'Deselect visible'
                  : 'Select visible'}
              </button>

              {selectedCandidateIds.length > 0 && (
                <button
                  onClick={onClearSelection}
                  className="font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear selection ({selectedCandidateIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Candidates Comparison: Cards View vs Table View */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No candidates found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No profiles match the selected criteria. Try adjusting experience, countries, or clearing filters.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset all filters
              </button>
            </div>
          ) : displayMode === 'cards' ? (
            /* ========================================================================= */
            /* VISTA EN TARJETAS (CARDS) - PREDETERMINADA                                */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidateIds.includes(candidate.id);

                return (
                  <div
                    key={candidate.id}
                    onClick={() => onToggleCandidate(candidate.id)}
                    className={`bg-white border rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-[#007685] ring-2 ring-[#007685]/20 bg-[#007685]/[0.02]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Card Header: Checkbox, Code, Badges */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              onToggleCandidate(candidate.id);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#007685] focus:ring-[#007685] cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900 group-hover:text-[#007685] transition-colors leading-tight">
                              {candidate.nombre}
                            </div>
                            <span className="font-mono font-bold text-[10px] text-[#007685] bg-[#007685]/8 border border-[#007685]/20 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              {candidate.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {candidate.experienciaTexto}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                            candidate.nivelIngles === 'C1' || candidate.nivelIngles === 'C2'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : candidate.nivelIngles === 'B2'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            English: {candidate.nivelIngles}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F5F6] text-slate-600 border border-slate-200">
                            {candidate.modalidad}
                          </span>
                        </div>
                      </div>

                      {/* Location & Associated Profiles */}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 gap-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#007685] shrink-0" />
                          <span className="truncate">{candidate.ciudad}, {candidate.pais}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                          {candidate.perfilesAsociados.map(pId => (
                            <span
                              key={pId}
                              className="text-[10px] font-medium bg-[#007685]/8 text-[#007685] border border-[#007685]/15 px-2 py-0.5 rounded truncate max-w-[150px]"
                              title={getProfileName(pId)}
                            >
                              {getProfileName(pId)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="mt-3 text-xs text-slate-700 line-clamp-3 leading-relaxed">
                        {candidate.resumenProfesional}
                      </p>

                      {/* Country Pill (Reemplaza habilidades como solicitado) */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Country:
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#007685]/10 text-[#007685] border border-[#007685]/20">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{candidate.pais}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {candidate.ciudad}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCandidateDetail(candidate);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#007685] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidatesToLink([candidate.id]);
                          setIsLinkModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#007685] bg-[#007685]/10 hover:bg-[#007685]/20 border border-[#007685]/20 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Add to search</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================================================= */
            /* VISTA EN TABLA                                                            */
            /* ========================================================================= */
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Associated Profiles</th>
                      <th className="py-3 px-4 text-center">Exp.</th>
                      <th className="py-3 px-4 text-center">English</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCandidates.map((candidate) => {
                      const isSelected = selectedCandidateIds.includes(candidate.id);
                      return (
                        <tr
                          key={candidate.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-[#007685]/[0.04] font-medium' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleCandidate(candidate.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#007685] focus:ring-[#007685] cursor-pointer"
                              aria-label={`Select candidate ${candidate.id}`}
                            />
                          </td>

                          {/* Candidate Name & Code */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{candidate.nombre}</div>
                            <div className="font-mono text-[10px] text-[#007685]">{candidate.id}</div>
                          </td>

                          {/* Associated Profiles */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {candidate.perfilesAsociados.map(pId => (
                                <span
                                  key={pId}
                                  className="text-[11px] font-medium bg-[#007685]/8 text-[#007685] border border-[#007685]/15 px-2 py-0.5 rounded"
                                >
                                  {getProfileName(pId)}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Relevant Experience */}
                          <td className="py-3 px-4 text-center tabular-nums text-slate-700 font-medium">
                            {candidate.experienciaTexto}
                          </td>

                          {/* English Level */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                              candidate.nivelIngles === 'C1' || candidate.nivelIngles === 'C2'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : candidate.nivelIngles === 'B2'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {candidate.nivelIngles}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="py-3 px-4 text-slate-600">
                            <div>{candidate.ciudad}, {candidate.pais}</div>
                            <div className="text-[10px] text-slate-400">{candidate.modalidad}</div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActiveCandidateDetail(candidate)}
                                className="text-xs font-semibold text-[#007685] hover:text-[#005d69] hover:underline inline-flex items-center gap-1"
                              >
                                View profile
                              </button>

                              <button
                                onClick={() => {
                                  setCandidatesToLink([candidate.id]);
                                  setIsLinkModalOpen(true);
                                }}
                                className="text-xs font-semibold text-slate-600 hover:text-[#007685] hover:bg-[#007685]/10 px-2 py-1 rounded transition-colors inline-flex items-center gap-1"
                                title="Add candidate to commercial search"
                              >
                                <FolderPlus className="w-3.5 h-3.5 text-[#007685]" />
                                <span className="hidden sm:inline">To search</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sticky Selection Summary Toolbar: Associate Candidates to a Commercial Search */}
          {selectedCandidateIds.length > 0 && (
            <div className="sticky bottom-4 z-30 bg-[#005d69] text-white p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200 border-2 border-[#20BFD0]/30 ring-4 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#007685] flex items-center justify-center font-mono font-black text-base shadow-xs shrink-0">
                  {selectedCandidateIds.length}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedCandidateIds.length === 1 ? '1 candidate selected' : `${selectedCandidateIds.length} candidates selected`}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-[#20BFD0] font-semibold text-xs">Associate to Commercial Search</span>
                  </div>
                  <div className="text-xs text-white/80 mt-0.5">
                    Select a client search below to link these candidates and manage them in your pipeline:
                  </div>
                </div>
              </div>

              {/* Search Selection & Action Controls */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                {/* Search Dropdown Selector */}
                <div className="min-w-[220px] flex-1 sm:flex-initial">
                  <select
                    value={toolbarTargetBusquedaId}
                    onChange={(e) => setToolbarTargetBusquedaId(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#20BFD0] shadow-xs cursor-pointer"
                  >
                    <option value="">Select target search to link...</option>
                    {busquedas.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} {b.clienteEmpresa ? `(${b.clienteEmpresa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (toolbarTargetBusquedaId) {
                      onLinkCandidatesToBusqueda(toolbarTargetBusquedaId, selectedCandidateIds);
                      const targetB = busquedas.find(b => b.id === toolbarTargetBusquedaId);
                      setLinkSuccessToast(`Linked ${selectedCandidateIds.length} candidate${selectedCandidateIds.length > 1 ? 's' : ''} to "${targetB?.nombre || 'Search'}"`);
                      setTimeout(() => setLinkSuccessToast(null), 4000);
                    } else {
                      setCandidatesToLink(selectedCandidateIds);
                      setIsLinkModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-teal-950 bg-[#20BFD0] hover:bg-[#1bb0c0] rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>
                    {toolbarTargetBusquedaId ? 'Associate to Search' : 'Choose Search & Link'}
                  </span>
                </button>

                {/* New Search Button */}
                <button
                  type="button"
                  onClick={onRequestCreateBusqueda}
                  className="px-3 py-2 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors shrink-0"
                  title="Create a new commercial search"
                >
                  + New Search
                </button>

                {/* Evaluate Fit Button */}
                <button
                  type="button"
                  onClick={onProceedToEvaluate}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#EE7825] hover:bg-[#d96717] rounded-xl transition-colors flex items-center gap-1 shadow-xs shrink-0"
                  title="Run compatibility evaluation"
                >
                  <span>Evaluate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Clear Selection */}
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="px-2.5 py-2 text-xs text-white/70 hover:text-white rounded-xl transition-colors shrink-0"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {linkSuccessToast && (
            <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Check className="w-4 h-4 text-white" />
              <span>{linkSuccessToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal / Drawer */}
      {activeCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-[#007685] bg-[#007685]/10 px-2.5 py-0.5 rounded">
                    {activeCandidateDetail.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeCandidateDetail.ciudad}, {activeCandidateDetail.pais} · {activeCandidateDetail.modalidad}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeCandidateDetail.nombre}
                </h2>
              </div>
              <button
                onClick={() => setActiveCandidateDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 overflow-y-auto space-y-6 text-sm flex-1 pr-1">
              {/* Summary */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Professional Summary
                </h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {activeCandidateDetail.resumenProfesional}
                </p>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F5F5F6] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Relevant experience</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCandidateDetail.experienciaTexto}</span>
                </div>
                <div className="bg-[#F5F5F6] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">English level</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCandidateDetail.nivelIngles}</span>
                </div>
                <div className="bg-[#F5F5F6] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Modality</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCandidateDetail.modalidad}</span>
                </div>
                <div className="bg-[#F5F5F6] p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Availability</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCandidateDetail.disponibilidad}</span>
                </div>
              </div>

              {/* Key Competencies */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Key Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeCandidateDetail.competenciasClave.map((comp) => (
                    <span
                      key={comp}
                      className="px-2.5 py-1 text-xs font-semibold text-[#007685] bg-[#007685]/10 rounded-md border border-[#007685]/20"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trajectory */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Recent Career History
                </h3>
                <div className="space-y-3">
                  {activeCandidateDetail.trayectoria.map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className="font-bold text-slate-900 text-sm">{item.cargo}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{item.duracion}</span>
                      </div>
                      <div className="text-xs font-medium text-[#007685] mt-0.5">
                        {item.sectorEmpresa}
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        {item.logros.map((logro, lIdx) => (
                          <li key={lIdx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 mt-1">•</span>
                            <span>{logro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setActiveCandidateDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  onToggleCandidate(activeCandidateDetail.id);
                  setActiveCandidateDetail(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectedCandidateIds.includes(activeCandidateDetail.id)
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-[#007685] text-white hover:bg-[#005d69] shadow-xs'
                }`}
              >
                {selectedCandidateIds.includes(activeCandidateDetail.id) ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Remove from selection</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Select for evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link to Search Selector Modal */}
      {isLinkModalOpen && (
        <LinkToBusquedaSelectorModal
          candidateIds={candidatesToLink}
          busquedas={busquedas}
          onClose={() => setIsLinkModalOpen(false)}
          onLinkToExistingBusqueda={(busquedaId, ids) => {
            onLinkCandidatesToBusqueda(busquedaId, ids);
          }}
          onRequestCreateNewBusqueda={() => {
            onRequestCreateBusqueda();
          }}
        />
      )}
    </div>
  );
};
