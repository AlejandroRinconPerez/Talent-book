/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Header, MainTab } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { BusquedasListSection } from './components/BusquedasListSection';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { Toast } from './components/ui/Toast';
import { TOUR_STEPS } from './components/ui/tourSteps';
import { INITIAL_BUSQUEDAS, DEMO_USER } from './data/mockBusquedas';
import { MOCK_CANDIDATES } from './data/candidatesData';
import { CANDIDATE_BY_ID } from './data/indexes';
import { SAMPLE_VACANCIES } from './utils/evaluationEngine';
import { plural, todayIso } from './utils/format';
import { withActivity, relativeTime } from './utils/activity';
import { clearWorkspace, exportWorkspaceFile, importWorkspaceFile, loadWorkspace, saveWorkspace } from './services/storage';
import { BusquedaComercial, Candidato, Usuario, Vacancy, VacancyRequisitos } from './types';

// Only the default view (searches list) ships in the main chunk; every other screen loads when opened
const BusquedaDetailSection = lazy(() => import('./components/BusquedaDetailSection').then(m => ({ default: m.BusquedaDetailSection })));
const BookSection = lazy(() => import('./components/BookSection').then(m => ({ default: m.BookSection })));
const CandidatesSection = lazy(() => import('./components/CandidatesSection').then(m => ({ default: m.CandidatesSection })));
const EvaluationSection = lazy(() => import('./components/EvaluationSection').then(m => ({ default: m.EvaluationSection })));
const PresentationMode = lazy(() => import('./components/PresentationMode').then(m => ({ default: m.PresentationMode })));
const CreateBusquedaModal = lazy(() => import('./components/CreateBusquedaModal').then(m => ({ default: m.CreateBusquedaModal })));
const CandidateDetailModal = lazy(() => import('./components/shared/CandidateDetailModal').then(m => ({ default: m.CandidateDetailModal })));
const Tour = lazy(() => import('./components/ui/Tour').then(m => ({ default: m.Tour })));

const SectionFallback = (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading">
    <div className="h-9 w-72 rounded-md bg-rule/70" />
    <div className="h-4 w-[36rem] max-w-full rounded bg-rule/60" />
    <div className="panel h-64" />
  </div>
);

/* ------------------------------------------------------------------ */
/* URL state: the main tab and the open search live in the hash so     */
/* views can be deep-linked and the back button works.                 */
/* ------------------------------------------------------------------ */
interface Route {
  tab: MainTab;
  busquedaId: string | null;
}

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const [segment, id] = path.split('/');
  if (segment === 'book') return { tab: 'book', busquedaId: null };
  if (segment === 'candidates') return { tab: 'candidates', busquedaId: null };
  return { tab: 'busquedas', busquedaId: segment === 'searches' && id ? decodeURIComponent(id) : null };
}

function toHash(route: Route): string {
  if (route.tab === 'book') return '#/book';
  if (route.tab === 'candidates') return '#/candidates';
  return route.busquedaId ? `#/searches/${encodeURIComponent(route.busquedaId)}` : '#/searches';
}

/** Workspace restored from the browser, or the seed on first run. */
const initialWorkspace = loadWorkspace();

