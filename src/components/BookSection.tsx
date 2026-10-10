import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  XCircle, 
  X, 
  Briefcase, 
  Lock, 
  ArrowRight,
  FolderTree,
  LayoutGrid,
  ListTree,
  Copy,
  Check,
  Folder,
  FolderOpen,
  FileText,
  Sparkles,
  Layers
} from 'lucide-react';
import { FAMILIAS_DATA, ALL_PROFILES } from '../data/bookData';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FamiliaOcupacional, PerfilOcupacional } from '../types';

interface BookSectionProps {
  onNavigateToCandidates: (filterParams?: {
    familia?: string;
    especialidad?: string;
    perfilId?: string;
  }) => void;
}

export const BookSection: React.FC<BookSectionProps> = ({ onNavigateToCandidates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // View mode: 'tree' (Árbol jerárquico), 'grid' (Cuadrícula de familias) - Default 'grid' as requested
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('grid');
  
  // Quick Category Filter for Tree: 'all' or family ID
  const [selectedCategoryPill, setSelectedCategoryPill] = useState<string>('all');

  // Expanded Tree state - First 3 families and their specialties open by default for immediate rich visual inspection
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({
    'FAM-ADM': true,
    'FAM-COB': true,
    'FAM-FIN': true,
    'FAM-TEC': false,
    'FAM-MKT': false,
    'FAM-LEG': false,
    'FAM-OPE': false,
    'FAM-OTR': false,
    'FAM-PRG': false,
    'FAM-SAL': false,
    'FAM-SER': false,
    'FAM-TAL': false
  });

  const [expandedSpecialties, setExpandedSpecialties] = useState<Record<string, boolean>>({
    'Personnel Administration': true,
    'Administrative Assistance': true,
    'Executive Assistance': false,
    'Collections & Portfolio': true,
    'Accounting & Monthly Closes': true,
    'FP&A & Financial Analysis': false
  });

  // Grid view navigation state
  const [gridSelectedFamilyId, setGridSelectedFamilyId] = useState<string | null>(null);
  const [gridSelectedSpecialtyName, setGridSelectedSpecialtyName] = useState<string | null>(null);

  // Active Profile Modal for detailed inspection
  const [activeProfileModal, setActiveProfileModal] = useState<PerfilOcupacional | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper counts
  const getCandidateCountForProfile = (profileId: string) => {
    return MOCK_CANDIDATES.filter(c => c.perfilesAsociados.includes(profileId)).length;
  };

  const getCandidateCountForFamily = (family: FamiliaOcupacional) => {
    const profileIds = family.especialidades.flatMap(s => s.perfiles.map(p => p.id));
    const uniqueCandidates = new Set(
      MOCK_CANDIDATES.filter(c => c.perfilesAsociados.some(id => profileIds.includes(id))).map(c => c.id)
    );
    return uniqueCandidates.size;
  };

  const getCandidateCountForSpecialty = (family: FamiliaOcupacional, specialtyName: string) => {
    const spec = family.especialidades.find(s => s.nombre === specialtyName);
    if (!spec) return 0;
    const profileIds = spec.perfiles.map(p => p.id);
    const uniqueCandidates = new Set(
      MOCK_CANDIDATES.filter(c => c.perfilesAsociados.some(id => profileIds.includes(id))).map(c => c.id)
    );
    return uniqueCandidates.size;
  };

  // Global search filtering
  const globalSearchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return ALL_PROFILES.filter(p => 
      p.nombre.toLowerCase().includes(term) ||
      p.descripcion.toLowerCase().includes(term) ||
      p.especialidad.toLowerCase().includes(term) ||
      p.familia.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.habilidades.some(h => h.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  // Tree families based on Category Pill selection
  const treeDisplayFamilies = useMemo(() => {
    if (selectedCategoryPill === 'all') return FAMILIAS_DATA;
    return FAMILIAS_DATA.filter(f => f.id === selectedCategoryPill);
  }, [selectedCategoryPill]);

  // Toggle family in tree
  const toggleFamily = (familyId: string) => {
    setExpandedFamilies(prev => ({ ...prev, [familyId]: !prev[familyId] }));
  };

  // Toggle specialty in tree
  const toggleSpecialty = (specKey: string) => {
    setExpandedSpecialties(prev => ({ ...prev, [specKey]: !prev[specKey] }));
  };

  // Expand all tree nodes
  const handleExpandAll = () => {
    const fams: Record<string, boolean> = {};
    const specs: Record<string, boolean> = {};
    FAMILIAS_DATA.forEach(f => {
      fams[f.id] = true;
      f.especialidades.forEach(s => {
        specs[s.nombre] = true;
      });
    });
    setExpandedFamilies(fams);
    setExpandedSpecialties(specs);
  };

  // Collapse all tree nodes
  const handleCollapseAll = () => {
    setExpandedFamilies({});
    setExpandedSpecialties({});
  };

  // Copy ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Total taxonomy metrics
  const totalSpecialtiesCount = useMemo(() => {
    return FAMILIAS_DATA.reduce((acc, f) => acc + f.especialidades.length, 0);
  }, []);

  // Grid view active family object
  const currentGridFamily = useMemo(() => {
    return FAMILIAS_DATA.find(f => f.id === gridSelectedFamilyId) || null;
  }, [gridSelectedFamilyId]);

  const currentGridProfiles = useMemo(() => {
    if (!currentGridFamily) return [];
    if (gridSelectedSpecialtyName) {
      const spec = currentGridFamily.especialidades.find(s => s.nombre === gridSelectedSpecialtyName);
      return spec ? spec.perfiles : [];
    }
    return currentGridFamily.especialidades.flatMap(s => s.perfiles);
  }, [currentGridFamily, gridSelectedSpecialtyName]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Taxonomy Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono font-semibold text-[#007685] bg-[#007685]/10 border border-[#007685]/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Occupational Architecture
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                Official Talent Book Directory
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Occupational Profiles Book
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Explore the structured taxonomy of <span className="font-semibold text-slate-800">12 Primary Job Families</span>, specialized tracks, and occupational profiles with general descriptions and commercial backing roles.
            </p>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#F5F5F6] border border-slate-200/90 p-3 rounded-xl shrink-0">
            <div className="px-3 py-1 text-center">
              <div className="text-lg font-bold text-[#007685] font-mono">{FAMILIAS_DATA.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Families</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="px-3 py-1 text-center">
              <div className="text-lg font-bold text-slate-800 font-mono">{totalSpecialtiesCount}</div>
              <div className="text-[11px] font-medium text-slate-500">Specialties</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="px-3 py-1 text-center">
              <div className="text-lg font-bold text-slate-800 font-mono">{ALL_PROFILES.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Profiles</div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="px-3 py-1 text-center">
              <div className="text-lg font-bold text-[#EE7825] font-mono">{MOCK_CANDIDATES.length}</div>
              <div className="text-[11px] font-medium text-slate-500">Candidates</div>
            </div>
          </div>
        </div>

        {/* Search Bar with instant filtering */}
        <div className="mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, specialty, skill, or job role (e.g. Collections, Developer, Assistant, Payroll...)..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#F5F5F6]/70 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Quick Category Rail (12 Families - Always Visible for Instant Exploration) */}
      {!searchTerm.trim() && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#007685]" />
              Primary Categories (12 Job Families)
            </span>
            <span className="text-slate-500 text-[11px]">
              Select a category to filter the tree
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {/* All Categories Option */}
            <button
              onClick={() => {
                setSelectedCategoryPill('all');
                if (viewMode === 'grid') {
                  setGridSelectedFamilyId(null);
                  setGridSelectedSpecialtyName(null);
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategoryPill === 'all'
                  ? 'bg-[#007685] text-white shadow-xs'
                  : 'bg-[#F5F5F6] text-slate-700 hover:bg-slate-200/70 border border-slate-200/80'
              }`}
            >
              <span>All Categories</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategoryPill === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                12
              </span>
            </button>

            {/* 12 Individual Family Pills */}
            {FAMILIAS_DATA.map((fam) => {
              const isSelected = selectedCategoryPill === fam.id;
              const totalProfiles = fam.especialidades.reduce((acc, s) => acc + s.perfiles.length, 0);

              return (
                <button
                  key={fam.id}
                  onClick={() => {
                    setSelectedCategoryPill(fam.id);
                    // Also ensure this family is expanded in tree
                    setExpandedFamilies(prev => ({ ...prev, [fam.id]: true }));
                    if (viewMode === 'grid') {
                      setGridSelectedFamilyId(fam.id);
                      setGridSelectedSpecialtyName(null);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#007685] text-white font-semibold shadow-xs'
                      : 'bg-[#F5F5F6] text-slate-700 hover:text-[#007685] hover:bg-[#20BFD0]/10 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate">{fam.nombre}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {totalProfiles}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. View Switcher & Tree Controls Bar */}
      {!searchTerm.trim() && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          {/* Segmented view switcher */}
          <div className="flex items-center gap-1 bg-[#F5F5F6] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#007685] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#007685]" />
              <span>Grid View (Default)</span>
            </button>

            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'tree'
                  ? 'bg-white text-[#007685] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-[#007685]" />
              <span>Tree View (Hierarchical Branches)</span>
            </button>
          </div>

          {/* Tree Control Helpers */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-1 text-slate-600 hover:text-[#007685] hover:bg-[#F5F5F6] rounded-md transition-colors font-medium border border-transparent hover:border-slate-200"
              >
                Expand all branches
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-1 text-slate-600 hover:text-[#007685] hover:bg-[#F5F5F6] rounded-md transition-colors font-medium border border-transparent hover:border-slate-200"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Global Search Results (when searching) */}
      {searchTerm.trim().length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Search results for &ldquo;<span className="text-slate-900 font-bold">{searchTerm}</span>&rdquo;
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {globalSearchResults.length} profiles found
            </span>
          </div>

          {globalSearchResults.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No profiles found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No occupational profiles match &ldquo;{searchTerm}&rdquo;. Try keywords such as &ldquo;Collections&rdquo;, &ldquo;Finance&rdquo;, &ldquo;Support&rdquo;, or &ldquo;Developer&rdquo;.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-[#F5F5F6] hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalSearchResults.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  candidateCount={getCandidateCountForProfile(profile.id)}
                  onOpenDetail={() => setActiveProfileModal(profile)}
                  onViewCandidates={() => onNavigateToCandidates({
                    familia: profile.familia,
                    especialidad: profile.especialidad,
                    perfilId: profile.id
                  })}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === 'tree' ? (
        /* ========================================================================= */
        /* VISTA ÁRBOL JERÁRQUICO (Visual Tree: Familia -> Especialidad -> Perfil)  */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
            {/* Tree Section Header Guide */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 mb-5 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Interactive Occupational Tree
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">
                  {treeDisplayFamilies.length} {treeDisplayFamilies.length === 1 ? 'family shown' : 'families'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#007685]" /> Level 1: Family
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#20BFD0]" /> Level 2: Specialty
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EE7825]" /> Level 3: Profile
                </span>
              </div>
            </div>

            {/* Tree Root Container */}
            <div className="space-y-4">
              {treeDisplayFamilies.map((family) => {
                const isFamilyExpanded = expandedFamilies[family.id];
                const totalProfiles = family.especialidades.reduce((acc, s) => acc + s.perfiles.length, 0);
                const familyCandidatesCount = getCandidateCountForFamily(family);

                return (
                  <div
                    key={family.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    {/* LEVEL 1: FAMILIA (Category Root Node) */}
                    <div
                      onClick={() => toggleFamily(family.id)}
                      className="p-4 sm:px-5 bg-gradient-to-r from-white to-[#F5F5F6]/40 hover:from-slate-50 hover:to-slate-100/60 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 select-none group transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <button
                          className="mt-0.5 sm:mt-0 w-6 h-6 rounded-md bg-[#F5F5F6] border border-slate-200/90 flex items-center justify-center text-slate-500 group-hover:text-[#007685] group-hover:border-[#007685]/30 transition-all shrink-0"
                          aria-label={isFamilyExpanded ? "Collapse family" : "Expand family"}
                        >
                          {isFamilyExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#007685]" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div className="w-8 h-8 rounded-lg bg-[#007685]/10 border border-[#007685]/20 text-[#007685] flex items-center justify-center shrink-0">
                          {isFamilyExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 group-hover:text-[#007685] transition-colors">
                              {family.nombre}
                            </h2>
                            <span className="text-[10px] font-mono font-semibold text-[#007685] bg-[#007685]/8 border border-[#007685]/20 px-2 py-0.5 rounded">
                              {family.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-2xl">
                            {family.descripcionBreve}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata and direct action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 pl-10 md:pl-0">
                        <span className="tabular-nums font-medium">
                          {family.especialidades.length} {family.especialidades.length === 1 ? 'specialty' : 'specialties'} · {totalProfiles} profiles
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-[#EE7825]/10 border border-[#EE7825]/20 text-[#EE7825] text-[11px] font-mono font-semibold tabular-nums">
                          {familyCandidatesCount} {familyCandidatesCount === 1 ? 'candidate' : 'candidates'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToCandidates({ familia: family.nombre });
                          }}
                          className="text-xs font-semibold text-[#007685] hover:text-[#005d69] hover:bg-[#007685]/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          View candidates
                        </button>
                      </div>
                    </div>

                    {/* LEVEL 2 & 3: TREE BRANCHES (Especialidades & Perfiles) */}
                    {isFamilyExpanded && (
                      <div className="p-4 sm:p-6 bg-[#F5F5F6]/60 border-t border-slate-100">
                        {/* Tree Branch Trunk Line */}
                        <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-6 before:w-0.5 before:bg-[#20BFD0]/30">
                          {family.especialidades.map((spec, specIdx) => {
                            const isSpecExpanded = expandedSpecialties[spec.nombre] ?? true;
                            const specCandidatesCount = getCandidateCountForSpecialty(family, spec.nombre);

                            return (
                              <div key={spec.nombre} className="relative pl-9">
                                {/* Horizontal connector branch from trunk */}
                                <div className="absolute left-4 top-4.5 w-5 h-0.5 bg-[#20BFD0]/40" />

                                {/* Specialty Node Card */}
                                <div className="border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-2xs">
                                  {/* LEVEL 2 HEADER: Especialidad */}
                                  <div
                                    onClick={() => toggleSpecialty(spec.nombre)}
                                    className="px-4 py-3 bg-slate-50/90 hover:bg-slate-100/90 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 select-none group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <button
                                        className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#007685]"
                                        aria-label={isSpecExpanded ? "Collapse specialty" : "Expand specialty"}
                                      >
                                        {isSpecExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-[#007685]" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      
                                      <span className="w-2 h-2 rounded-full bg-[#20BFD0]" />

                                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#007685] transition-colors">
                                        {spec.nombre}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                                      <span className="text-xs text-slate-500 tabular-nums">
                                        {spec.perfiles.length} {spec.perfiles.length === 1 ? 'registered profile' : 'registered profiles'}
                                      </span>

                                      {specCandidatesCount > 0 ? (
                                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                          {specCandidatesCount} cand.
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                          0 in pool · On demand
                                        </span>
                                      )}

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNavigateToCandidates({
                                            familia: family.nombre,
                                            especialidad: spec.nombre
                                          });
                                        }}
                                        className="text-xs font-semibold text-[#007685] hover:underline"
                                      >
                                        Filter in candidates
                                      </button>
                                    </div>
                                  </div>

                                  {/* LEVEL 3: PROFILES LEAVES */}
                                  {isSpecExpanded && (
                                    <div className="p-3 sm:p-4 bg-white space-y-3">
                                      {/* Sub-branch guide line for profiles */}
                                      <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-[#20BFD0]/20 ml-2">
                                        {spec.perfiles.map((profile) => {
                                          const candidateCountForProfile = getCandidateCountForProfile(profile.id);

                                          return (
                                            <div
                                              key={profile.id}
                                              className="relative pl-5 group/profile"
                                            >
                                              {/* Horizontal leaf connector line */}
                                              <div className="absolute left-0 top-5 w-4 h-0.5 bg-[#20BFD0]/30" />

                                              {/* Profile Leaf Card */}
                                              <div className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-[#007685]/40 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1.5 flex-1 pr-2">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-sm group-hover/profile:text-[#007685] transition-colors">
                                                      {profile.nombre}
                                                    </span>

                                                    {/* Specialty Tag */}
                                                    <span className="text-[11px] font-medium text-[#007685] bg-[#007685]/8 border border-[#007685]/15 px-2 py-0.5 rounded">
                                                      {profile.especialidad}
                                                    </span>

                                                    {/* Backing vacancies count tag */}
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                      ({profile.vacantesRespaldo.length} benchmark roles)
                                                    </span>
                                                  </div>

                                                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                    {profile.descripcion}
                                                  </p>

                                                  {/* Skills Preview */}
                                                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                                                    <span className="font-semibold text-slate-700">Key skills:</span>
                                                    {profile.habilidades.slice(0, 4).map((h, i) => (
                                                      <span key={h} className="text-slate-600">
                                                        {h}{i < Math.min(profile.habilidades.length - 1, 3) ? ' ·' : ''}
                                                      </span>
                                                    ))}
                                                    {profile.habilidades.length > 4 && (
                                                      <span className="text-slate-400 text-[10px]">+{profile.habilidades.length - 4} more</span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                                  <button
                                                    onClick={() => setActiveProfileModal(profile)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-[#F5F5F6] hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                                                  >
                                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Profile sheet</span>
                                                  </button>

                                                  <button
                                                    onClick={() => onNavigateToCandidates({
                                                      familia: profile.familia,
                                                      especialidad: profile.especialidad,
                                                      perfilId: profile.id
                                                    })}
                                                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                                                  >
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span>View candidates ({candidateCountForProfile})</span>
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISTA CUADRÍCULA PROGRESSIVA (Categoría -> Subcategorías -> Opciones)     */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Stepper / Breadcrumb Trail Indicator */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <nav className="flex items-center text-xs text-slate-500 gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  setGridSelectedFamilyId(null);
                  setGridSelectedSpecialtyName(null);
                }}
                className={`transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                  !gridSelectedFamilyId 
                    ? 'font-bold bg-[#007685] text-white shadow-xs' 
                    : 'text-slate-600 hover:text-[#007685] hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Level 1: Main Categories</span>
              </button>

              {currentGridFamily && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <button
                    onClick={() => setGridSelectedSpecialtyName(null)}
                    className={`transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                      !gridSelectedSpecialtyName 
                        ? 'font-bold bg-[#20BFD0] text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-[#007685] hover:bg-slate-100'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Level 2: Subcategories ({currentGridFamily.id})</span>
                  </button>
                </>
              )}

              {gridSelectedSpecialtyName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-bold bg-[#007685] text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-xs">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Level 3: Options in Cards</span>
                  </span>
                </>
              )}
            </nav>

            {/* Quick status pill */}
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#007685]" />
              <span>
                {!gridSelectedFamilyId 
                  ? 'Viewing 12 Categories' 
                  : !gridSelectedSpecialtyName 
                    ? `Browsing subcategories of: ${currentGridFamily?.nombre}`
                    : `Displaying profiles for: ${gridSelectedSpecialtyName === '__ALL__' ? 'All' : gridSelectedSpecialtyName}`}
              </span>
            </div>
          </div>

          {/* NIVEL 1: CATEGORÍAS GRANDES (FAMILIAS OCUPACIONALES) */}
          {!gridSelectedFamilyId ? (
            <div className="space-y-4">
              {/* Stepper Guide Banner */}
              <div className="bg-gradient-to-r from-[#007685]/10 via-[#20BFD0]/10 to-transparent border border-[#007685]/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#007685] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Step 1: Select a Main Category (Job Family)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Click on any category to view its specialized subcategories.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#007685] bg-white border border-[#007685]/20 px-3 py-1 rounded-lg shrink-0">
                  {FAMILIAS_DATA.length} Families Available
                </span>
              </div>

              {/* Grid of Big Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FAMILIAS_DATA.map((family) => {
                  const candidateCount = getCandidateCountForFamily(family);
                  const totalProfiles = family.especialidades.reduce((acc, s) => acc + s.perfiles.length, 0);

                  return (
                    <div
                      key={family.id}
                      onClick={() => {
                        setGridSelectedFamilyId(family.id);
                        setGridSelectedSpecialtyName(null);
                      }}
                      className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-[#007685] hover:shadow-md transition-all group relative flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Header ID & Candidatos */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <span className="text-[11px] font-mono text-[#007685] bg-[#007685]/8 border border-[#007685]/20 px-2.5 py-0.5 rounded-md font-bold tracking-wider">
                            {family.id}
                          </span>
                          {candidateCount > 0 ? (
                            <span className="text-[11px] font-semibold text-[#EE7825] bg-[#EE7825]/10 border border-[#EE7825]/20 px-2.5 py-0.5 rounded-md tabular-nums">
                              {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              0 in pool · Sourced on demand
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#007685] transition-colors">
                          {family.nombre}
                        </h3>

                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {family.descripcionBreve}
                        </p>

                        {/* Subcategories quick preview pills */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Included Subcategories ({family.especialidades.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {family.especialidades.slice(0, 3).map((spec) => (
                              <span
                                key={spec.nombre}
                                className="text-[11px] bg-[#F5F5F6] text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200/80 truncate max-w-[180px]"
                              >
                                {spec.nombre}
                              </span>
                            ))}
                            {family.especialidades.length > 3 && (
                              <span className="text-[11px] text-slate-400 font-semibold px-1 py-0.5">
                                +{family.especialidades.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          {family.especialidades.length} subcategories · {totalProfiles} options
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#007685] group-hover:translate-x-1 transition-transform">
                          View subcategories <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !gridSelectedSpecialtyName ? (
            /* NIVEL 2: SUBCATEGORÍAS (ESPECIALIDADES DE LA CATEGORÍA SELECCIONADA) */
            <div className="space-y-6">
              {/* Family Header Banner - Clear Categoría Padre */}
              <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#007685] via-[#20BFD0] to-[#EE7825]" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div>
                    <button
                      onClick={() => {
                        setGridSelectedFamilyId(null);
                        setGridSelectedSpecialtyName(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#007685] font-semibold mb-3 group transition-colors px-2.5 py-1 rounded-md hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#007685]" />
                      Back to all main categories
                    </button>
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono font-bold text-white bg-[#007685] px-2.5 py-0.5 rounded shadow-2xs">
                        {currentGridFamily?.id}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                        Main Category
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {currentGridFamily?.nombre}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                      {currentGridFamily?.descripcionBreve}
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => onNavigateToCandidates({ familia: currentGridFamily?.nombre })}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#007685] hover:bg-[#005d69] rounded-xl transition-all shadow-xs flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>View candidates ({getCandidateCountForFamily(currentGridFamily!)})</span>
                    </button>
                    <button
                      onClick={() => setGridSelectedSpecialtyName('__ALL__')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#007685] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>View all subcategories together</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Subcategories Level Indicator Callout */}
              <div className="bg-gradient-to-r from-sky-50 via-teal-50/50 to-white border border-[#20BFD0]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#20BFD0] text-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-4 ring-[#20BFD0]/20">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-widest uppercase bg-[#20BFD0]/30 text-teal-900 px-2 py-0.5 rounded font-mono">
                        NAVIGATION LEVEL 2
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        Specialized Subcategories
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select a subcategory to browse its profile options displayed in cards.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-teal-900 bg-white border border-[#20BFD0]/40 px-3 py-1.5 rounded-lg shadow-2xs">
                    {currentGridFamily?.especialidades.length} Subcategories available
                  </span>
                </div>
              </div>

              {/* Subcategories Cards Grid - Distinct folder-like styling with clean borders and cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentGridFamily?.especialidades.map((spec, index) => {
                  const specCandidatesCount = getCandidateCountForSpecialty(currentGridFamily, spec.nombre);

                  return (
                    <div
                      key={spec.nombre}
                      onClick={() => setGridSelectedSpecialtyName(spec.nombre)}
                      className="bg-white border-2 border-slate-200 hover:border-[#20BFD0] rounded-2xl p-5 hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden bg-gradient-to-b from-white to-slate-50/30"
                    >
                      {/* Left accent border stripe */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#20BFD0] group-hover:bg-[#007685] transition-colors" />

                      <div className="pl-1">
                        {/* Distinct Subcategory Tag & Index */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-teal-800 bg-[#20BFD0]/20 border border-[#20BFD0]/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">
                              <Folder className="w-3 h-3 text-teal-700 fill-teal-700/20" />
                              Subcategory #{index + 1}
                            </span>
                          </div>
                          
                          {specCandidatesCount > 0 ? (
                            <span className="text-[11px] font-bold text-[#EE7825] bg-[#EE7825]/10 border border-[#EE7825]/20 px-2.5 py-0.5 rounded-md tabular-nums flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {specCandidatesCount} {specCandidatesCount === 1 ? 'candidate' : 'candidates'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              0 in pool · On demand
                            </span>
                          )}
                        </div>

                        {/* Subcategory Title */}
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#007685] transition-colors leading-snug">
                          {spec.nombre}
                        </h4>

                        {/* Profiles Count summary */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Layers className="w-3 h-3 text-[#20BFD0]" />
                          <span>{spec.perfiles.length} {spec.perfiles.length === 1 ? 'occupational profile' : 'occupational profiles'}</span>
                        </div>

                        {/* Profiles Preview list in box */}
                        <div className="mt-4 bg-slate-50 border border-slate-200/90 rounded-xl p-3 group-hover:bg-teal-50/30 group-hover:border-[#20BFD0]/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Included options:
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {spec.perfiles.length} {spec.perfiles.length === 1 ? 'option' : 'options'}
                            </span>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {spec.perfiles.map((p) => (
                              <li key={p.id} className="flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#007685] shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">{p.nombre}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs pl-1">
                        <span className="text-slate-400 text-[11px] font-medium">
                          Click to explore
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#007685] group-hover:text-[#005d69] group-hover:translate-x-1 transition-all">
                          View options in cards <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* NIVEL 3: OPCIONES DE PERFILES EN TARJETAS */
            <div className="space-y-6">
              {/* Header Navigation for Level 3 */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#007685]" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <button
                      onClick={() => setGridSelectedSpecialtyName(null)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#007685] font-semibold mb-2 group transition-colors px-2 py-1 rounded hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-[#007685]" />
                      Back to subcategories list of {currentGridFamily?.nombre}
                    </button>
                    
                    {/* Clear Hierarchy Badge */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Category: {currentGridFamily?.nombre}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="text-[11px] font-bold text-teal-900 bg-[#20BFD0]/30 border border-[#20BFD0]/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                        <Folder className="w-3 h-3 text-teal-800" />
                        Subcategory: {gridSelectedSpecialtyName === '__ALL__' ? 'All subcategories' : gridSelectedSpecialtyName}
                      </span>
                      <span className="text-[10px] font-bold text-white bg-[#007685] px-2 py-0.5 rounded">
                        Level 3 · Options
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {gridSelectedSpecialtyName === '__ALL__' 
                        ? `All Profile Options in ${currentGridFamily?.nombre}` 
                        : gridSelectedSpecialtyName}
                    </h2>
                    
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Showing <span className="font-bold text-slate-900">{currentGridProfiles.length}</span> {currentGridProfiles.length === 1 ? 'profile card' : 'occupational profile cards'} with direct candidate access and full description.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateToCandidates({ 
                        familia: currentGridFamily?.nombre,
                        especialidad: gridSelectedSpecialtyName === '__ALL__' ? undefined : gridSelectedSpecialtyName
                      })}
                      className="px-4 py-2.5 text-xs font-semibold text-white bg-[#007685] hover:bg-[#005d69] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View candidates in talent pool</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Subcategory Switcher Tabs */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-[#007685]" />
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Switch Subcategory:
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-medium">
                    {currentGridFamily?.especialidades.length} subcategories in this family
                  </span>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setGridSelectedSpecialtyName('__ALL__')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      gridSelectedSpecialtyName === '__ALL__'
                        ? 'bg-[#007685] text-white shadow-xs'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:border-[#007685]/30 hover:text-[#007685]'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>All ({currentGridFamily?.especialidades.reduce((acc, s) => acc + s.perfiles.length, 0)})</span>
                  </button>

                  {currentGridFamily?.especialidades.map((spec) => (
                    <button
                      key={spec.nombre}
                      onClick={() => setGridSelectedSpecialtyName(spec.nombre)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        gridSelectedSpecialtyName === spec.nombre
                          ? 'bg-[#20BFD0] text-slate-900 font-bold shadow-xs'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:border-[#20BFD0] hover:text-[#007685]'
                      }`}
                    >
                      <Folder className="w-3 h-3 opacity-70" />
                      <span>{spec.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 tabular-nums">
                        {spec.perfiles.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profiles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentGridProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    candidateCount={getCandidateCountForProfile(profile.id)}
                    onOpenDetail={() => setActiveProfileModal(profile)}
                    onViewCandidates={() => onNavigateToCandidates({
                      familia: profile.familia,
                      especialidad: profile.especialidad,
                      perfilId: profile.id
                    })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Detail Modal / Ficha del Perfil */}
      {activeProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-bold text-[#007685] bg-[#007685]/10 px-2.5 py-0.5 rounded">
                    {activeProfileModal.familia}
                  </span>
                  <span>/</span>
                  <span className="text-slate-700 font-semibold">{activeProfileModal.especialidad}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeProfileModal.nombre}
                </h2>
              </div>
              <button
                onClick={() => setActiveProfileModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-[#F5F5F6] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="py-5 overflow-y-auto space-y-5 text-sm flex-1 pr-1">
              {/* Generic Profile Overview */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  General Profile Description
                </h3>
                <div className="bg-[#F5F5F6] p-4 rounded-xl border border-slate-200">
                  <p className="text-slate-800 text-sm leading-relaxed">
                    {activeProfileModal.descripcion}
                  </p>
                </div>
              </div>

              {/* Functional Scope & Adaptability */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  General Role Scope
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  General occupational framework for professionals specializing in <span className="font-semibold text-slate-800">{activeProfileModal.especialidad}</span> within the <span className="font-semibold text-slate-800">{activeProfileModal.familia}</span> domain. Adaptable to specific client job vacancy requirements and commercial criteria.
                </p>
              </div>

              {/* Core Competencies & Key Skills */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Key Skills & Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfileModal.habilidades.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-[#F5F5F6] rounded-md border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-900 tabular-nums">
                  {getCandidateCountForProfile(activeProfileModal.id)}
                </span> candidates in talent pool with this profile
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveProfileModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F5F5F6] rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const prof = activeProfileModal;
                    setActiveProfileModal(null);
                    onNavigateToCandidates({
                      familia: prof.familia,
                      especialidad: prof.especialidad,
                      perfilId: prof.id
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View candidates</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProfileCardProps {
  profile: PerfilOcupacional;
  candidateCount: number;
  onOpenDetail: () => void;
  onViewCandidates: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  candidateCount,
  onOpenDetail,
  onViewCandidates
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#007685]/40 hover:shadow-xs transition-all">
      <div>
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-semibold text-[#007685] bg-[#007685]/10 border border-[#007685]/20 px-2.5 py-0.5 rounded-md truncate max-w-[210px] text-[11px]">
            {profile.especialidad}
          </span>
          {candidateCount > 0 ? (
            <span className="tabular-nums shrink-0 text-[#EE7825] font-bold text-xs bg-[#EE7825]/10 border border-[#EE7825]/20 px-2 py-0.5 rounded-md">
              {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'}
            </span>
          ) : (
            <span className="shrink-0 text-slate-500 font-medium text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              0 in pool · On demand
            </span>
          )}
        </div>

        <button
          onClick={onOpenDetail}
          className="text-left w-full group"
        >
          <h3 className="text-base font-bold text-slate-900 group-hover:text-[#007685] transition-colors line-clamp-1">
            {profile.nombre}
          </h3>
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {profile.descripcion}
          </p>
        </button>

        {/* Skills */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 mb-1.5 font-medium">Key skills:</div>
          <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {profile.habilidades.slice(0, 4).map((h, i) => (
              <React.Fragment key={h}>
                <span className="font-medium">{h}</span>
                {i < Math.min(profile.habilidades.length - 1, 3) && (
                  <span className="text-slate-300 font-normal">·</span>
                )}
              </React.Fragment>
            ))}
            {profile.habilidades.length > 4 && (
              <span className="text-slate-400 text-[11px]">+{profile.habilidades.length - 4}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={onOpenDetail}
          className="text-xs font-semibold text-slate-600 hover:text-[#007685] hover:underline transition-colors"
        >
          Profile specs
        </button>

        <button
          onClick={onViewCandidates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#007685] bg-[#007685]/10 hover:bg-[#007685]/20 border border-[#007685]/20 rounded-lg transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-[#007685]" />
          <span>View candidates</span>
        </button>
      </div>
    </div>
  );
};
