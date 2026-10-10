import React, { useMemo, useState } from 'react';
import { FolderKanban, FolderPlus, Search, ChevronRight } from 'lucide-react';
import { BusquedaComercial, EstadoBusqueda } from '../types';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { formatNumber, plural } from '../utils/format';
import { ESTADO_LABEL, ESTADO_ORDER, relativeTime } from '../utils/activity';
import { StatusChip } from './shared/badges';

interface BusquedasListSectionProps {
  busquedas: BusquedaComercial[];
  onSelectBusqueda: (busquedaId: string) => void;
  onOpenCreateModal: () => void;
}

type StatusFilter = 'all' | EstadoBusqueda;

const THIRTY_DAYS = 30 * 86400000;

export const BusquedasListSection: React.FC<BusquedasListSectionProps> = ({ busquedas, onSelectBusqueda, onOpenCreateModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Pipeline figures, computed from the searches themselves
  const kpis = useMemo(() => {
    const now = Date.now();
    const active = busquedas.filter(b => b.estado !== 'cerrada');
    const inPipeline = active.reduce((sum, b) => sum + b.candidatosVinculados.filter(cv => cv.etapa !== 'descartado').length, 0);
    const inCeipal = busquedas.reduce((sum, b) => sum + b.candidatosVinculados.filter(cv => cv.estadoCeipal === 'cargado').length, 0);
    const presentedRecently = busquedas.reduce(
      (sum, b) => sum + b.actividad.filter(a => a.tipo === 'presentada' && now - new Date(a.fecha).getTime() < THIRTY_DAYS).length,
      0
    );
    return { active: active.length, inPipeline, inCeipal, presentedRecently };
  }, [busquedas]);

  const countByStatus = useMemo(() => {
    const map: Record<EstadoBusqueda, number> = { abierta: 0, en_proceso: 0, cerrada: 0 };
    busquedas.forEach(b => (map[b.estado] += 1));
    return map;
  }, [busquedas]);

  const filteredBusquedas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return busquedas
      .filter(b => statusFilter === 'all' || b.estado === statusFilter)
      .filter(
        b =>
          !term ||
          b.nombre.toLowerCase().includes(term) ||
          b.id.toLowerCase().includes(term) ||
          (b.clienteEmpresa?.toLowerCase().includes(term) ?? false) ||
          b.descripcion.toLowerCase().includes(term) ||
          (b.perfilNombre?.toLowerCase().includes(term) ?? false)
      )
      .sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
  }, [busquedas, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My searches</h1>
          <p className="page-lede">
            One search per client requirement. Link candidates from the Book or the pool, evaluate fit, then export the shortlist to CEIPAL
            or present it.
          </p>
        </div>
        <Button variant="primary" icon={<FolderPlus className="size-4" />} onClick={onOpenCreateModal} data-tour="new-search">
          New search
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4" data-tour="kpis">
        <Kpi label="Active searches" value={kpis.active} />
        <Kpi label="Candidates in process" value={kpis.inPipeline} />
        <Kpi label="Exported to CEIPAL" value={kpis.inCeipal} />
        <Kpi label="Presentations, last 30 days" value={kpis.presentedRecently} />
      </dl>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Filter by status</legend>
          <button type="button" className="pill" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            All <span className="pill-count">{busquedas.length}</span>
          </button>
          {ESTADO_ORDER.map(estado => (
            <button key={estado} type="button" className="pill" aria-pressed={statusFilter === estado} onClick={() => setStatusFilter(estado)}>
              {ESTADO_LABEL[estado]} <span className="pill-count">{countByStatus[estado]}</span>
            </button>
          ))}
        </fieldset>

        <div className="relative w-full md:max-w-sm">
          <label htmlFor="search-filter" className="sr-only">
            Filter searches
          </label>
          <Search className="input-icon" />
          <input
            id="search-filter"
            type="search"
            name="search-filter"
            autoComplete="off"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter by name, client, ID or profile…"
            className="input input-with-icon"
          />
        </div>
      </div>

      <p className="text-[13px] text-ink-3" aria-live="polite">
        {plural(filteredBusquedas.length, 'search', 'searches')}
        {searchTerm ? ` matching “${searchTerm}”` : ''}
        {statusFilter !== 'all' ? `, ${ESTADO_LABEL[statusFilter].toLowerCase()}` : ''}. Sorted by last update.
      </p>

      {filteredBusquedas.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<FolderKanban className="size-5" />}
            title={searchTerm || statusFilter !== 'all' ? 'No searches match' : 'No searches yet'}
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Clear the filters or create a new search.'
                : 'Create a search for your first client requirement.'
            }
            action={
              searchTerm || statusFilter !== 'all' ? (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={onOpenCreateModal}>
                  Create search
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="panel divide-y divide-rule">
          {filteredBusquedas.map(busqueda => {
            const linked = busqueda.candidatosVinculados;
            const ceipal = linked.filter(c => c.estadoCeipal === 'cargado').length;
            const advanced = linked.filter(c => c.etapa === 'entrevista' || c.etapa === 'oferta').length;
            const presented = linked.filter(c => c.etapa === 'presentado').length;

            return (
              <li key={busqueda.id} className="group relative grid gap-3 px-5 py-4 hover:bg-well/60 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="text-base font-semibold leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectBusqueda(busqueda.id)}
                        className="stretch text-left text-ink hover:text-brand-ink focus-visible:outline-none"
                      >
                        {busqueda.nombre}
                      </button>
                    </h2>
                    <StatusChip estado={busqueda.estado} />
                    <span className="code text-[13px] text-ink-3" translate="no">
                      {busqueda.id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-2">
                    {busqueda.clienteEmpresa ?? <span className="italic text-ink-3">Client not specified</span>}
                    {busqueda.perfilNombre ? (
                      <>
                        <span className="mx-2 text-rule-strong" aria-hidden="true">
                          /
                        </span>
                        <span className="text-ink-3">Book profile:</span> {busqueda.perfilNombre}
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1.5 line-clamp-2 max-w-[80ch] text-[13px] leading-relaxed text-ink-2">{busqueda.descripcion}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink-2 md:flex-col md:items-end md:gap-1 md:text-right">
                  <span className="tabular-nums">
                    <strong className="font-semibold text-ink">{linked.length}</strong> {linked.length === 1 ? 'candidate' : 'candidates'}
                    {presented > 0 ? `, ${presented} presented` : ''}
                    {advanced > 0 ? `, ${advanced} in interview or offer` : ''}
                  </span>
                  <span className="tabular-nums text-ink-3">
                    {ceipal > 0 ? <span className="text-ok">{ceipal} in CEIPAL</span> : 'Not in CEIPAL'}
                    <span className="mx-2 text-rule-strong" aria-hidden="true">
                      /
                    </span>
                    Updated {relativeTime(busqueda.actualizadoEn)}
                  </span>
                </div>

                <ChevronRight
                  className="absolute right-4 top-1/2 hidden size-4 -translate-y-1/2 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 md:block"
                  aria-hidden="true"
                />
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-brand/30 group-focus-within:ring-2" aria-hidden="true" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-surface px-5 py-4">
    <dt className="text-[13px] text-ink-3">{label}</dt>
    <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{formatNumber(value)}</dd>
  </div>
);
