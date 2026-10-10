import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Eye, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Sparkles, 
  FileText, 
  Briefcase, 
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Candidato, Vacancy, EvaluacionCandidato, NivelIngles } from '../types';
import { MOCK_CANDIDATES } from '../data/candidatesData';
import { SAMPLE_VACANCIES, evaluarCandidatoConVacante } from '../utils/evaluationEngine';

interface EvaluationSectionProps {
  selectedCandidateIds: string[];
  onToggleCandidate: (id: string) => void;
  onClearCandidates: () => void;
  onNavigateToCandidates: () => void;
  onOpenPresentation: () => void;
  currentVacancy: Vacancy;
  onUpdateVacancy: (vacancy: Vacancy) => void;
  onBackToBusqueda?: () => void;
  busquedaNombre?: string;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  selectedCandidateIds,
  onToggleCandidate,
  onClearCandidates,
  onNavigateToCandidates,
  onOpenPresentation,
  currentVacancy,
  onUpdateVacancy,
  onBackToBusqueda,
  busquedaNombre
}) => {
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(true); // initially evaluated if candidates exist
  const [showEditRequirements, setShowEditRequirements] = useState<boolean>(false);

  // New skill input states for requirements editor
  const [newMustSkill, setNewMustSkill] = useState('');
  const [newNiceSkill, setNewNiceSkill] = useState('');

  // Selected candidates data
  const selectedCandidates = useMemo(() => {
    return MOCK_CANDIDATES.filter(c => selectedCandidateIds.includes(c.id));
  }, [selectedCandidateIds]);

  // Evaluations calculated using the qualitative evaluation engine
  const evaluations: EvaluacionCandidato[] = useMemo(() => {
    return selectedCandidates.map(c => evaluarCandidatoConVacante(c, currentVacancy));
  }, [selectedCandidates, currentVacancy]);

  // Load sample vacancy preset
  const handleLoadSample = (sample: Vacancy) => {
    onUpdateVacancy({ ...sample });
    setHasEvaluated(true);
  };

  // Run evaluation simulation
  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setHasEvaluated(true);
    }, 450);
  };

  // Add must-have skill
  const handleAddMustSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMustSkill.trim()) return;
    onUpdateVacancy({
      ...currentVacancy,
      requisitos: {
        ...currentVacancy.requisitos,
        habilidadesIndispensables: [...currentVacancy.requisitos.habilidadesIndispensables, newMustSkill.trim()]
      }
    });
    setNewMustSkill('');
  };

  // Remove must-have skill
  const handleRemoveMustSkill = (skill: string) => {
    onUpdateVacancy({
      ...currentVacancy,
      requisitos: {
        ...currentVacancy.requisitos,
        habilidadesIndispensables: currentVacancy.requisitos.habilidadesIndispensables.filter(s => s !== skill)
      }
    });
  };

  // Add nice-to-have skill
  const handleAddNiceSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNiceSkill.trim()) return;
    onUpdateVacancy({
      ...currentVacancy,
      requisitos: {
        ...currentVacancy.requisitos,
        habilidadesDeseables: [...currentVacancy.requisitos.habilidadesDeseables, newNiceSkill.trim()]
      }
    });
    setNewNiceSkill('');
  };

  // Remove nice-to-have skill
  const handleRemoveNiceSkill = (skill: string) => {
    onUpdateVacancy({
      ...currentVacancy,
      requisitos: {
        ...currentVacancy.requisitos,
        habilidadesDeseables: currentVacancy.requisitos.habilidadesDeseables.filter(s => s !== skill)
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Commercial Module
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-[#EE7825] bg-[#EE7825]/8 px-2 py-0.5 rounded font-medium border border-[#EE7825]/20">
              Simulated Evaluation without Generative AI
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Job Vacancy Compatibility Evaluation
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Compare selected candidates against specific client job requirements. Analyze qualifications, gaps, and points to validate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBackToBusqueda && (
            <button
              onClick={onBackToBusqueda}
              className="px-3 py-2 text-xs font-semibold text-[#007685] bg-[#007685]/10 hover:bg-[#007685]/20 border border-[#007685]/20 rounded-lg transition-colors flex items-center gap-1.5"
              title="Return to search details"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to search</span>
            </button>
          )}

          <button
            onClick={onNavigateToCandidates}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Return to catalog while keeping current vacancy"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Adjust filters</span>
          </button>

          <button
            onClick={onOpenPresentation}
            disabled={selectedCandidates.length === 0}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              selectedCandidates.length > 0
                ? 'bg-[#007685] text-white hover:bg-[#005d69]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Present selection ({selectedCandidates.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Vacancy Formulation (Left 1/3) + Compatibility Matrix (Right 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vacancy Setup & Editable Requirements (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Client Job Vacancy
              </h2>

              <button
                onClick={() => setShowEditRequirements(!showEditRequirements)}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {showEditRequirements ? 'Hide matrix' : 'Edit requirements'}
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                Load sample vacancy for demonstration:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_VACANCIES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadSample(s)}
                    className="text-[11px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md transition-colors text-left"
                  >
                    {idx === 0 ? '💻 Tech: Frontend Dev' : idx === 1 ? '👔 Support: Bilingual Assistant' : '📊 Finance: Auditor / Accounting'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Description Inputs */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={currentVacancy.titulo}
                  onChange={(e) => onUpdateVacancy({ ...currentVacancy, titulo: e.target.value })}
                  placeholder="e.g. Bilingual Senior Frontend Developer"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Commercial Need
                </label>
                <textarea
                  rows={4}
                  value={currentVacancy.descripcion}
                  onChange={(e) => onUpdateVacancy({ ...currentVacancy, descripcion: e.target.value })}
                  placeholder="Paste or write the requirements discussed with the client..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Editable Requirements Panel */}
            <div className={`space-y-4 pt-3 border-t border-slate-100 ${showEditRequirements ? 'block' : 'hidden'}`}>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Evaluation Parameters
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={currentVacancy.requisitos.experienciaMinimaAnos}
                    onChange={(e) => onUpdateVacancy({
                      ...currentVacancy,
                      requisitos: {
                        ...currentVacancy.requisitos,
                        experienciaMinimaAnos: parseInt(e.target.value) || 0
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Min English Level
                  </label>
                  <select
                    value={currentVacancy.requisitos.nivelInglesMinimo}
                    onChange={(e) => onUpdateVacancy({
                      ...currentVacancy,
                      requisitos: {
                        ...currentVacancy.requisitos,
                        nivelInglesMinimo: e.target.value as NivelIngles
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900"
                  >
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Pre-Intermediate</option>
                    <option value="B2">B2 - Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Bilingual / Native</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Arrangement
                  </label>
                  <select
                    value={currentVacancy.requisitos.modalidad}
                    onChange={(e) => onUpdateVacancy({
                      ...currentVacancy,
                      requisitos: {
                        ...currentVacancy.requisitos,
                        modalidad: e.target.value
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Required Location
                  </label>
                  <input
                    type="text"
                    value={currentVacancy.requisitos.ubicacionRequerida}
                    onChange={(e) => onUpdateVacancy({
                      ...currentVacancy,
                      requisitos: {
                        ...currentVacancy.requisitos,
                        ubicacionRequerida: e.target.value
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Habilidades Indispensables (Must-Have) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Essential Skills (Must-Have)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {currentVacancy.requisitos.habilidadesIndispensables.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs bg-[#007685] text-white rounded flex items-center gap-1"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveMustSkill(skill)}
                        className="hover:text-rose-300"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddMustSkill} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newMustSkill}
                    onChange={(e) => setNewMustSkill(e.target.value)}
                    placeholder="Add essential skill..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded p-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700"
                  >
                    +
                  </button>
                </form>
              </div>

              {/* Habilidades Deseables (Nice-To-Have) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Desirable Skills (Nice-To-Have)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {currentVacancy.requisitos.habilidadesDeseables.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded flex items-center gap-1"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveNiceSkill(skill)}
                        className="hover:text-rose-500"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddNiceSkill} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newNiceSkill}
                    onChange={(e) => setNewNiceSkill(e.target.value)}
                    placeholder="Add desirable skill..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded p-1 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-slate-200 text-slate-800 text-xs rounded hover:bg-slate-300"
                  >
                    +
                  </button>
                </form>
              </div>
            </div>

            {/* Evaluate Action Button */}
            <div className="pt-2">
              <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating || selectedCandidates.length === 0}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs ${
                  selectedCandidates.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isEvaluating
                    ? 'bg-slate-700 text-white cursor-wait'
                    : 'bg-[#007685] text-white hover:bg-[#005d69]'
                }`}
              >
                {isEvaluating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Calculating compatibility...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run candidates evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Candidates Evaluation Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Selected Candidates ({selectedCandidates.length})</span>
            </h2>

            {selectedCandidates.length > 0 && (
              <button
                onClick={onClearCandidates}
                className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>

          {selectedCandidates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No candidates in evaluation
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Select candidates from the &ldquo;Candidates&rdquo; or &ldquo;Talent Book&rdquo; tab to evaluate their fit against this job vacancy.
              </p>
              <button
                onClick={onNavigateToCandidates}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Explore candidates to add</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evalResult) => {
                const candidate = selectedCandidates.find(c => c.id === evalResult.candidatoId)!;
                if (!candidate) return null;

                const displayFit = evalResult.nivelAjusteGeneral === 'Alto' || evalResult.nivelAjusteGeneral === 'High' 
                  ? 'High' 
                  : evalResult.nivelAjusteGeneral === 'Medio' || evalResult.nivelAjusteGeneral === 'Medium' 
                  ? 'Medium' 
                  : 'Partial with gaps';

                return (
                  <div
                    key={candidate.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
                  >
                    {/* Candidate Evaluation Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-bold text-sm text-slate-900 block leading-tight">
                            {candidate.nombre}
                          </span>
                          <span className="font-mono font-bold text-[10px] text-[#007685] tabular-nums bg-[#007685]/8 px-1.5 py-0.2 rounded border border-[#007685]/15 mt-0.5 inline-block">
                            {candidate.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span>{candidate.experienciaTexto} exp</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span>English: {candidate.nivelIngles}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span>{candidate.ciudad}, {candidate.pais}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Qualitative Level Indicator (NO percentages) */}
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${
                          displayFit === 'High'
                            ? 'bg-[#007685]/10 text-[#007685] border border-[#007685]/20'
                            : displayFit === 'Medium'
                            ? 'bg-[#F9A831]/15 text-[#8f5200] border border-[#F9A831]/30'
                            : 'bg-[#EE7825]/10 text-[#a33e00] border border-[#EE7825]/20'
                        }`}>
                          Fit: {displayFit}
                        </span>

                        <button
                          onClick={() => onToggleCandidate(candidate.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove from evaluation"
                          aria-label={`Remove candidate ${candidate.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Candidate Evaluation Body */}
                    <div className="p-5 space-y-4 text-xs">
                      {/* Qualitative Synthesis */}
                      <div className="bg-slate-50 border-l-2 border-[#007685] p-3 rounded-r-lg">
                        <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wide mb-1">
                          Commercial Fit Assessment
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {evalResult.sintesisAjuste}
                        </p>
                      </div>

                      {/* Criteria Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Requisitos Cumplidos */}
                        <div className="bg-[#007685]/[0.03] border border-[#007685]/20 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007685] uppercase tracking-wide mb-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#007685]" />
                            <span>Met ({evalResult.requisitosCumplidos.length})</span>
                          </div>
                          {evalResult.requisitosCumplidos.length === 0 ? (
                            <p className="text-[11px] text-[#007685] italic">No explicit requirements met.</p>
                          ) : (
                            <ul className="space-y-2">
                              {evalResult.requisitosCumplidos.map((item, idx) => (
                                <li key={idx} className="text-slate-700 text-[11px]">
                                  <div className="font-semibold text-slate-900">{item.criterio}</div>
                                  <div className="text-slate-600 mt-0.5 text-[10px] leading-tight">{item.detalle}</div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* 2. Brechas Encontradas (Distinguishes 'No cumple' strictly) */}
                        <div className="bg-[#EE7825]/[0.03] border border-[#EE7825]/20 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#EE7825] uppercase tracking-wide mb-2">
                            <XCircle className="w-3.5 h-3.5 text-[#EE7825]" />
                            <span>Gaps ({evalResult.brechasEncontradas.length})</span>
                          </div>
                          {evalResult.brechasEncontradas.length === 0 ? (
                            <p className="text-[11px] text-[#007685]">No critical gaps identified.</p>
                          ) : (
                            <ul className="space-y-2">
                              {evalResult.brechasEncontradas.map((item, idx) => (
                                <li key={idx} className="text-slate-700 text-[11px]">
                                  <div className="font-semibold text-slate-900">{item.criterio}</div>
                                  <div className="text-slate-600 mt-0.5 text-[10px] leading-tight">{item.detalle}</div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* 3. Por Validar (Distinguishes 'Sin información suficiente') */}
                        <div className="bg-[#20BFD0]/[0.06] border border-[#20BFD0]/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007685] uppercase tracking-wide mb-2">
                            <HelpCircle className="w-3.5 h-3.5 text-[#007685]" />
                            <span>To Validate ({evalResult.informacionPorValidar.length})</span>
                          </div>
                          <ul className="space-y-2">
                            {evalResult.informacionPorValidar.map((item, idx) => (
                              <li key={idx} className="text-slate-700 text-[11px]">
                                <div className="font-semibold text-sky-950">{item.criterio}</div>
                                <div className="text-slate-600 mt-0.5 text-[10px] leading-tight">{item.detalle}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
