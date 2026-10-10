import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  UserPlus, 
  CheckCircle2, 
  MapPin, 
  Globe,
  RotateCcw
} from 'lucide-react';
import { Candidato, BusquedaComercial } from '../types';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { FAMILIAS_DATA, ALL_PROFILES } from '../data/bookData';

interface AddCandidatesToBusquedaModalProps {
  busqueda: BusquedaComercial;
  onClose: () => void;
  onLinkCandidates: (candidateIds: string[]) => void;
}

export const AddCandidatesToBusquedaModal: React.FC<AddCandidatesToBusquedaModalProps> = ({
  busqueda,
  onClose,
  onLinkCandidates
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState('all');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCandidatesToLink, setSelectedCandidatesToLink] = useState<string[]>([]);
  const [confirmedAdded, setConfirmedAdded] = useState(false);

  // Set of already linked candidate IDs
  const alreadyLinkedIds = useMemo(() => {
    return new Set(busqueda.candidatosVinculados.map(c => c.candidatoId));
  }, [busqueda.candidatosVinculados]);

  // All unique countries with counts
  const allUniqueCountries = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_CANDIDATES.forEach(c => {
      map.set(c.pais, (map.get(c.pais) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([pais, count]) => ({ pais, count }))
      .sort((a, b) => a.pais.localeCompare(b.pais));
  }, []);

  // Toggle country filter pill (multi-select)
  const toggleCountryFilter = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return MOCK_CANDIDATES.filter(c => {
      // 1. Search term (Code, Summary, Country, City)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(term);
        const matchesSummary = c.resumenProfesional.toLowerCase().includes(term);
        const matchesCountry = c.pais.toLowerCase().includes(term);
        const matchesCity = c.ciudad.toLowerCase().includes(term);
        if (!matchesId && !matchesSummary && !matchesCountry && !matchesCity) return false;
      }

      // 2. Family filter
      if (selectedFamilyFilter !== 'all') {
        const famObj = FAMILIAS_DATA.find(f => f.id === selectedFamilyFilter);
        if (famObj) {
          const famProfileIds = famObj.especialidades.flatMap(s => s.perfiles.map(p => p.id));
          const hasProfileInFamily = c.perfilesAsociados.some(id => famProfileIds.includes(id));
          if (!hasProfileInFamily) return false;
        }
      }

      // 3. Multi-country filter (pills)
      if (selectedCountries.length > 0) {
        if (!selectedCountries.includes(c.pais)) return false;
      }

      return true;
    });
  }, [searchTerm, selectedFamilyFilter, selectedCountries]);

  // Toggle candidate selection
  const handleToggle = (id: string) => {
    if (alreadyLinkedIds.has(id)) return;
    setSelectedCandidatesToLink(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select all available visible candidates
  const handleSelectAllVisible = () => {
    const unlinkedVisibleIds = filteredCandidates
      .filter(c => !alreadyLinkedIds.has(c.id))
      .map(c => c.id);

    const allAreSelected = unlinkedVisibleIds.every(id => selectedCandidatesToLink.includes(id));
    if (allAreSelected) {
      setSelectedCandidatesToLink(prev => prev.filter(id => !unlinkedVisibleIds.includes(id)));
    } else {
      setSelectedCandidatesToLink(prev => Array.from(new Set([...prev, ...unlinkedVisibleIds])));
    }
  };

  // Submit linking
  const handleConfirm = () => {
    if (selectedCandidatesToLink.length === 0) return;
    onLinkCandidates(selectedCandidatesToLink);
    setConfirmedAdded(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-6 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                Talent Explorer
              </span>
              <span className="text-xs text-slate-500">
                Link to: <strong className="text-slate-800">{busqueda.nombre}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Search and Add Candidates to Search
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {confirmedAdded && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Successfully linked {selectedCandidatesToLink.length} candidates to the search!</span>
          </div>
        )}

        {/* Search & Family Filter Controls */}
        <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code (CAN-XXXX), city or country..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedFamilyFilter}
              onChange={(e) => setSelectedFamilyFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
            >
              <option value="all">All job families ({FAMILIAS_DATA.length})</option>
              {FAMILIAS_DATA.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Países (Selección múltiple con pills - Requisito del usuario) */}
        <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#007685]" />
            Countries:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCountries([])}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCountries.length === 0
                ? 'bg-[#007685] text-white shadow-2xs'
                : 'bg-[#F5F5F6] hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            All ({MOCK_CANDIDATES.length})
          </button>

          {allUniqueCountries.map(({ pais, count }) => {
            const isSelected = selectedCountries.includes(pais);
            return (
              <button
                key={pais}
                type="button"
                onClick={() => toggleCountryFilter(pais)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#007685] text-white shadow-2xs'
                    : 'bg-[#F5F5F6] hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{pais}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {selectedCountries.length > 0 && (
            <button
              onClick={() => setSelectedCountries([])}
              className="text-[11px] font-semibold text-[#007685] hover:underline ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear countries ({selectedCountries.length})
            </button>
          )}
        </div>

        {/* Counter and Multi-Select Visibles Bar */}
        <div className="py-2.5 flex items-center justify-between text-xs text-slate-600 border-b border-slate-100">
          <div>
            Showing <strong>{filteredCandidates.length}</strong> available candidates
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="text-xs font-semibold text-[#007685] hover:underline cursor-pointer"
            >
              Select / Deselect visible unlinked
            </button>
          </div>
        </div>

        {/* Candidates Cards Grid */}
        <div className="py-3 overflow-y-auto flex-1 pr-1 text-xs">
          {filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No candidates found with these filters</p>
              <p className="text-xs text-slate-400 mt-1">Try selecting other countries or clearing search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCandidates.map(candidate => {
                const isAlreadyLinked = alreadyLinkedIds.has(candidate.id);
                const isSelected = selectedCandidatesToLink.includes(candidate.id);

                return (
                  <div
                    key={candidate.id}
                    onClick={() => handleToggle(candidate.id)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isAlreadyLinked
                        ? 'bg-slate-50/70 border-slate-200 opacity-65 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#007685]/5 border-[#007685] ring-2 ring-[#007685]/20 shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Card Header: Checkbox, Code, Badges */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyLinked}
                            disabled={isAlreadyLinked}
                            onChange={() => handleToggle(candidate.id)}
                            className="w-4 h-4 rounded text-[#007685] focus:ring-[#007685] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="font-mono font-bold text-xs text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                            {candidate.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
                            {candidate.nivelIngles}
                          </span>
                        </div>
                      </div>

                      {/* Location & Country Pills */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F5F5F6] text-slate-800 border border-slate-200">
                          <Globe className="w-3.5 h-3.5 text-[#007685]" />
                          <span>{candidate.ciudad}, {candidate.pais}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {candidate.modalidad}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                        {candidate.resumenProfesional}
                      </p>
                    </div>

                    {/* Card Footer: Action button or Already linked status */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-500 font-medium truncate max-w-[170px]">
                        {ALL_PROFILES.find(p => p.id === candidate.perfilesAsociados[0])?.nombre || candidate.perfilesAsociados[0]}
                      </div>

                      {isAlreadyLinked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                          Already linked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(candidate.id);
                          }}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#007685] text-white shadow-2xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:border-[#007685] hover:text-[#007685]'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : '+ Select'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            <span className="font-bold text-slate-800">{selectedCandidatesToLink.length}</span> candidates selected to link
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCandidatesToLink.length === 0 || confirmedAdded}
              className={`px-4 py-2 font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                selectedCandidatesToLink.length > 0 && !confirmedAdded
                  ? 'bg-[#007685] hover:bg-[#005d69] cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Link candidates ({selectedCandidatesToLink.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
