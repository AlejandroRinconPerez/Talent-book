import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  SlidersHorizontal,
  ShieldCheck,
  UploadCloud,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  FolderPlus,
  UserMinus,
  Send,
  ArrowRightLeft,
  CircleDot,
  Columns3,
  FileSpreadsheet
} from 'lucide-react';
import { ActividadBusqueda, BusquedaComercial, Candidato, CandidatoVinculadoBusqueda, EstadoBusqueda, EtapaCandidato, NivelIngles, VacancyRequisitos } from '../types';
import { CANDIDATE_BY_ID } from '../data/indexes';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Field } from './ui/Field';
import { Toast } from './ui/Toast';
import { StageChip, StatusChip, englishRequirementLabel, modalityLabel } from './shared/badges';
import { CandidateCard } from './shared/CandidateCard';
import { formatDate, plural, todayIso } from '../utils/format';
import { ACTIVIDAD_LABEL, ESTADO_LABEL, ESTADO_ORDER, ETAPA_LABEL, ETAPA_ORDER, relativeTime, withActivity } from '../utils/activity';

import { exportSearchWorkbook } from '../utils/exportCandidates';

// Modals load on first use; they are not part of the detail view's initial render
const CeipalPipelineModal = lazy(() => import('./CeipalPipelineModal').then(m => ({ default: m.CeipalPipelineModal })));
const AddCandidatesToBusquedaModal = lazy(() => import('./AddCandidatesToBusquedaModal').then(m => ({ default: m.AddCandidatesToBusquedaModal })));
const CompareCandidatesModal = lazy(() => import('./CompareCandidatesModal').then(m => ({ default: m.CompareCandidatesModal })));

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
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isAddCandidatesModalOpen, setIsAddCandidatesModalOpen] = useState(false);
  const [isCeipalModalOpen, setIsCeipalModalOpen] = useState(false);
  const [showEditRequirements, setShowEditRequirements] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const [editableRequisitos, setEditableRequisitos] = useState<VacancyRequisitos>(busqueda.requisitos);
  const [editableDescripcion, setEditableDescripcion] = useState(busqueda.descripcion);
  const [isSavingReqs, setIsSavingReqs] = useState(false);

  // Undo window for "Remove from search"
  const [toast, setToast] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<{ vinculo: CandidatoVinculadoBusqueda; index: number } | null>(null);

  const linkedCandidateObjects = useMemo(
    () =>
      busqueda.candidatosVinculados.flatMap(cv => {
        const candidato = CANDIDATE_BY_ID.get(cv.candidatoId);
        return candidato ? [{ vinculo: cv, candidato }] : [];
      }),
    [busqueda.candidatosVinculados]
  );

  const selectedIdSet = useMemo(() => new Set(selectedCandidateIds), [selectedCandidateIds]);
  const selectedCandidateObjects = linkedCandidateObjects.filter(item => selectedIdSet.has(item.candidato.id)).map(item => item.candidato);

  const [selectedCountryFilters, setSelectedCountryFilters] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<EtapaCandidato | 'all'>('all');

  const uniqueCountriesInSearch = useMemo(() => {
    const map = new Map<string, number>();
    linkedCandidateObjects.forEach(({ candidato }) => map.set(candidato.pais, (map.get(candidato.pais) || 0) + 1));
    return Array.from(map.entries()).map(([pais, count]) => ({ pais, count }));
  }, [linkedCandidateObjects]);

  const stageCounts = useMemo(() => {
    const map = new Map<EtapaCandidato, number>();
    linkedCandidateObjects.forEach(({ vinculo }) => {
      const etapa = vinculo.etapa ?? 'shortlist';
      map.set(etapa, (map.get(etapa) ?? 0) + 1);
    });
    return map;
  }, [linkedCandidateObjects]);

  const displayedLinkedCandidates = useMemo(
    () =>
      linkedCandidateObjects.filter(
        ({ candidato, vinculo }) =>
          (selectedCountryFilters.length === 0 || selectedCountryFilters.includes(candidato.pais)) &&
          (stageFilter === 'all' || (vinculo.etapa ?? 'shortlist') === stageFilter)
      ),
    [linkedCandidateObjects, selectedCountryFilters, stageFilter]
  );

  const toggleCountryFilter = (country: string) =>
    setSelectedCountryFilters(prev => (prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]));

  const handleToggleSelectCandidate = (id: string) =>
    setSelectedCandidateIds(prev => (prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]));

  const allSelected = selectedCandidateIds.length === linkedCandidateObjects.length && linkedCandidateObjects.length > 0;
  const handleSelectAll = () => setSelectedCandidateIds(allSelected ? [] : linkedCandidateObjects.map(item => item.candidato.id));

  /* ---------------- mutations, each logged in the activity timeline ---------------- */

  const handleStatusChange = (estado: EstadoBusqueda) => {
    if (estado === busqueda.estado) return;
    onUpdateBusqueda(withActivity({ ...busqueda, estado }, 'estado_cambiado', `Status changed to ${ESTADO_LABEL[estado]}.`));
    setToast(`Search marked as ${ESTADO_LABEL[estado].toLowerCase()}.`);
  };

  const handleStageChange = (candidato: Candidato, etapa: EtapaCandidato) => {
    const updated = {
      ...busqueda,
      candidatosVinculados: busqueda.candidatosVinculados.map(cv => (cv.candidatoId === candidato.id ? { ...cv, etapa } : cv))
    };
    onUpdateBusqueda(withActivity(updated, 'etapa_cambiada', `${candidato.nombre} moved to ${ETAPA_LABEL[etapa]}.`));
  };

  const handleUnlinkCandidate = (candidato: Candidato) => {
    const index = busqueda.candidatosVinculados.findIndex(cv => cv.candidatoId === candidato.id);
    if (index === -1) return;
    const vinculo = busqueda.candidatosVinculados[index];
    onUpdateBusqueda(
      withActivity(
        { ...busqueda, candidatosVinculados: busqueda.candidatosVinculados.filter(cv => cv.candidatoId !== candidato.id) },
        'candidato_retirado',
        `${candidato.nombre} removed from the search.`
      )
    );
    setSelectedCandidateIds(prev => prev.filter(id => id !== candidato.id));
    setLastRemoved({ vinculo, index });
    setToast(`Removed ${candidato.nombre} from this search.`);
  };

  const handleUndoRemove = () => {
    if (!lastRemoved) return;
    const restored = [...busqueda.candidatosVinculados];
    restored.splice(Math.min(lastRemoved.index, restored.length), 0, lastRemoved.vinculo);
    onUpdateBusqueda(withActivity({ ...busqueda, candidatosVinculados: restored }, 'candidatos_vinculados', 'Removal undone; candidate restored.'));
    setLastRemoved(null);
    setToast(null);
  };

  const dismissToast = useCallback(() => {
    setToast(null);
    setLastRemoved(null);
  }, []);

  const handleAddCandidates = (newCandidateIds: string[]) => {
    const today = todayIso();
    const newVinculos = newCandidateIds
      .filter(id => !busqueda.candidatosVinculados.some(cv => cv.candidatoId === id))
      .map(id => ({ candidatoId: id, fechaVinculacion: today, estadoCeipal: 'no_cargado' as const, etapa: 'shortlist' as const }));
    if (newVinculos.length === 0) return;
    onUpdateBusqueda(
      withActivity(
        { ...busqueda, candidatosVinculados: [...busqueda.candidatosVinculados, ...newVinculos] },
        'candidatos_vinculados',
        `Linked ${plural(newVinculos.length, 'candidate')} from the pool.`
      )
    );
    setToast(`Linked ${plural(newVinculos.length, 'candidate')} to this search.`);
  };

  const handleCeipalUploadSuccess = (results: { candidatoId: string; serviceOrderId: string; estado: 'cargado' | 'error' }[]) => {
    const today = todayIso();
    const updatedVinculos = busqueda.candidatosVinculados.map(cv => {
      const match = results.find(r => r.candidatoId === cv.candidatoId);
      if (!match) return cv;
      return { ...cv, estadoCeipal: match.estado, serviceOrderId: match.serviceOrderId, fechaCargaCeipal: match.estado === 'cargado' ? today : undefined };
    });
    const ok = results.filter(r => r.estado === 'cargado').length;
    const so = results[0]?.serviceOrderId;
    onUpdateBusqueda(
      withActivity(
        { ...busqueda, candidatosVinculados: updatedVinculos },
        'exportado_ceipal',
        `Exported ${plural(ok, 'candidate')} to service order ${so}${results.length - ok > 0 ? `; ${results.length - ok} failed` : ''}.`
      )
    );
  };

  const handleSaveRequirements = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingReqs(true);
    setTimeout(() => {
      onUpdateBusqueda(
        withActivity({ ...busqueda, descripcion: editableDescripcion, requisitos: editableRequisitos }, 'criterios_actualizados', 'Vacancy criteria updated.')
      );
      setIsSavingReqs(false);
      setShowEditRequirements(false);
      setToast('Criteria saved.');
    }, 300);
  };

  const evaluationTargets = selectedCandidateObjects.length > 0 ? selectedCandidateObjects : linkedCandidateObjects.map(i => i.candidato);
  const targetCount = evaluationTargets.length;

  // Presenting opens the builder (choose, order, cover note); the app logs the activity on confirm
  const handlePresent = () => onOpenPresentation(evaluationTargets);

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const canCompare = selectedCandidateObjects.length >= 2 && selectedCandidateObjects.length <= 4;
  const compareVacancy = useMemo(
    () => ({ titulo: busqueda.nombre, descripcion: busqueda.descripcion, cliente: busqueda.clienteEmpresa, requisitos: busqueda.requisitos }),
    [busqueda.nombre, busqueda.descripcion, busqueda.clienteEmpresa, busqueda.requisitos]
  );

  const visibleActivity = showAllActivity ? busqueda.actividad : busqueda.actividad.slice(0, 6);
  const isClosed = busqueda.estado === 'cerrada';

  return (
    <div className="space-y-8">
      {/* 1. Search header */}
      <div>
        <button
          type="button"
          onClick={onBackToList}
          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[13px] font-medium text-ink-2 hover:text-brand-ink"
        >
          <ArrowLeft className="size-3.5" />
          My searches
        </button>

        <div className="page-header mt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
              <span className="code" translate="no">
                {busqueda.id}
              </span>
              <span>Created {formatDate(busqueda.fechaCreacion)}</span>
              <span>Updated {relativeTime(busqueda.actualizadoEn)}</span>
              {busqueda.perfilNombre ? <span>Book profile: {busqueda.perfilNombre}</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="page-title">{busqueda.nombre}</h1>
              <StatusChip estado={busqueda.estado} />
            </div>
            {busqueda.clienteEmpresa ? <p className="mt-1 text-base font-medium text-ink-2">{busqueda.clienteEmpresa}</p> : null}
            <p className="page-lede">{busqueda.descripcion}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div>
              <label htmlFor="search-status" className="sr-only">
                Search status
              </label>
              <select id="search-status" value={busqueda.estado} onChange={e => handleStatusChange(e.target.value as EstadoBusqueda)} className="input select w-auto">
                {ESTADO_ORDER.map(estado => (
                  <option key={estado} value={estado}>
                    {ESTADO_LABEL[estado]}
                  </option>
                ))}
              </select>
            </div>
            <Button
              icon={<SlidersHorizontal className="size-4" />}
              onClick={() => setShowEditRequirements(v => !v)}
              aria-expanded={showEditRequirements}
              aria-controls="criteria-editor"
            >
              {showEditRequirements ? 'Close criteria' : 'Edit criteria'}
            </Button>
            <Button
              variant="commercial"
              icon={<Presentation className="size-4" />}
              onClick={handlePresent}
              disabled={linkedCandidateObjects.length === 0}
              title="Open the clean client view for screen sharing"
            >
              Present {targetCount > 0 ? `(${targetCount})` : ''}
            </Button>
          </div>
        </div>

        <dl className="facts mt-5">
          <div>
            <dt>Experience</dt>
            <dd className="tabular-nums">{busqueda.requisitos.experienciaMinimaAnos}+ years</dd>
          </div>
          <div>
            <dt>English</dt>
            <dd>{englishRequirementLabel(busqueda.requisitos.nivelInglesMinimo)}</dd>
          </div>
          <div>
            <dt>Work mode</dt>
            <dd>{modalityLabel(busqueda.requisitos.modalidad)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{busqueda.requisitos.ubicacionRequerida}</dd>
          </div>
          <div>
            <dt>Must-have skills</dt>
            <dd>{busqueda.requisitos.habilidadesIndispensables.join(', ') || '—'}</dd>
          </div>
        </dl>

        {showEditRequirements ? (
          <form id="criteria-editor" onSubmit={handleSaveRequirements} className="panel mt-6 animate-fade">
            <div className="panel-head">
              <h2 className="text-base font-semibold">Vacancy criteria</h2>
              <p className="text-[13px] text-ink-3">Used by the fit evaluation.</p>
            </div>
            <div className="panel-body space-y-5">
              <Field id="edit-descripcion" label="Description">
                <textarea rows={3} value={editableDescripcion} onChange={e => setEditableDescripcion(e.target.value)} className="input textarea" />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field id="edit-exp" label="Minimum experience (years)">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={15}
                    value={editableRequisitos.experienciaMinimaAnos}
                    onChange={e => setEditableRequisitos({ ...editableRequisitos, experienciaMinimaAnos: Number(e.target.value) })}
                    className="input tabular-nums"
                  />
                </Field>
                <Field id="edit-english" label="Minimum English">
                  <select
                    value={editableRequisitos.nivelInglesMinimo}
                    onChange={e => setEditableRequisitos({ ...editableRequisitos, nivelInglesMinimo: e.target.value as NivelIngles })}
                    className="input select"
                  >
                    <option value="Sin información">Not required</option>
                    <option value="B1">B1, intermediate</option>
                    <option value="B2">B2, professional</option>
                    <option value="C1">C1, advanced</option>
                    <option value="C2">C2, bilingual</option>
                  </select>
                </Field>
                <Field id="edit-modality" label="Work mode">
                  <select value={editableRequisitos.modalidad} onChange={e => setEditableRequisitos({ ...editableRequisitos, modalidad: e.target.value })} className="input select">
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </Field>
                <Field id="edit-location" label="Location">
                  <input
                    type="text"
                    autoComplete="off"
                    value={editableRequisitos.ubicacionRequerida}
                    onChange={e => setEditableRequisitos({ ...editableRequisitos, ubicacionRequerida: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setShowEditRequirements(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSavingReqs} loadingLabel="Saving…">
                  Save criteria
                </Button>
              </div>
            </div>
          </form>
        ) : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_19rem]">
        {/* 2. Linked candidates */}
        <section aria-labelledby="linked-heading" className="panel min-w-0">
          <div className="panel-head">
            <div className="flex items-center gap-3">
              <h2 id="linked-heading" className="text-base font-semibold">
                Linked candidates <span className="tabular-nums text-ink-3">({linkedCandidateObjects.length})</span>
              </h2>
              {selectedCandidateIds.length > 0 ? <span className="chip chip-brand tabular-nums">{selectedCandidateIds.length} selected</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" icon={<UserPlus className="size-4" />} onClick={() => setIsAddCandidatesModalOpen(true)} disabled={isClosed}>
                Add candidates
              </Button>
              <Button
                size="sm"
                icon={<ShieldCheck className="size-4" />}
                onClick={() => onEvaluateCompatibility(evaluationTargets, busqueda.requisitos, busqueda.nombre)}
                disabled={linkedCandidateObjects.length === 0}
                title="Compare candidates against this search's criteria"
              >
                Evaluate fit {targetCount > 0 ? `(${targetCount})` : ''}
              </Button>
              <Button
                size="sm"
                icon={<Columns3 className="size-4" />}
                onClick={() => setIsCompareOpen(true)}
                disabled={!canCompare}
                title={canCompare ? 'Compare the selected candidates side by side' : 'Select 2 to 4 candidates to compare'}
              >
                Compare {selectedCandidateObjects.length > 0 ? `(${selectedCandidateObjects.length})` : ''}
              </Button>
              <Button
                size="sm"
                icon={<FileSpreadsheet className="size-4" />}
                onClick={() => exportSearchWorkbook(busqueda)}
                disabled={linkedCandidateObjects.length === 0}
                title="Download this shortlist with its pipeline state as an Excel file"
              >
                Export to Excel
              </Button>
              <Button
                variant="commercial"
                size="sm"
                icon={<UploadCloud className="size-4" />}
                onClick={() => setIsCeipalModalOpen(true)}
                disabled={selectedCandidateIds.length === 0 || isClosed}
                title={selectedCandidateIds.length === 0 ? 'Select at least one candidate to export' : 'Export selected candidates to a CEIPAL service order'}
              >
                Export to CEIPAL {selectedCandidateIds.length > 0 ? `(${selectedCandidateIds.length})` : ''}
              </Button>
            </div>
          </div>

          {isClosed ? (
            <p className="border-b border-rule bg-well/60 px-5 py-2.5 text-[13px] text-ink-2">
              This search is closed. Reopen it from the status control to add or export candidates.
            </p>
          ) : null}

          {linkedCandidateObjects.length === 0 ? (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No candidates linked yet"
              description="Add candidates from the pool to build this client's shortlist."
              action={
                <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => setIsAddCandidatesModalOpen(true)} disabled={isClosed}>
                  Add candidates
                </Button>
              }
            />
          ) : (
            <div className="panel-body space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <fieldset className="flex flex-wrap items-center gap-1.5">
                    <legend className="sr-only">Filter by stage</legend>
                    <button type="button" className="pill" aria-pressed={stageFilter === 'all'} onClick={() => setStageFilter('all')}>
                      All <span className="pill-count">{linkedCandidateObjects.length}</span>
                    </button>
                    {ETAPA_ORDER.filter(etapa => (stageCounts.get(etapa) ?? 0) > 0).map(etapa => (
                      <button key={etapa} type="button" className="pill" aria-pressed={stageFilter === etapa} onClick={() => setStageFilter(etapa)}>
                        {ETAPA_LABEL[etapa]} <span className="pill-count">{stageCounts.get(etapa)}</span>
                      </button>
                    ))}
                  </fieldset>
                  {uniqueCountriesInSearch.length > 1 ? (
                    <fieldset className="flex flex-wrap items-center gap-1.5">
                      <legend className="sr-only">Filter by country</legend>
                      {uniqueCountriesInSearch.map(({ pais, count }) => (
                        <button key={pais} type="button" className="pill" aria-pressed={selectedCountryFilters.includes(pais)} onClick={() => toggleCountryFilter(pais)}>
                          {pais} <span className="pill-count">{count}</span>
                        </button>
                      ))}
                    </fieldset>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-[13px]">
                  <button type="button" onClick={handleSelectAll} className="font-medium text-brand-ink hover:underline">
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  {selectedCandidateIds.length > 0 && !allSelected ? (
                    <button type="button" onClick={() => setSelectedCandidateIds([])} className="text-ink-2 hover:text-ink hover:underline">
                      Clear selection
                    </button>
                  ) : null}
                </div>
              </div>

              {displayedLinkedCandidates.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-3">No linked candidates match these filters.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {displayedLinkedCandidates.map(({ vinculo, candidato }) => {
                    const stageId = `stage-${candidato.id}`;

                    return (
                      <CandidateCard
                        key={candidato.id}
                        candidate={candidato}
                        idPrefix="linked"
                        selected={selectedIdSet.has(candidato.id)}
                        onToggleSelect={handleToggleSelectCandidate}
                        onOpenProfile={onOpenCandidateDetail}
                        summaryLines={2}
                        badge={<StageChip etapa={vinculo.etapa} />}
                        stageControl={
                          <>
                            <label htmlFor={stageId} className="text-[13px] text-ink-3">
                              Stage
                            </label>
                            <select
                              id={stageId}
                              value={vinculo.etapa ?? 'shortlist'}
                              onChange={e => handleStageChange(candidato, e.target.value as EtapaCandidato)}
                              className="input select h-8 w-auto text-[13px]"
                            >
                              {ETAPA_ORDER.map(etapa => (
                                <option key={etapa} value={etapa}>
                                  {ETAPA_LABEL[etapa]}
                                </option>
                              ))}
                            </select>
                          </>
                        }
                        actions={
                          <Button
                            size="sm"
                            variant="danger-ghost"
                            icon={<Trash2 className="size-4" />}
                            className="above -mr-2"
                            onClick={() => handleUnlinkCandidate(candidato)}
                            title="Remove from this search. The candidate stays in the pool."
                          >
                            Remove
                          </Button>
                        }
                      >
                        <CeipalStatus vinculo={vinculo} />
                      </CandidateCard>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* 3. Activity */}
        <aside aria-labelledby="activity-heading" className="panel lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100dvh-6rem)] lg:flex-col">
          <div className="panel-head">
            <h2 id="activity-heading" className="flex items-center gap-2 text-base font-semibold">
              <History className="size-4 text-ink-3" />
              Activity
            </h2>
            <span className="text-[13px] tabular-nums text-ink-3">{busqueda.actividad.length}</span>
          </div>
          <ol className="px-5 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            {visibleActivity.map((entry, idx) => (
              <ActivityRow key={`${entry.fecha}-${idx}`} entry={entry} isLast={idx === visibleActivity.length - 1} />
            ))}
          </ol>
          {busqueda.actividad.length > 6 ? (
            <div className="border-t border-rule px-5 py-3">
              <button type="button" onClick={() => setShowAllActivity(v => !v)} className="text-[13px] font-medium text-brand-ink hover:underline">
                {showAllActivity ? 'Show recent only' : `Show all ${busqueda.actividad.length} entries`}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      <Toast message={toast} onDismiss={dismissToast} onUndo={lastRemoved ? handleUndoRemove : undefined} durationMs={lastRemoved ? 7000 : 4000} />

      <Suspense fallback={null}>
        {isAddCandidatesModalOpen ? (
          <AddCandidatesToBusquedaModal busqueda={busqueda} onClose={() => setIsAddCandidatesModalOpen(false)} onLinkCandidates={handleAddCandidates} />
        ) : null}

        {isCeipalModalOpen ? (
          <CeipalPipelineModal
            busqueda={busqueda}
            selectedCandidates={selectedCandidateObjects}
            onClose={() => setIsCeipalModalOpen(false)}
            onUploadSuccess={handleCeipalUploadSuccess}
          />
        ) : null}

        {isCompareOpen && canCompare ? (
          <CompareCandidatesModal candidates={selectedCandidateObjects} vacancy={compareVacancy} onClose={() => setIsCompareOpen(false)} onOpenProfile={onOpenCandidateDetail} />
        ) : null}
      </Suspense>
    </div>
  );
};

const ACTIVITY_ICON: Record<ActividadBusqueda['tipo'], React.ReactNode> = {
  creada: <FolderPlus className="size-3.5" />,
  candidatos_vinculados: <UserPlus className="size-3.5" />,
  candidato_retirado: <UserMinus className="size-3.5" />,
  criterios_actualizados: <SlidersHorizontal className="size-3.5" />,
  exportado_ceipal: <UploadCloud className="size-3.5" />,
  presentada: <Send className="size-3.5" />,
  etapa_cambiada: <ArrowRightLeft className="size-3.5" />,
  estado_cambiado: <CircleDot className="size-3.5" />
};

const ActivityRow: React.FC<{ entry: ActividadBusqueda; isLast: boolean }> = ({ entry, isLast }) => (
  <li className="relative flex gap-3 pb-4 last:pb-0">
    {!isLast ? <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-0.75rem)] w-px bg-rule" /> : null}
    <span className="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-rule bg-surface text-ink-3">
      {ACTIVITY_ICON[entry.tipo]}
    </span>
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-ink">{ACTIVIDAD_LABEL[entry.tipo]}</p>
      <p className="text-[13px] leading-snug text-ink-2">{entry.detalle}</p>
      <time dateTime={entry.fecha} className="text-xs text-ink-3" title={new Date(entry.fecha).toLocaleString('en')}>
        {relativeTime(entry.fecha)}
      </time>
    </div>
  </li>
);

/** CEIPAL sync state for a linked candidate. Structure encodes the state: color only where it changes. */
const CeipalStatus: React.FC<{ vinculo: CandidatoVinculadoBusqueda }> = ({ vinculo }) => {
  if (vinculo.estadoCeipal === 'cargado') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-ok/25 bg-ok-wash px-2.5 py-1.5 text-[13px] text-ok">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          In CEIPAL
        </span>
        <span className="code" translate="no">
          {vinculo.serviceOrderId}
        </span>
      </div>
    );
  }
  if (vinculo.estadoCeipal === 'error') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-danger/25 bg-danger-wash px-2.5 py-1.5 text-[13px] text-danger">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <AlertCircle className="size-4 shrink-0" />
          Export failed
        </span>
        <span>Select and export again</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-rule bg-well px-2.5 py-1.5 text-[13px] text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-4 shrink-0 text-ink-3" />
        Not in CEIPAL yet
      </span>
      <span className="text-ink-3">Linked {formatDate(vinculo.fechaVinculacion)}</span>
    </div>
  );
};
