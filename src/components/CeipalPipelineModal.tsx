import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, RotateCcw, UploadCloud, AlertTriangle, Info } from 'lucide-react';
import { Candidato, BusquedaComercial, ServiceOrderSimulada } from '../types';
import {
  validarServiceOrderCeipal,
  cargarCandidatosAPipelineCeipal,
  verificarDisponibilidadCandidatos,
  ValidationStatus,
  CandidateUploadResult,
  DisponibilidadCandidato
} from '../services/ceipalMockService';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Modal } from './ui/Modal';
import { CandidateId } from './shared/badges';
import { formatDate, plural } from '../utils/format';

interface CeipalPipelineModalProps {
  busqueda: BusquedaComercial;
  selectedCandidates: Candidato[];
  onClose: () => void;
  onUploadSuccess: (results: { candidatoId: string; serviceOrderId: string; estado: 'cargado' | 'error' }[]) => void;
}

const EXAMPLE_ORDERS = ['SO-99214', 'SO-88301', 'SO-00000'];

export const CeipalPipelineModal: React.FC<CeipalPipelineModalProps> = ({ busqueda, selectedCandidates, onClose, onUploadSuccess }) => {
  const [serviceOrderId, setServiceOrderId] = useState('SO-99214');
  const [validationState, setValidationState] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validatedSO, setValidatedSO] = useState<ServiceOrderSimulada | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<CandidateUploadResult[] | null>(null);

  // Staffing check, run right after the service order validates
  const [availability, setAvailability] = useState<DisponibilidadCandidato[] | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Link records by candidate id, so the list below does one lookup per row
  const vinculoById = useMemo(() => new Map(busqueda.candidatosVinculados.map(cv => [cv.candidatoId, cv])), [busqueda.candidatosVinculados]);

  // Candidates already uploaded to this service order
  const candidatesAlreadyUploaded = busqueda.candidatosVinculados
    .filter(cv => cv.estadoCeipal === 'cargado' && cv.serviceOrderId === serviceOrderId)
    .map(cv => cv.candidatoId);

  // Changing the ID after validating requires validating again
  const resetValidation = () => {
    setValidationState('idle');
    setValidationMessage('');
    setValidatedSO(null);
    setAvailability(null);
  };

  const availabilityById = useMemo(() => new Map((availability ?? []).map(a => [a.candidatoId, a])), [availability]);

  // Candidates CEIPAL reports as already staffed elsewhere; they are skipped by the export.
  const blockedCandidates = availability ? selectedCandidates.filter(c => availabilityById.get(c.id)?.status === 'on_assignment') : [];
  const exportableCandidates = availability ? selectedCandidates.filter(c => availabilityById.get(c.id)?.status !== 'on_assignment') : selectedCandidates;
  const readyToExport = validationState === 'valid' && availability !== null && exportableCandidates.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceOrderId(e.target.value);
    if (validationState !== 'idle') resetValidation();
  };

  const handleValidateSO = async () => {
    if (!serviceOrderId.trim()) {
      setValidationState('error');
      setValidationMessage('Enter the service order ID, for example SO-99214.');
      return;
    }

    setValidationState('validating');
    setValidationMessage('');
    setValidatedSO(null);

    const result = await validarServiceOrderCeipal(serviceOrderId);
    setValidationState(result.status);
    setValidationMessage(result.message || '');
    if (result.status !== 'valid' || !result.serviceOrder) return;

    setValidatedSO(result.serviceOrder);

    // A valid order is not enough: CEIPAL must also confirm nobody is already staffed.
    setIsCheckingAvailability(true);
    const disponibilidad = await verificarDisponibilidadCandidatos(
      selectedCandidates.map(c => c.id),
      serviceOrderId
    );
    setIsCheckingAvailability(false);
    setAvailability(disponibilidad);
  };

  const handleConfirmUpload = async () => {
    if (!readyToExport) return;

    setIsUploading(true);
    const results = await cargarCandidatosAPipelineCeipal(
      exportableCandidates.map(c => c.id),
      serviceOrderId,
      candidatesAlreadyUploaded
    );
    setIsUploading(false);
    setUploadResults(results);

    onUploadSuccess(
      results.map(r => ({
        candidatoId: r.candidatoId,
        serviceOrderId,
        estado: (r.status === 'success' || r.status === 'already_uploaded' ? 'cargado' : 'error') as 'cargado' | 'error'
      }))
    );
  };

  const handleRetryCandidate = async (candidatoId: string) => {
    setIsUploading(true);
    const results = await cargarCandidatosAPipelineCeipal([candidatoId], serviceOrderId, []);
    setIsUploading(false);

    setUploadResults(prev => (prev ? prev.map(r => (r.candidatoId === candidatoId ? results[0] : r)) : results));
    onUploadSuccess([{ candidatoId, serviceOrderId, estado: results[0].status === 'success' ? 'cargado' : 'error' }]);
  };

  const successCount = uploadResults?.filter(r => r.status !== 'error').length ?? 0;
  const errorCount = uploadResults?.filter(r => r.status === 'error').length ?? 0;

  return (
    <Modal
      context={
        <>
          Search: <span className="font-medium text-ink-2">{busqueda.nombre}</span>
        </>
      }
      title="Export to CEIPAL"
      description="Adds the selected candidates to the first pipeline stage of a service order. Simulated for this demo."
      onClose={onClose}
      footer={
        uploadResults ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="commercial"
              icon={<UploadCloud className="size-4" />}
              onClick={handleConfirmUpload}
              disabled={!readyToExport}
              loading={isUploading}
              loadingLabel="Exporting…"
            >
              Export {plural(exportableCandidates.length, 'candidate')}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-semibold">
            Candidates to export <span className="tabular-nums text-ink-3">({selectedCandidates.length})</span>
          </h3>
          <ul className="max-h-44 divide-y divide-rule overflow-y-auto overscroll-contain rounded-md border border-rule">
            {selectedCandidates.map(c => {
              const vinculadoInfo = vinculoById.get(c.id);
              const isAlreadyInSO = vinculadoInfo?.estadoCeipal === 'cargado' && vinculadoInfo.serviceOrderId === serviceOrderId;
              const disponibilidad = availabilityById.get(c.id);
              const asignacion = disponibilidad?.status === 'on_assignment' ? disponibilidad.asignacion : undefined;

              return (
                <li key={c.id} className={`flex items-center justify-between gap-3 px-3 py-2 ${asignacion ? 'bg-danger-wash/50' : ''}`}>
                  <div className="min-w-0">
                    <span className={`font-medium ${asignacion ? 'text-ink-2 line-through' : 'text-ink'}`}>{c.nombre}</span>
                    <span className="ml-2 text-[13px] text-ink-3">
                      <CandidateId id={c.id} className="mr-2" />
                      {c.pais}, {c.experienciaTexto}
                    </span>
                    {asignacion && (
                      <span className="mt-0.5 block text-[13px] text-danger">
                        Staffed on {asignacion.posicion} for {asignacion.cliente} ({asignacion.serviceOrderId}) since {formatDate(asignacion.desde)}.
                      </span>
                    )}
                  </div>
                  {asignacion ? (
                    <span className="chip chip-danger shrink-0">On assignment</span>
                  ) : isAlreadyInSO ? (
                    <span className="chip chip-ok shrink-0">Already in {serviceOrderId}</span>
                  ) : vinculadoInfo?.estadoCeipal === 'cargado' ? (
                    <span className="chip chip-brand shrink-0">In {vinculadoInfo.serviceOrderId}</span>
                  ) : (
                    <span className="chip chip-neutral shrink-0">Not exported</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3">
          <Field
            id="soId"
            label="Service order ID"
            hint={
              <span>
                Try{' '}
                {EXAMPLE_ORDERS.map((so, i) => (
                  <React.Fragment key={so}>
                    <button
                      type="button"
                      className="code font-medium text-brand-ink underline-offset-2 hover:underline"
                      onClick={() => {
                        setServiceOrderId(so);
                        resetValidation();
                      }}
                    >
                      {so}
                    </button>
                    {i < EXAMPLE_ORDERS.length - 1 ? ', ' : ''}
                  </React.Fragment>
                ))}
                . The last one is not registered in CEIPAL.
              </span>
            }
          >
            <div className="flex gap-2">
              <input
                type="text"
                name="service-order"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
                value={serviceOrderId}
                onChange={handleInputChange}
                disabled={isUploading || Boolean(uploadResults)}
                placeholder="SO-00000"
                className="input code flex-1 uppercase"
              />
              <Button
                onClick={handleValidateSO}
                disabled={isUploading || Boolean(uploadResults)}
                loading={validationState === 'validating'}
                loadingLabel="Validating…"
                className="shrink-0"
              >
                Validate
              </Button>
            </div>
          </Field>

          <div role="status" aria-live="polite">
            {validationState === 'idle' && (
              <p className="inline-flex items-center gap-2 text-[13px] text-ink-3">
                <Clock className="size-4" />
                Validate the service order before exporting.
              </p>
            )}
            {validationState === 'validating' && (
              <p className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                <span className="spinner" aria-hidden="true" />
                Looking up the service order in CEIPAL…
              </p>
            )}
            {validationState === 'valid' && validatedSO && (
              <div className="rounded-md border border-ok/25 bg-ok-wash p-3 text-ok">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" />
                  Service order found
                </p>
                <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
                  <dt className="text-ok/80">Client</dt>
                  <dd>{validatedSO.cliente}</dd>
                  <dt className="text-ok/80">Role</dt>
                  <dd>{validatedSO.posicion}</dd>
                  <dt className="text-ok/80">Status</dt>
                  <dd>
                    {validatedSO.estado}, {plural(validatedSO.vacantesDisponibles, 'opening')}
                  </dd>
                </dl>
              </div>
            )}
            {isCheckingAvailability && (
              <p className="mt-2 inline-flex items-center gap-2 text-[13px] text-ink-2">
                <span className="spinner" aria-hidden="true" />
                Checking whether any candidate is already staffed…
              </p>
            )}
            {availability && blockedCandidates.length > 0 && (
              <div className="mt-2 rounded-md border border-danger/25 bg-danger-wash p-3 text-danger">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="size-4" />
                  {plural(blockedCandidates.length, 'candidate')} already on an active assignment
                </p>
                <p className="mt-1 text-[13px]">
                  CEIPAL reports them staffed on another service order, so they are excluded from this export.
                  {exportableCandidates.length > 0
                    ? ` The remaining ${plural(exportableCandidates.length, 'candidate')} can be exported.`
                    : ' There is nobody left to export; remove them from the selection or free up their assignment in CEIPAL first.'}
                </p>
              </div>
            )}
            {availability && blockedCandidates.length === 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ok">
                <CheckCircle2 className="size-4" />
                All {plural(selectedCandidates.length, 'candidate')} are free to be staffed.
              </p>
            )}
            {validationState === 'not_found' && (
              <div className="rounded-md border border-warn/25 bg-warn-wash p-3 text-warn">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4" />
                  Service order not found
                </p>
                <p className="mt-1 text-[13px]">{validationMessage || 'No active requirement has this ID.'} Check the ID with the recruiter and try again.</p>
              </div>
            )}
            {validationState === 'error' && (
              <div className="rounded-md border border-danger/25 bg-danger-wash p-3 text-danger">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="size-4" />
                  Could not validate
                </p>
                <p className="mt-1 text-[13px]">{validationMessage}</p>
              </div>
            )}
          </div>
        </section>

        {uploadResults && (
          <section aria-live="polite">
            <h3 className="mb-2 text-sm font-semibold">
              Result: {successCount} exported{errorCount > 0 && `, ${errorCount} failed`}
            </h3>
            <ul className="divide-y divide-rule rounded-md border border-rule">
              {uploadResults.map(res => (
                <li key={res.candidatoId} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {res.status === 'success' && <CheckCircle2 className="size-4 shrink-0 text-ok" />}
                    {res.status === 'already_uploaded' && <Info className="size-4 shrink-0 text-brand" />}
                    {res.status === 'error' && <AlertCircle className="size-4 shrink-0 text-danger" />}
                    <span className="min-w-0">
                      <CandidateId id={res.candidatoId} className="mr-2 text-ink" />
                      <span className="text-ink-2">{res.message}</span>
                    </span>
                  </span>
                  {res.status === 'error' && (
                    <Button size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => handleRetryCandidate(res.candidatoId)} disabled={isUploading}>
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
};
