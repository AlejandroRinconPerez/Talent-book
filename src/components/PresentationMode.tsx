import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  HelpCircle, 
  Briefcase, 
  Globe, 
  MapPin, 
  Award,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { Candidato, Vacancy, EvaluacionCandidato } from '../types';
import { evaluarCandidatoConVacante } from '../utils/evaluationEngine';

interface PresentationModeProps {
  candidates: Candidato[];
  vacancy: Vacancy;
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  candidates,
  vacancy,
  onClose
}) => {
  // Compute evaluations for presentation
  const evaluations: Record<string, EvaluacionCandidato> = {};
  candidates.forEach(c => {
    evaluations[c.id] = evaluarCandidatoConVacante(c, vacancy);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F6] overflow-y-auto print:bg-white print:p-0">
      {/* Non-printable Top Bar for Sales Rep controls */}
      <div className="sticky top-0 z-10 bg-[#007685] text-white px-6 py-3 shadow-md flex items-center justify-between print:hidden border-b border-[#005d69]">
        <div className="flex items-center gap-3">
          <div className="relative w-6 h-6 rounded bg-white/15 border border-white/20 text-white flex items-center justify-center font-bold text-xs">
            TB
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#EE7825]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Commercial Presentation Mode Active
            </span>
            <span className="text-xs text-white/80 ml-2 hidden sm:inline">
              (Clean view for screen sharing with clients)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors flex items-center gap-1.5 border border-white/20"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold bg-white text-[#007685] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close presentation</span>
          </button>
        </div>
      </div>

      {/* Main Document Canvas */}
      <main className="max-w-5xl mx-auto my-8 p-6 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm print:border-none print:shadow-none print:my-0 print:p-4">
        {/* Document Header */}
        <header className="border-b border-slate-200 pb-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#EE7825] mb-1">
                Commercial Talent Proposal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {vacancy.titulo || 'Position under Evaluation'}
              </h1>
              {vacancy.cliente && (
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  Prepared for: {vacancy.cliente}
                </div>
              )}
            </div>

            <div className="text-right sm:text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007685]/10 text-[#007685] border border-[#007685]/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#007685]" />
                <span>Qualified Shortlist ({candidates.length} profiles)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Anonymized candidate files compliant with privacy guidelines
              </div>
            </div>
          </div>

          {/* Vacancy Agreed Summary */}
          {vacancy.descripcion && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                Scope & Requested Profile
              </div>
              <p className="leading-relaxed">{vacancy.descripcion}</p>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Base experience:</span> {vacancy.requisitos.experienciaMinimaAnos}+ years
                </div>
                <div>
                  <span className="font-semibold text-slate-800">English level:</span> {vacancy.requisitos.nivelInglesMinimo} minimum
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Work mode:</span> {vacancy.requisitos.modalidad} ({vacancy.requisitos.ubicacionRequerida})
                </div>
                {vacancy.requisitos.habilidadesIndispensables.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-800">Key skills:</span> {vacancy.requisitos.habilidadesIndispensables.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Candidate Dossiers */}
        <section className="space-y-8">
          {candidates.map((cand, index) => {
            const ev = evaluations[cand.id];
            const displayFit = ev ? (
              ev.nivelAjusteGeneral === 'Alto' || ev.nivelAjusteGeneral === 'High' ? 'High'
              : ev.nivelAjusteGeneral === 'Medio' || ev.nivelAjusteGeneral === 'Medium' ? 'Medium'
              : 'Partial with gaps'
            ) : '';

            return (
              <article
                key={cand.id}
                className="border border-slate-200 rounded-xl p-6 sm:p-7 bg-white shadow-2xs hover:border-slate-300 transition-colors break-inside-avoid"
              >
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#007685] text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                      0{index + 1}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {cand.nombre} <span className="font-mono text-sm text-[#007685] font-normal">({cand.id})</span>
                      </h2>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{cand.ciudad}, {cand.pais}</span>
                        <span>·</span>
                        <span>{cand.modalidad} arrangement</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Experience</div>
                      <div className="font-bold text-slate-900 tabular-nums">{cand.experienciaTexto}</div>
                    </div>
                    <div className="text-right border-l border-slate-200 pl-4">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">English Assessed</div>
                      <div className="font-bold text-slate-900">{cand.nivelIngles}</div>
                    </div>
                    <div className="text-right border-l border-slate-200 pl-4">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Availability</div>
                      <div className="font-bold text-slate-900">{cand.disponibilidad}</div>
                    </div>
                  </div>
                </div>

                {/* Professional Pitch */}
                <div className="my-5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Professional Executive Summary
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                    &ldquo;{cand.resumenProfesional}&rdquo;
                  </p>
                </div>

                {/* Trajectory Highlights (Anonymized by Sector) */}
                <div className="my-5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Career Highlights & Achievements
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {cand.trayectoria.map((t, tIdx) => (
                      <div key={tIdx} className="bg-slate-50/60 p-3 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between font-semibold text-slate-900 mb-0.5">
                          <span>{t.cargo}</span>
                          <span className="text-[11px] text-slate-500 font-normal">{t.duracion}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2 italic">
                          Sector: {t.sectorEmpresa}
                        </div>
                        <ul className="space-y-1 text-slate-700">
                          {t.logros.map((l, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-1.5">
                              <span className="text-slate-400">•</span>
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="my-5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Verified Competencies & Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cand.habilidades.map(skill => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fit Evaluation Summary (Safe for Client) */}
                {ev && (
                  <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Match with Requirements
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        displayFit === 'High'
                          ? 'bg-[#007685]/10 text-[#007685] border border-[#007685]/20'
                          : displayFit === 'Medium'
                          ? 'bg-[#F9A831]/15 text-[#8f5200] border border-[#F9A831]/30'
                          : 'bg-[#EE7825]/10 text-[#a33e00] border border-[#EE7825]/20'
                      }`}>
                        Overall Fit: {displayFit}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-3">
                      {ev.sintesisAjuste}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="font-bold text-[#007685] flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#007685]" />
                          Key Strengths for the Role:
                        </span>
                        <ul className="space-y-0.5 text-slate-600 pl-4 list-disc">
                          {ev.requisitosCumplidos.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item.criterio}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-[#EE7825] flex items-center gap-1 mb-1">
                          <HelpCircle className="w-3.5 h-3.5 text-[#EE7825]" />
                          Discussion Points for Interview:
                        </span>
                        <ul className="space-y-0.5 text-slate-600 pl-4 list-disc">
                          {ev.informacionPorValidar.slice(0, 2).map((item, idx) => (
                            <li key={idx}>{item.criterio}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Footer Commercial Note */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-500">
            Talent Book · Professional Talent Sourcing and Staffing Solutions
          </p>
          <p className="mt-1">
            The profiles presented represent a preliminary shortlist for review with the client. No automatic contractual holds are initiated.
          </p>
        </footer>
      </main>
    </div>
  );
};
