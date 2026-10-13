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
import { BusquedaComercial, Candidato, EtapaCandidato, Usuario, Vacancy, VacancyRequisitos } from './types';
import type { PresentationPlan } from './components/PresentationBuilderModal';

// Only the default view (searches list) ships in the main chunk; every other screen loads when opened
const BusquedaDetailSection = lazy(() => import('./components/BusquedaDetailSection').then(m => ({ default: m.BusquedaDetailSection })));
const BookSection = lazy(() => import('./components/BookSection').then(m => ({ default: m.BookSection })));
const CandidatesSection = lazy(() => import('./components/CandidatesSection').then(m => ({ default: m.CandidatesSection })));
const EvaluationSection = lazy(() => import('./components/EvaluationSection').then(m => ({ default: m.EvaluationSection })));
const PresentationMode = lazy(() => import('./components/PresentationMode').then(m => ({ default: m.PresentationMode })));
const PresentationBuilderModal = lazy(() => import('./components/PresentationBuilderModal').then(m => ({ default: m.PresentationBuilderModal })));
const CreateBusquedaModal = lazy(() => import('./components/CreateBusquedaModal').then(m => ({ default: m.CreateBusquedaModal })));
const CandidateDetailModal = lazy(() => import('./components/shared/CandidateDetailModal').then(m => ({ default: m.CandidateDetailModal })));
const GlobalSearch = lazy(() => import('./components/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
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

/** What the presentation builder was opened with. */
interface PresentationDraft {
  candidates: Candidato[];
  vacancy: Vacancy;
  searchId?: string;
}

/** Workspace restored from the browser, or the seed on first run. */
const initialWorkspace = loadWorkspace();

const isTypingTarget = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
};

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // "/" or Ctrl/Cmd+K opens global search when no field or dialog has focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isCmdK = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey);
      if (!isSlash && !isCmdK) return;
      if (isSlash && isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setIsSearchOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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

  // Filter passed from Book to Candidates, and a profile to open in the Book (from global search)
  const [candidateFilter, setCandidateFilter] = useState<{ familia?: string; especialidad?: string; perfilId?: string }>({});
  const [bookFocus, setBookFocus] = useState<{ profileId: string; key: number } | null>(null);

  // 5. Candidate detail modal (inspect a full profile from anywhere)
  const [activeCandidateDetail, setActiveCandidateDetail] = useState<Candidato | null>(null);

  // 6. Presentation: builder draft, then the dossier itself
  const [presentationDraft, setPresentationDraft] = useState<PresentationDraft | null>(null);
  const [presentation, setPresentation] = useState<(PresentationPlan & { vacancy: Vacancy }) | null>(null);

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

  /** Opens the builder. Inside a search the vacancy and the last presentation come from it. */
  const requestPresentation = (candidatesToPresent: Candidato[]) => {
    const targetCandidates = candidatesToPresent.length > 0 ? candidatesToPresent : MOCK_CANDIDATES.slice(0, 3);
    const searchContext = evaluatingSearchContext?.searchId ? busquedas.find(b => b.id === evaluatingSearchContext.searchId) ?? null : activeBusqueda;
    const vacancy: Vacancy = evaluatingSearchContext?.vacancy ?? {
      titulo: searchContext?.nombre || 'Talent requirement',
      descripcion: searchContext?.descripcion || 'Profile summary and technical requirements agreed for the position.',
      cliente: searchContext?.clienteEmpresa || 'Client',
      requisitos: searchContext?.requisitos || SAMPLE_VACANCIES[0].requisitos
    };

    // Reuse the last presented order when it exists
    const lastOrder = searchContext?.ultimaPresentacion?.candidatoIds;
    const ordered = lastOrder
      ? [...targetCandidates].sort((a, b) => {
          const ia = lastOrder.indexOf(a.id);
          const ib = lastOrder.indexOf(b.id);
          return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
        })
      : targetCandidates;

    setPresentationDraft({ candidates: ordered, vacancy, searchId: searchContext?.id });
  };

  /** Builder confirmed: remember the plan on the search, move shortlisted candidates to Presented, open the dossier. */
  const handleConfirmPresentation = (plan: PresentationPlan) => {
    const draft = presentationDraft;
    setPresentationDraft(null);
    if (!draft) return;

    if (draft.searchId) {
      const presentedIds = new Set(plan.candidates.map(c => c.id));
      setBusquedas(prev =>
        prev.map(b => {
          if (b.id !== draft.searchId) return b;
          const updated: BusquedaComercial = {
            ...b,
            candidatosVinculados: b.candidatosVinculados.map(cv =>
              presentedIds.has(cv.candidatoId) && (cv.etapa ?? 'shortlist') === 'shortlist' ? { ...cv, etapa: 'presentado' as const } : cv
            ),
            ultimaPresentacion: {
              candidatoIds: plan.candidates.map(c => c.id),
              notaPortada: plan.coverNote || undefined,
              incluirAjuste: plan.includeFit,
              fecha: new Date().toISOString()
            }
          };
          return withActivity(updated, 'presentada', `Presented ${plural(plan.candidates.length, 'candidate')}${b.clienteEmpresa ? ` to ${b.clienteEmpresa}` : ''}.`);
        })
      );
    }

    setPresentation({ ...plan, vacancy: draft.vacancy });
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const headerSelectedCount = activeBusqueda
    ? activeBusqueda.candidatosVinculados.filter(cv => CANDIDATE_BY_ID.has(cv.candidatoId)).length
    : generalSelectedCandidateIds.length;

  const draftSearch = presentationDraft?.searchId ? busquedas.find(b => b.id === presentationDraft.searchId) : undefined;
  const draftStages: ReadonlyMap<string, EtapaCandidato | undefined> | undefined = draftSearch
    ? new Map(draftSearch.candidatosVinculados.map(cv => [cv.candidatoId, cv.etapa]))
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-50 rounded-md bg-inverse px-3 py-2 text-sm font-medium text-on-inverse">
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
            requestPresentation(activeBusqueda.candidatosVinculados.flatMap(cv => CANDIDATE_BY_ID.get(cv.candidatoId) ?? []));
          } else {
            requestPresentation(generalSelectedCandidateIds.flatMap(id => CANDIDATE_BY_ID.get(id) ?? []));
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartTour={() => {
          setEvaluatingSearchContext(null);
          setIsTourOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
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
              onOpenPresentation={() => requestPresentation(evaluatingSearchContext.candidates)}
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
                    onOpenPresentation={cands => requestPresentation(cands)}
                  />
                )
              ) : null}

              {activeTab === 'book' ? <BookSection onNavigateToCandidates={handleNavigateFromBookToCandidates} focusProfile={bookFocus} /> : null}

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

        {presentationDraft ? (
          <PresentationBuilderModal
            candidates={presentationDraft.candidates}
            initialSelectedIds={
              draftSearch?.ultimaPresentacion
                ? presentationDraft.candidates.filter(c => draftSearch.ultimaPresentacion!.candidatoIds.includes(c.id)).map(c => c.id)
                : presentationDraft.candidates.filter(c => draftStages?.get(c.id) !== 'descartado').map(c => c.id)
            }
            initialCoverNote={draftSearch?.ultimaPresentacion?.notaPortada}
            initialIncludeFit={draftSearch?.ultimaPresentacion?.incluirAjuste ?? true}
            stages={draftStages}
            clientName={presentationDraft.vacancy.cliente}
            onClose={() => setPresentationDraft(null)}
            onConfirm={handleConfirmPresentation}
          />
        ) : null}

        {presentation ? (
          <PresentationMode
            candidates={presentation.candidates}
            vacancy={presentation.vacancy}
            coverNote={presentation.coverNote}
            includeFit={presentation.includeFit}
            onClose={() => setPresentation(null)}
          />
        ) : null}

        {isSearchOpen ? (
          <GlobalSearch
            busquedas={busquedas}
            onClose={() => setIsSearchOpen(false)}
            onOpenSearch={id => {
              setEvaluatingSearchContext(null);
              setActiveBusquedaId(id);
            }}
            onOpenProfile={profileId => {
              setEvaluatingSearchContext(null);
              setBookFocus(prev => ({ profileId, key: (prev?.key ?? 0) + 1 }));
              setActiveTab('book');
            }}
            onOpenCandidate={candidateId => {
              const c = CANDIDATE_BY_ID.get(candidateId);
              if (c) setActiveCandidateDetail(c);
            }}
          />
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