export default function App() {
  // 1. User session (starts signed in with the demo user for immediate preview)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(DEMO_USER);

  // 2. Main navigation, mirrored in the URL hash
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const { tab: activeTab, busquedaId: activeBusquedaId } = route;

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    const hash = toHash(next);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    if (!window.location.hash) window.history.replaceState(null, '', toHash(route));
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveTab = (tab: MainTab) => navigate({ tab, busquedaId: null });
  const setActiveBusquedaId = (id: string | null) => navigate({ tab: 'busquedas', busquedaId: id });

  // 3. Workspace: searches and catalog selection, persisted locally
  const [busquedas, setBusquedas] = useState<BusquedaComercial[]>(initialWorkspace?.busquedas ?? INITIAL_BUSQUEDAS);
  const [generalSelectedCandidateIds, setGeneralSelectedCandidateIds] = useState<string[]>(
    initialWorkspace?.selectedCandidateIds ?? ['CAN-8821', 'CAN-4432']
  );
  const [savedAt, setSavedAt] = useState<string | null>(initialWorkspace?.savedAt ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    // Skip the first run so restoring the workspace does not immediately rewrite it
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const stamp = saveWorkspace({ busquedas, selectedCandidateIds: generalSelectedCandidateIds });
      if (stamp) setSavedAt(stamp);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [busquedas, generalSelectedCandidateIds]);

  const handleExportData = () => {
    exportWorkspaceFile({ busquedas, selectedCandidateIds: generalSelectedCandidateIds });
    setToast('Workspace exported as JSON.');
  };

  const handleImportData = async (file: File) => {
    const result = await importWorkspaceFile(file);
    if (!result.ok) {
      setToast(`Could not import: ${result.reason}`);
      return;
    }
    setBusquedas(result.workspace.busquedas);
    setGeneralSelectedCandidateIds(result.workspace.selectedCandidateIds);
    navigate({ tab: 'busquedas', busquedaId: null });
    setToast(`Imported ${plural(result.workspace.busquedas.length, 'search', 'searches')}.`);
  };

  const handleResetData = () => {
    clearWorkspace();
    setBusquedas(INITIAL_BUSQUEDAS);
    setGeneralSelectedCandidateIds(['CAN-8821', 'CAN-4432']);
    setIsResetConfirmOpen(false);
    navigate({ tab: 'busquedas', busquedaId: null });
    setToast('Demo data restored.');
  };

  const dismissToast = useCallback(() => setToast(null), []);

  // Modal to create new search
  const [isCreateBusquedaModalOpen, setIsCreateBusquedaModalOpen] = useState(false);

  // 4. Evaluation sub-view (evaluating fit from inside a search or standalone)
  const [evaluatingSearchContext, setEvaluatingSearchContext] = useState<{
    searchId?: string;
    searchName: string;
    candidates: Candidato[];
    vacancy: Vacancy;
  } | null>(null);

  // Filter passed from Book to Candidates
  const [candidateFilter, setCandidateFilter] = useState<{ familia?: string; especialidad?: string; perfilId?: string }>({});

  // 5. Candidate detail modal (inspect a full profile from anywhere)
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  // 6. Presentation mode overlay
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [presentationCandidates, setPresentationCandidates] = useState<Candidato[]>([]);
  const [presentationVacancy, setPresentationVacancy] = useState<Vacancy>(SAMPLE_VACANCIES[0]);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate({ tab: 'busquedas', busquedaId: null });
    setEvaluatingSearchContext(null);
  };

  const handleLoginSuccess = (user: Usuario) => {
    setCurrentUser(user);
    navigate({ tab: 'busquedas', busquedaId: null });
  };

  const activeBusqueda = busquedas.find(b => b.id === activeBusquedaId) || null;

  const handleCreateBusqueda = (newBusqueda: BusquedaComercial) => {
    setBusquedas(prev => [newBusqueda, ...prev]);
    setIsCreateBusquedaModalOpen(false);
    navigate({ tab: 'busquedas', busquedaId: newBusqueda.id });
    setToast(`Search ${newBusqueda.id} created.`);
  };

  const handleUpdateBusqueda = (updated: BusquedaComercial) => {
    setBusquedas(prev => prev.map(b => (b.id === updated.id ? updated : b)));
  };

  // Link candidates to an existing search (from the candidate list or selector)
  const handleLinkCandidatesToBusqueda = (busquedaId: string, candidateIds: string[]) => {
    const today = todayIso();
    setBusquedas(prev =>
      prev.map(b => {
        if (b.id !== busquedaId) return b;
        const existingIds = new Set(b.candidatosVinculados.map(c => c.candidatoId));
        const newVinculos = candidateIds
          .filter(id => !existingIds.has(id))
          .map(id => ({ candidatoId: id, fechaVinculacion: today, estadoCeipal: 'no_cargado' as const, etapa: 'shortlist' as const }));
        if (newVinculos.length === 0) return b;
        return withActivity(
          { ...b, candidatosVinculados: [...b.candidatosVinculados, ...newVinculos] },
          'candidatos_vinculados',
          `Linked ${plural(newVinculos.length, 'candidate')} from the pool.`
        );
      })
    );
  };

  const handleNavigateFromBookToCandidates = (filters?: { familia?: string; especialidad?: string; perfilId?: string }) => {
    if (filters) setCandidateFilter(filters);
    setActiveTab('candidates');
  };

  const handleEvaluateFromBusqueda = (candidates: Candidato[], requisitos: VacancyRequisitos, searchName: string) => {
    setEvaluatingSearchContext({
      searchId: activeBusqueda?.id,
      searchName,
      candidates,
      vacancy: {
        titulo: searchName,
        descripcion: activeBusqueda?.descripcion || searchName,
        cliente: activeBusqueda?.clienteEmpresa,
        requisitos
      }
    });
    window.scrollTo({ top: 0 });
  };

  const handleOpenPresentation = (candidatesToPresent: Candidato[]) => {
    const targetCandidates = candidatesToPresent.length > 0 ? candidatesToPresent : MOCK_CANDIDATES.slice(0, 3);

    setPresentationCandidates(targetCandidates);
    setPresentationVacancy(
      evaluatingSearchContext?.vacancy || {
        titulo: activeBusqueda?.nombre || 'Talent requirement',
        descripcion: activeBusqueda?.descripcion || 'Profile summary and technical requirements agreed for the position.',
        cliente: activeBusqueda?.clienteEmpresa || 'Client',
        requisitos: activeBusqueda?.requisitos || SAMPLE_VACANCIES[0].requisitos
      }
    );
    setIsPresentationMode(true);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const headerSelectedCount = activeBusqueda
    ? activeBusqueda.candidatosVinculados.filter(cv => CANDIDATE_BY_ID.has(cv.candidatoId)).length
    : generalSelectedCandidateIds.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-50 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white">
        Skip to main content
      </a>

      <Header
        activeTab={activeTab}
        onSelectTab={tab => {
          setEvaluatingSearchContext(null);
          setActiveTab(tab);
        }}
        selectedCount={headerSelectedCount}
        onOpenPresentation={() => {
          if (activeBusqueda) {
            handleOpenPresentation(activeBusqueda.candidatosVinculados.flatMap(cv => CANDIDATE_BY_ID.get(cv.candidatoId) ?? []));
          } else {
            handleOpenPresentation(generalSelectedCandidateIds.flatMap(id => CANDIDATE_BY_ID.get(id) ?? []));
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartTour={() => {
          setEvaluatingSearchContext(null);
          setIsTourOpen(true);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={() => setIsResetConfirmOpen(true)}
      />

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={SectionFallback}>
          {evaluatingSearchContext ? (
            <EvaluationSection
              selectedCandidateIds={evaluatingSearchContext.candidates.map(c => c.id)}
              onToggleCandidate={id =>
                setEvaluatingSearchContext(prev => (prev ? { ...prev, candidates: prev.candidates.filter(c => c.id !== id) } : null))
              }
              onClearCandidates={() => setEvaluatingSearchContext(prev => (prev ? { ...prev, candidates: [] } : null))}
              onNavigateToCandidates={() => {
                setEvaluatingSearchContext(null);
                setActiveTab('candidates');
              }}
              onOpenPresentation={() => handleOpenPresentation(evaluatingSearchContext.candidates)}
              currentVacancy={evaluatingSearchContext.vacancy}
              onUpdateVacancy={updatedVac => setEvaluatingSearchContext(prev => (prev ? { ...prev, vacancy: updatedVac } : null))}
              onBackToBusqueda={evaluatingSearchContext.searchId ? () => setEvaluatingSearchContext(null) : undefined}
              busquedaNombre={evaluatingSearchContext.searchName}
            />
          ) : (
            <>
              {activeTab === 'busquedas' ? (
                !activeBusquedaId || !activeBusqueda ? (
                  <BusquedasListSection
                    busquedas={busquedas}
                    onSelectBusqueda={id => setActiveBusquedaId(id)}
                    onOpenCreateModal={() => setIsCreateBusquedaModalOpen(true)}
                  />
                ) : (
                  <BusquedaDetailSection
                    busqueda={activeBusqueda}
                    onBackToList={() => setActiveBusquedaId(null)}
                    onUpdateBusqueda={handleUpdateBusqueda}
                    onOpenCandidateDetail={c => setActiveCandidateDetail(c)}
                    onEvaluateCompatibility={handleEvaluateFromBusqueda}
                    onOpenPresentation={cands => handleOpenPresentation(cands)}
                  />
                )
              ) : null}

              {activeTab === 'book' ? <BookSection onNavigateToCandidates={handleNavigateFromBookToCandidates} /> : null}

              {activeTab === 'candidates' ? (
                <CandidatesSection
                  initialFilter={candidateFilter}
                  selectedCandidateIds={generalSelectedCandidateIds}
                  onToggleCandidate={id => {
                    setGeneralSelectedCandidateIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
                  }}
                  onClearSelection={() => setGeneralSelectedCandidateIds([])}
                  onProceedToEvaluate={() => {
                    const selectedCands = generalSelectedCandidateIds.flatMap(id => CANDIDATE_BY_ID.get(id) ?? []);
                    setEvaluatingSearchContext({
                      searchName: 'Candidate evaluation',
                      candidates: selectedCands,
                      vacancy: SAMPLE_VACANCIES[0]
                    });
                    window.scrollTo({ top: 0 });
                  }}
                  busquedas={busquedas}
                  onLinkCandidatesToBusqueda={handleLinkCandidatesToBusqueda}
                  onRequestCreateBusqueda={() => setIsCreateBusquedaModalOpen(true)}
                />
              ) : null}
            </>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {isCreateBusquedaModalOpen ? (
          <CreateBusquedaModal onClose={() => setIsCreateBusquedaModalOpen(false)} onCreate={handleCreateBusqueda} usuarioId={currentUser.id} />
        ) : null}

        {activeCandidateDetail ? <CandidateDetailModal candidate={activeCandidateDetail} onClose={() => setActiveCandidateDetail(null)} /> : null}

        {isPresentationMode ? (
          <PresentationMode candidates={presentationCandidates} vacancy={presentationVacancy} onClose={() => setIsPresentationMode(false)} />
        ) : null}

        {isTourOpen ? (
          <Tour
            steps={TOUR_STEPS}
            onNavigate={tab => {
              if (activeTab !== tab || activeBusquedaId) setActiveTab(tab);
            }}
            onClose={() => setIsTourOpen(false)}
          />
        ) : null}
      </Suspense>

      {isResetConfirmOpen ? (
        <Modal
          size="sm"
          title="Reset demo data?"
          description="This discards every change saved in this browser and reloads the sample searches. Export first if you want to keep them."
          onClose={() => setIsResetConfirmOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsResetConfirmOpen(false)}>
                Keep my data
              </Button>
              <Button variant="primary" onClick={handleResetData}>
                Reset demo data
              </Button>
            </>
          }
        >
          <p className="text-ink-2">
            You have {plural(busquedas.length, 'search', 'searches')} in this workspace
            {savedAt ? `, last saved ${relativeTime(savedAt)}` : ''}.
          </p>
        </Modal>
      ) : null}

      <Toast message={toast} onDismiss={dismissToast} />

      <footer className="border-t border-rule bg-surface px-4 py-4 text-xs text-ink-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="font-semibold text-ink-2" translate="no">
              Talent Book
            </span>{' '}
            functional mockup with sample data. Candidates and clients are fictional; the CEIPAL integration is simulated.
          </span>
          <span aria-live="polite">{savedAt ? `Saved in this browser ${relativeTime(savedAt)}` : 'Changes are saved in this browser'}</span>
        </div>
      </footer>
    </div>
  );
}
