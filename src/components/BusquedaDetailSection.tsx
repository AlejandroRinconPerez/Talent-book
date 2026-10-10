import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Users, 
  UserPlus, 
  Trash2, 
  SlidersHorizontal, 
  ShieldCheck, 
  UploadCloud, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  MapPin, 
  Briefcase, 
  Globe,
  Clock,
  Sparkles
} from 'lucide-react';
import { BusquedaComercial, Candidato, NivelIngles, VacancyRequisitos } from '../types';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { ALL_PROFILES } from '../data/bookData';
import { CeipalPipelineModal } from './CeipalPipelineModal';
import { AddCandidatesToBusquedaModal } from './AddCandidatesToBusquedaModal';

interface BusquedaDetailSectionProps {
  busqueda: BusquedaComercial;
  onBackToList: () => void;
  onUpdateBusqueda: (updated: BusquedaComercial) => void;
  onOpenCandidateDetail: (candidato: Candidato) => void;
  onEvaluateCompatibility: (candidates: Candidato[], requisitos: VacancyRequisitos, searchName: string) => void;
  onOpenPresentation: (candidates: Candidato[]) => void;
}

export const BusquedaDetailSection: React.FC<BusquedaDetailSectionProps> = ({
  busqueda,
  onBackToList,
  onUpdateBusqueda,
  onOpenCandidateDetail,
  onEvaluateCompatibility,
  onOpenPresentation
}) => {
  // Candidate multiselection within this search
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Modals state
  const [isAddCandidatesModalOpen, setIsAddCandidatesModalOpen] = useState(false);
  const [isCeipalModalOpen, setIsCeipalModalOpen] = useState(false);
  const [showEditRequirements, setShowEditRequirements] = useState(false);

  // Editable requirements state
  const [editableRequisitos, setEditableRequisitos] = useState<VacancyRequisitos>(busqueda.requisitos);
  const [editableDescripcion, setEditableDescripcion] = useState(busqueda.descripcion);
  const [isSavingReqs, setIsSavingReqs] = useState(false);

  // Get full Candidate objects for the linked candidates
  const linkedCandidateObjects = busqueda.candidatosVinculados
    .map(cv => {
      const candObj = MOCK_CANDIDATES.find(c => c.id === cv.candidatoId);
      return {
        vinculo: cv,
        candidato: candObj
      };
    })
    .filter((item): item is { vinculo: typeof item.vinculo; candidato: Candidato } => item.candidato !== undefined);

  // Selected candidate objects
  const selectedCandidateObjects = linkedCandidateObjects
    .filter(item => selectedCandidateIds.includes(item.candidato.id))
    .map(item => item.candidato);

  // Multi-country filter state for linked candidates
  const [selectedCountryFilters, setSelectedCountryFilters] = useState<string[]>([]);

  // Unique countries among linked candidates with counts
  const uniqueCountriesInSearch = useMemo(() => {
    const map = new Map<string, number>();
    linkedCandidateObjects.forEach(({ candidato }) => {
      map.set(candidato.pais, (map.get(candidato.pais) || 0) + 1);
    });
    return Array.from(map.entries()).map(([pais, count]) => ({ pais, count }));
  }, [linkedCandidateObjects]);

  // Toggle country filter
  const toggleCountryFilter = (country: string) => {
    setSelectedCountryFilters(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  // Filtered linked candidates based on country filter
  const displayedLinkedCandidates = useMemo(() => {
    if (selectedCountryFilters.length === 0) return linkedCandidateObjects;
    return linkedCandidateObjects.filter(({ candidato }) => selectedCountryFilters.includes(candidato.pais));
  }, [linkedCandidateObjects, selectedCountryFilters]);

  // Selection toggle
  const handleToggleSelectCandidate = (id: string) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidateIds.length === linkedCandidateObjects.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(linkedCandidateObjects.map(item => item.candidato.id));
    }
  };

  // Remove candidate from search (only unlinks from this search)
  const handleUnlinkCandidate = (candidatoId: string) => {
    const updated = {
      ...busqueda,
      candidatosVinculados: busqueda.candidatosVinculados.filter(cv => cv.candidatoId !== candidatoId)
    };
    onUpdateBusqueda(updated);
    setSelectedCandidateIds(prev => prev.filter(id => id !== candidatoId));
  };

  // Add candidates from explorer modal
  const handleAddCandidates = (newCandidateIds: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newVinculos = newCandidateIds
      .filter(id => !busqueda.candidatosVinculados.some(cv => cv.candidatoId === id))
      .map(id => ({
        candidatoId: id,
        fechaVinculacion: today,
        estadoCeipal: 'no_cargado' as const
      }));

    const updated: BusquedaComercial = {
      ...busqueda,
      candidatosVinculados: [...busqueda.candidatosVinculados, ...newVinculos]
    };

    onUpdateBusqueda(updated);
  };

  // Handle CEIPAL upload results
  const handleCeipalUploadSuccess = (results: { candidatoId: string; serviceOrderId: string; estado: 'cargado' | 'error' }[]) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedVinculos = busqueda.candidatosVinculados.map(cv => {
      const match = results.find(r => r.candidatoId === cv.candidatoId);
      if (match) {
        return {
          ...cv,
          estadoCeipal: match.estado,
          serviceOrderId: match.serviceOrderId,
          fechaCargaCeipal: match.estado === 'cargado' ? today : undefined
        };
      }
      return cv;
    });

    onUpdateBusqueda({
      ...busqueda,
      candidatosVinculados: updatedVinculos
    });
  };

  // Save edited requirements
  const handleSaveRequirements = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReqs(true);
    setTimeout(() => {
      onUpdateBusqueda({
        ...busqueda,
        descripcion: editableDescripcion,
        requisitos: editableRequisitos
      });
      setIsSavingReqs(false);
      setShowEditRequirements(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Search Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#007685] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to My Searches</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditRequirements(!showEditRequirements)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-[#F5F5F6] hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>{showEditRequirements ? 'Close criteria' : 'Edit criteria'}</span>
            </button>

            <button
              onClick={() => onOpenPresentation(selectedCandidateObjects.length > 0 ? selectedCandidateObjects : linkedCandidateObjects.map(i => i.candidato))}
              disabled={linkedCandidateObjects.length === 0}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                linkedCandidateObjects.length > 0
                  ? 'bg-white border border-[#007685] text-[#007685] hover:bg-[#007685]/10 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Present candidate selection to client confidentially"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Present selection ({selectedCandidateIds.length > 0 ? selectedCandidateIds.length : linkedCandidateObjects.length})</span>
            </button>
          </div>
        </div>

        {/* Title & Client Overview */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5 font-mono text-xs text-slate-500">
            <span className="font-bold text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
              {busqueda.id}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-sans">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Created {busqueda.fechaCreacion}
            </span>
            {busqueda.perfilNombre && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 font-sans text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-[#007685]" />
                  Profile: {busqueda.perfilNombre}
                </span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {busqueda.nombre}
          </h1>

          {busqueda.clienteEmpresa && (
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Building2 className="w-4 h-4 text-[#007685]" />
              <span>{busqueda.clienteEmpresa}</span>
            </div>
          )}

          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {busqueda.descripcion}
          </p>

          {/* Quick Requirements Summary Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-[#F5F5F6] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium">
              Exp: <strong>{busqueda.requisitos.experienciaMinimaAnos}+ years</strong>
            </span>
            <span className="bg-[#F5F5F6] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium">
              English: <strong>{busqueda.requisitos.nivelInglesMinimo}</strong>
            </span>
            <span className="bg-[#F5F5F6] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-medium">
              Modality: <strong>{busqueda.requisitos.modalidad}</strong>
            </span>
            <span className="bg-[#007685]/10 border border-[#007685]/20 text-[#007685] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{busqueda.requisitos.ubicacionRequerida}</span>
            </span>
          </div>
        </div>

        {/* Requirements Edit Drawer (Collapsible) */}
        {showEditRequirements && (
          <form onSubmit={handleSaveRequirements} className="mt-4 pt-4 border-t border-slate-200 bg-[#F5F5F6]/70 p-4 rounded-xl space-y-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Edit Vacancy Criteria / Parameters
              </h3>
              <span className="text-[11px] text-slate-500">
                Used for qualitative candidate compatibility evaluation
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed description
              </label>
              <textarea
                rows={2}
                value={editableDescripcion}
                onChange={(e) => setEditableDescripcion(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Years of experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={editableRequisitos.experienciaMinimaAnos}
                  onChange={(e) => setEditableRequisitos({ ...editableRequisitos, experienciaMinimaAnos: Number(e.target.value) })}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  English proficiency
                </label>
                <select
                  value={editableRequisitos.nivelInglesMinimo}
                  onChange={(e) => setEditableRequisitos({ ...editableRequisitos, nivelInglesMinimo: e.target.value as NivelIngles })}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  <option value="Sin información">Not required</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Professional)</option>
                  <option value="C1">C1 (Advanced)</option>
                  <option value="C2">C2 (Native)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Modality
                </label>
                <select
                  value={editableRequisitos.modalidad}
                  onChange={(e) => setEditableRequisitos({ ...editableRequisitos, modalidad: e.target.value })}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  <option value="Remoto">Remote</option>
                  <option value="Híbrido">Hybrid</option>
                  <option value="Presencial">On-site</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target location
                </label>
                <input
                  type="text"
                  value={editableRequisitos.ubicacionRequerida}
                  onChange={(e) => setEditableRequisitos({ ...editableRequisitos, ubicacionRequerida: e.target.value })}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditRequirements(false)}
                className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingReqs}
                className="px-4 py-1.5 font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-md shadow-xs"
              >
                {isSavingReqs ? 'Saving...' : 'Save criteria'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Main Section: Linked Candidates Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Action Bar for Candidates */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm">
              Linked Candidates ({linkedCandidateObjects.length})
            </span>
            {selectedCandidateIds.length > 0 && (
              <span className="text-xs bg-[#007685]/10 text-[#007685] font-semibold px-2 py-0.5 rounded-full font-mono">
                {selectedCandidateIds.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action 1: Add Candidates */}
            <button
              onClick={() => setIsAddCandidatesModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Search & add candidates</span>
            </button>

            {/* Primary Action 2: Evaluate Compatibility */}
            <button
              onClick={() => {
                const candidatesToEval = selectedCandidateObjects.length > 0 
                  ? selectedCandidateObjects 
                  : linkedCandidateObjects.map(i => i.candidato);
                onEvaluateCompatibility(candidatesToEval, busqueda.requisitos, busqueda.nombre);
              }}
              disabled={linkedCandidateObjects.length === 0}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                linkedCandidateObjects.length > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Evaluate candidates against this vacancy's criteria"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#007685]" />
              <span>Evaluate fit ({selectedCandidateIds.length > 0 ? selectedCandidateIds.length : linkedCandidateObjects.length})</span>
            </button>

            {/* Primary Action 3: Load to CEIPAL Pipeline */}
            <button
              onClick={() => setIsCeipalModalOpen(true)}
              disabled={selectedCandidateIds.length === 0}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                selectedCandidateIds.length > 0
                  ? 'bg-[#EE7825] hover:bg-[#d96717] text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title={selectedCandidateIds.length === 0 ? "Select at least one candidate to upload to CEIPAL pipeline" : "Initiate CEIPAL ATS sync"}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Export to CEIPAL pipeline</span>
            </button>
          </div>
        </div>

        {/* Candidates Table / Empty State */}
        {linkedCandidateObjects.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No candidates linked yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This search has no shortlisted candidates. Browse the Talent Book or candidate directory to find relevant talent.
            </p>
            <button
              onClick={() => setIsAddCandidatesModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Search & add candidates now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick multi-selection toolbar & Country Filter Pills */}
            <div className="bg-[#F5F5F6]/70 border border-slate-200/80 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Country Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-[#007685]" />
                  Countries:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCountryFilters([])}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCountryFilters.length === 0
                      ? 'bg-[#007685] text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  All ({linkedCandidateObjects.length})
                </button>
                {uniqueCountriesInSearch.map(({ pais, count }) => {
                  const isSelected = selectedCountryFilters.includes(pais);
                  return (
                    <button
                      key={pais}
                      type="button"
                      onClick={() => toggleCountryFilter(pais)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#007685] text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{pais}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selection Controls */}
              <div className="flex items-center gap-3 text-xs shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-semibold text-slate-700 hover:text-[#007685] hover:underline cursor-pointer"
                >
                  {selectedCandidateIds.length === linkedCandidateObjects.length && linkedCandidateObjects.length > 0
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
                {selectedCandidateIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCandidateIds([])}
                    className="font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Clear selection ({selectedCandidateIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Candidates Grid (Tarjetas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedLinkedCandidates.map(({ vinculo, candidato }) => {
                const isSelected = selectedCandidateIds.includes(candidato.id);
                const isCargadoCeipal = vinculo.estadoCeipal === 'cargado';

                return (
                  <div
                    key={candidato.id}
                    onClick={() => handleToggleSelectCandidate(candidato.id)}
                    className={`bg-white border rounded-xl p-4.5 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-[#007685] ring-2 ring-[#007685]/20 bg-[#007685]/[0.02]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Checkbox, Code & Level Badges */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelectCandidate(candidato.id);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#007685] focus:ring-[#007685] cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 leading-tight">
                              {candidato.nombre}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCandidateDetail(candidato);
                              }}
                              className="font-mono font-bold text-[10px] text-[#007685] bg-[#007685]/8 hover:bg-[#007685]/15 border border-[#007685]/20 px-1.5 py-0.2 rounded transition-colors mt-0.5"
                              title="View full specs"
                            >
                              {candidato.id}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {candidato.experienciaTexto}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                            candidato.nivelIngles === 'C1' || candidato.nivelIngles === 'C2'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : candidato.nivelIngles === 'B2'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {candidato.nivelIngles}
                          </span>
                        </div>
                      </div>

                      {/* Location & Country Pills */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F5F5F6] text-slate-800 border border-slate-200">
                          <Globe className="w-3.5 h-3.5 text-[#007685]" />
                          <span>{candidato.ciudad}, {candidato.pais}</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {candidato.modalidad}
                        </span>
                      </div>

                      {/* CEIPAL Pipeline Status Box */}
                      <div>
                        {isCargadoCeipal ? (
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Uploaded to CEIPAL</span>
                            </div>
                            <span className="font-mono text-[11px] bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                              {vinculo.serviceOrderId}
                            </span>
                          </div>
                        ) : vinculo.estadoCeipal === 'error' ? (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Upload Error</span>
                            </div>
                            <span className="font-mono text-[10px] bg-white text-rose-800 px-1.5 py-0.5 rounded border border-rose-300">
                              {vinculo.serviceOrderId || 'Retry'}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Linked to Search</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Pending CEIPAL
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Professional Summary */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {candidato.resumenProfesional}
                      </p>

                      {/* Associated Profiles */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {candidato.perfilesAsociados.map(pId => {
                          const profileName = ALL_PROFILES.find(p => p.id === pId)?.nombre || pId;
                          return (
                            <span
                              key={pId}
                              className="text-[10px] font-medium bg-[#007685]/8 text-[#007685] border border-[#007685]/15 px-2 py-0.5 rounded"
                            >
                              {profileName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCandidateDetail(candidato);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#007685] hover:bg-[#007685]/10 rounded-lg transition-colors flex items-center gap-1 border border-[#007685]/20 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlinkCandidate(candidato.id);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Remove from this search (does not delete from directory)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Modals */}
      {isAddCandidatesModalOpen && (
        <AddCandidatesToBusquedaModal
          busqueda={busqueda}
          onClose={() => setIsAddCandidatesModalOpen(false)}
          onLinkCandidates={handleAddCandidates}
        />
      )}

      {isCeipalModalOpen && (
        <CeipalPipelineModal
          busqueda={busqueda}
          selectedCandidates={selectedCandidateObjects}
          onClose={() => setIsCeipalModalOpen(false)}
          onUploadSuccess={handleCeipalUploadSuccess}
        />
      )}
    </div>
  );
};
