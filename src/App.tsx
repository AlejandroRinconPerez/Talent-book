/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { BusquedasListSection } from './components/BusquedasListSection';
import { BusquedaDetailSection } from './components/BusquedaDetailSection';
import { CreateBusquedaModal } from './components/CreateBusquedaModal';
import { BookSection } from './components/BookSection';
import { CandidatesSection } from './components/CandidatesSection';
import { EvaluationSection } from './components/EvaluationSection';
import { PresentationMode } from './components/PresentationMode';
import { INITIAL_BUSQUEDAS, DEMO_USER } from './data/mockBusquedas';
import { MOCK_CANDIDATES } from './data/candidatesData';
import { SAMPLE_VACANCIES } from './utils/evaluationEngine';
import { 
  BusquedaComercial, 
  Candidato, 
  Usuario, 
  Vacancy, 
  VacancyRequisitos 
} from './types';
import { 
  X, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Globe, 
  MapPin, 
  Check, 
  FolderPlus 
} from 'lucide-react';

export default function App() {
  // 1. User Authentication Session (Starts with DEMO_USER for immediate preview accessibility)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(DEMO_USER);

  // 2. Main Navigation Tabs: 'busquedas' (default after login), 'book', 'candidates'
  const [activeTab, setActiveTab] = useState<'busquedas' | 'book' | 'candidates'>('busquedas');

  // Active search ID for detail view (null shows searches list)
  const [activeBusquedaId, setActiveBusquedaId] = useState<string | null>(null);

  // Modal to create new search
  const [isCreateBusquedaModalOpen, setIsCreateBusquedaModalOpen] = useState(false);

  // Searches state (persisted during session)
  const [busquedas, setBusquedas] = useState<BusquedaComercial[]>(INITIAL_BUSQUEDAS);

  // 3. Evaluation sub-view state (when evaluating compatibility from inside a search or standalone)
  const [evaluatingSearchContext, setEvaluatingSearchContext] = useState<{
    searchId?: string;
    searchName: string;
    candidates: Candidato[];
    vacancy: Vacancy;
  } | null>(null);

  // 4. Candidate selection in general catalog
  const [generalSelectedCandidateIds, setGeneralSelectedCandidateIds] = useState<string[]>([
    'CAN-8821',
    'CAN-4432'
  ]);

  // Filter passed from Book to Candidates
  const [candidateFilter, setCandidateFilter] = useState<{
    familia?: string;
    especialidad?: string;
    perfilId?: string;
  }>({});

  // 5. Active candidate detail modal (for inspecting full profile anywhere in the app)
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  // 6. Presentation Mode Overlay
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [presentationCandidates, setPresentationCandidates] = useState<Candidato[]>([]);
  const [presentationVacancy, setPresentationVacancy] = useState<Vacancy>(SAMPLE_VACANCIES[0]);

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveBusquedaId(null);
    setEvaluatingSearchContext(null);
  };

  // Handle Login
  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    setActiveTab('busquedas');
    setActiveBusquedaId(null);
  };

  // Active Busqueda object
  const activeBusqueda = busquedas.find(b => b.id === activeBusquedaId) || null;

  // Create new search handler
  const handleCreateBusqueda = (newBusqueda: BusquedaComercial) => {
    setBusquedas(prev => [newBusqueda, ...prev]);
    setIsCreateBusquedaModalOpen(false);
    // Automatically open the newly created search
    setActiveBusquedaId(newBusqueda.id);
    setActiveTab('busquedas');
  };

  // Update existing search handler
  const handleUpdateBusqueda = (updated: BusquedaComercial) => {
    setBusquedas(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  // Link candidates to an existing search (from Candidates list or selector)
  const handleLinkCandidatesToBusqueda = (busquedaId: string, candidateIds: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    setBusquedas(prev => prev.map(b => {
      if (b.id !== busquedaId) return b;

      const existingIds = new Set(b.candidatosVinculados.map(c => c.candidatoId));
      const newVinculos = candidateIds
        .filter(id => !existingIds.has(id))
        .map(id => ({
          candidatoId: id,
          fechaVinculacion: today,
          estadoCeipal: 'no_cargado' as const
        }));

      return {
        ...b,
        candidatosVinculados: [...b.candidatosVinculados, ...newVinculos]
      };
    }));
  };

  // Navigate from Book to Candidates with pre-applied filter
  const handleNavigateFromBookToCandidates = (filters?: {
    familia?: string;
    especialidad?: string;
    perfilId?: string;
  }) => {
    if (filters) {
      setCandidateFilter(filters);
    }
    setActiveTab('candidates');
  };

  // Handle evaluation from search
  const handleEvaluateFromBusqueda = (
    candidates: Candidato[],
    requisitos: VacancyRequisitos,
    searchName: string
  ) => {
    const customVacancy: Vacancy = {
      titulo: searchName,
      descripcion: activeBusqueda?.descripcion || searchName,
      cliente: activeBusqueda?.clienteEmpresa,
      requisitos: requisitos
    };

    setEvaluatingSearchContext({
      searchId: activeBusqueda?.id,
      searchName,
      candidates,
      vacancy: customVacancy
    });
  };

  // Open presentation mode
  const handleOpenPresentation = (candidatesToPresent: Candidato[]) => {
    const targetCandidates = candidatesToPresent.length > 0 
      ? candidatesToPresent 
      : MOCK_CANDIDATES.slice(0, 3);
    
    setPresentationCandidates(targetCandidates);
    setPresentationVacancy(evaluatingSearchContext?.vacancy || {
      titulo: activeBusqueda?.nombre || "Requerimiento Comercial de Talento",
      descripcion: activeBusqueda?.descripcion || "Resumen de perfil y requerimientos técnicos acordados para la posición.",
      cliente: activeBusqueda?.clienteEmpresa || "Cliente Corporativo",
      requisitos: activeBusqueda?.requisitos || SAMPLE_VACANCIES[0].requisitos
    });
    setIsPresentationMode(true);
  };

  // If user is not logged in, render the login screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F6] text-slate-900 flex flex-col font-sans antialiased">
      {/* 3-Zone Header Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setEvaluatingSearchContext(null);
          if (tab !== 'busquedas') {
            setActiveBusquedaId(null);
          }
        }}
        selectedCount={activeBusqueda ? activeBusqueda.candidatosVinculados.length : generalSelectedCandidateIds.length}
        onOpenPresentation={() => {
          if (activeBusqueda) {
            const candList = activeBusqueda.candidatosVinculados
              .map(cv => MOCK_CANDIDATES.find(c => c.id === cv.candidatoId))
              .filter((c): c is Candidato => c !== undefined);
            handleOpenPresentation(candList);
          } else {
            const candList = MOCK_CANDIDATES.filter(c => generalSelectedCandidateIds.includes(c.id));
            handleOpenPresentation(candList);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* EVALUATION VIEW (When evaluating candidates in context of search) */}
        {evaluatingSearchContext ? (
          <EvaluationSection
            selectedCandidateIds={evaluatingSearchContext.candidates.map(c => c.id)}
            onToggleCandidate={() => {}}
            onClearCandidates={() => {}}
            onNavigateToCandidates={() => {
              setEvaluatingSearchContext(null);
              setActiveTab('candidates');
            }}
            onOpenPresentation={() => handleOpenPresentation(evaluatingSearchContext.candidates)}
            currentVacancy={evaluatingSearchContext.vacancy}
            onUpdateVacancy={(updatedVac) => {
              setEvaluatingSearchContext(prev => prev ? { ...prev, vacancy: updatedVac } : null);
            }}
            onBackToBusqueda={() => setEvaluatingSearchContext(null)}
            busquedaNombre={evaluatingSearchContext.searchName}
          />
        ) : (
          <>
            {/* TAB 1: MIS BÚSQUEDAS */}
            {activeTab === 'busquedas' && (
              <>
                {!activeBusquedaId || !activeBusqueda ? (
                  <BusquedasListSection
                    busquedas={busquedas}
                    onSelectBusqueda={(id) => setActiveBusquedaId(id)}
                    onOpenCreateModal={() => setIsCreateBusquedaModalOpen(true)}
                  />
                ) : (
                  <BusquedaDetailSection
                    busqueda={activeBusqueda}
                    onBackToList={() => setActiveBusquedaId(null)}
                    onUpdateBusqueda={handleUpdateBusqueda}
                    onOpenCandidateDetail={(c) => setActiveCandidateDetail(c)}
                    onEvaluateCompatibility={handleEvaluateFromBusqueda}
                    onOpenPresentation={(cands) => handleOpenPresentation(cands)}
                  />
                )}
              </>
            )}

            {/* TAB 2: BOOK DE PERFILES (Visual Tree & Categories Grid) */}
            {activeTab === 'book' && (
              <BookSection onNavigateToCandidates={handleNavigateFromBookToCandidates} />
            )}

            {/* TAB 3: CANDIDATOS (General Catalog with Linking action) */}
            {activeTab === 'candidates' && (
              <CandidatesSection
                initialFilter={candidateFilter}
                selectedCandidateIds={generalSelectedCandidateIds}
                onToggleCandidate={(id) => {
                  setGeneralSelectedCandidateIds(prev => 
                    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                  );
                }}
                onClearSelection={() => setGeneralSelectedCandidateIds([])}
                onProceedToEvaluate={() => {
                  const selectedCands = MOCK_CANDIDATES.filter(c => generalSelectedCandidateIds.includes(c.id));
                  setEvaluatingSearchContext({
                    searchName: "General Candidate Evaluation",
                    candidates: selectedCands,
                    vacancy: SAMPLE_VACANCIES[0]
                  });
                }}
                busquedas={busquedas}
                onLinkCandidatesToBusqueda={handleLinkCandidatesToBusqueda}
                onRequestCreateBusqueda={() => setIsCreateBusquedaModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Modal: Create Commercial Search */}
      {isCreateBusquedaModalOpen && (
        <CreateBusquedaModal
          onClose={() => setIsCreateBusquedaModalOpen(false)}
          onCreate={handleCreateBusqueda}
          usuarioId={currentUser.id}
        />
      )}

      {/* Global Candidate Detail Drawer / Modal */}
      {activeCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-[#007685] bg-[#007685]/10 px-2.5 py-0.5 rounded">
                    {activeCandidateDetail.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeCandidateDetail.pais} · {activeCandidateDetail.modalidad}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeCandidateDetail.nombre}
                </h2>
              </div>
              <button
                onClick={() => setActiveCandidateDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="py-5 overflow-y-auto space-y-5 text-xs flex-1 pr-1">
              <div>
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                  Professional Summary
                </h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {activeCandidateDetail.resumenProfesional}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#F5F5F6] p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Experience</span>
                  <span className="font-bold text-slate-900">{activeCandidateDetail.experienciaTexto}</span>
                </div>
                <div className="bg-[#F5F5F6] p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">English Level</span>
                  <span className="font-bold text-slate-900">{activeCandidateDetail.nivelIngles}</span>
                </div>
                <div className="bg-[#F5F5F6] p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Location</span>
                  <span className="font-bold text-slate-900">{activeCandidateDetail.pais}</span>
                </div>
                <div className="bg-[#F5F5F6] p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Availability</span>
                  <span className="font-bold text-slate-900">{activeCandidateDetail.disponibilidad}</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                  Skills & Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeCandidateDetail.habilidades.map(h => (
                    <span key={h} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trajectory */}
              <div>
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                  Recent Career History
                </h3>
                <div className="space-y-2">
                  {activeCandidateDetail.trayectoria.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{exp.cargo}</span>
                        <span className="text-slate-400 font-normal">{exp.duracion}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{exp.sectorEmpresa}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setActiveCandidateDetail(null)}
                className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Confidential Presentation Overlay */}
      {isPresentationMode && (
        <PresentationMode
          candidates={presentationCandidates}
          vacancy={presentationVacancy}
          onClose={() => setIsPresentationMode(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Talent Book</span>
            <span>·</span>
            <span>Internal commercial sales tool</span>
            <span>·</span>
            <span className="text-slate-400">Ready for .NET backend on Azure</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ATS integration with CEIPAL and compatibility assessment simulated for commercial validation.
          </div>
        </div>
      </footer>
    </div>
  );
}
