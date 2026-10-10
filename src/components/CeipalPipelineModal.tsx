import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  UploadCloud, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';
import { Candidato, BusquedaComercial, ServiceOrderSimulada } from '../types';
import { 
  validarServiceOrderCeipal, 
  cargarCandidatosAPipelineCeipal, 
  ValidationStatus, 
  ValidationResult,
  CandidateUploadResult 
} from '../services/ceipalMockService';

interface CeipalPipelineModalProps {
  busqueda: BusquedaComercial;
  selectedCandidates: Candidato[];
  onClose: () => void;
  onUploadSuccess: (results: { candidatoId: string; serviceOrderId: string; estado: 'cargado' | 'error' }[]) => void;
}

export const CeipalPipelineModal: React.FC<CeipalPipelineModalProps> = ({
  busqueda,
  selectedCandidates,
  onClose,
  onUploadSuccess
}) => {
  const [serviceOrderId, setServiceOrderId] = useState('SO-99214');
  const [validationState, setValidationState] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validatedSO, setValidatedSO] = useState<ServiceOrderSimulada | null>(null);

  // Upload process state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<CandidateUploadResult[] | null>(null);

  // Check candidates already uploaded to this SO
  const candidatesAlreadyUploaded = busqueda.candidatosVinculados
    .filter(cv => cv.estadoCeipal === 'cargado' && cv.serviceOrderId === serviceOrderId)
    .map(cv => cv.candidatoId);

  // Handler for Service Order input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setServiceOrderId(val);
    // Requirement: "Si el vendedor cambia el ID después de validarlo, debe validarlo nuevamente."
    if (validationState !== 'idle') {
      setValidationState('idle');
      setValidationMessage('');
      setValidatedSO(null);
    }
  };

  // Validate Service Order ID
  const handleValidateSO = async () => {
    if (!serviceOrderId.trim()) {
      setValidationState('error');
      setValidationMessage('Service Order ID is required.');
      return;
    }

    setValidationState('validating');
    setValidationMessage('');
    setValidatedSO(null);

    const result = await validarServiceOrderCeipal(serviceOrderId);
    setValidationState(result.status);
    setValidationMessage(result.message || '');
    if (result.status === 'valid' && result.serviceOrder) {
      setValidatedSO(result.serviceOrder);
    }
  };

  // Confirm Upload
  const handleConfirmUpload = async () => {
    if (validationState !== 'valid') return;

    setIsUploading(true);
    const candidateIds = selectedCandidates.map(c => c.id);

    const results = await cargarCandidatosAPipelineCeipal(
      candidateIds,
      serviceOrderId,
      candidatesAlreadyUploaded
    );

    setIsUploading(false);
    setUploadResults(results);

    // Prepare update data for parent
    const updates = results.map(r => ({
      candidatoId: r.candidatoId,
      serviceOrderId: serviceOrderId,
      estado: (r.status === 'success' || r.status === 'already_uploaded' ? 'cargado' : 'error') as 'cargado' | 'error'
    }));

    onUploadSuccess(updates);
  };

  // Retry single failed candidate
  const handleRetryCandidate = async (candidatoId: string) => {
    setIsUploading(true);
    const results = await cargarCandidatosAPipelineCeipal([candidatoId], serviceOrderId, []);
    setIsUploading(false);

    setUploadResults(prev => {
      if (!prev) return results;
      return prev.map(r => r.candidatoId === candidatoId ? results[0] : r);
    });

    onUploadSuccess([{
      candidatoId,
      serviceOrderId,
      estado: results[0].status === 'success' ? 'cargado' : 'error'
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full my-8 p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                ATS Integration
              </span>
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                CEIPAL Simulation
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Export to CEIPAL Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search: <strong className="text-slate-700">{busqueda.nombre}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Candidates Summary Box */}
          <div className="bg-[#F5F5F6] border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Selected candidates ({selectedCandidates.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Ready for synchronization
              </span>
            </div>

            <div className="divide-y divide-slate-200/70 max-h-36 overflow-y-auto">
              {selectedCandidates.map(c => {
                const vinculadoInfo = busqueda.candidatosVinculados.find(cv => cv.candidatoId === c.id);
                const isAlreadyInSO = vinculadoInfo?.estadoCeipal === 'cargado' && vinculadoInfo.serviceOrderId === serviceOrderId;

                return (
                  <div key={c.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#007685] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {c.id}
                      </span>
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">
                        {c.pais} · {c.experienciaTexto} · {c.nivelIngles}
                      </span>
                    </div>

                    <div>
                      {isAlreadyInSO ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                          Already in {serviceOrderId}
                        </span>
                      ) : vinculadoInfo?.estadoCeipal === 'cargado' ? (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                          In {vinculadoInfo.serviceOrderId}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                          Pending export
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Order ID Input & Validation Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="soId" className="font-bold text-slate-800">
                Service Order ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Examples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setServiceOrderId('SO-99214');
                    setValidationState('idle');
                  }}
                  className="text-[#007685] hover:underline font-mono"
                >
                  SO-99214
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setServiceOrderId('SO-88301');
                    setValidationState('idle');
                  }}
                  className="text-[#007685] hover:underline font-mono"
                >
                  SO-88301
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setServiceOrderId('SO-00000');
                    setValidationState('idle');
                  }}
                  className="text-rose-600 hover:underline font-mono"
                  title="Test not found Service Order"
                >
                  SO-00000
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                id="soId"
                type="text"
                value={serviceOrderId}
                onChange={handleInputChange}
                disabled={isUploading}
                placeholder="e.g.: SO-99214"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685]"
              />

              <button
                type="button"
                onClick={handleValidateSO}
                disabled={isUploading || validationState === 'validating'}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors disabled:opacity-50 shrink-0"
              >
                {validationState === 'validating' ? 'Validating...' : 'Validate Service Order'}
              </button>
            </div>

            {/* Validation State Feedback Box */}
            <div className="pt-1">
              {validationState === 'idle' && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Pending validation against CEIPAL ATS.</span>
                </div>
              )}

              {validationState === 'validating' && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin shrink-0" />
                  <span>Querying Service Order in CEIPAL...</span>
                </div>
              )}

              {validationState === 'valid' && validatedSO && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Valid Service Order</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 pl-5 space-y-0.5">
                    <div><strong>Client:</strong> {validatedSO.cliente}</div>
                    <div><strong>Role:</strong> {validatedSO.posicion}</div>
                    <div><strong>Status:</strong> {validatedSO.estado} · {validatedSO.vacantesDisponibles} openings available</div>
                  </div>
                </div>
              )}

              {validationState === 'not_found' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Service Order not found</span>
                  </div>
                  <p className="text-[11px] text-amber-800 pl-5">
                    {validationMessage || 'No active requirement found matching this ID.'}
                  </p>
                </div>
              )}

              {validationState === 'error' && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Validation error</span>
                  </div>
                  <p className="text-[11px] text-rose-800 pl-5">
                    {validationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results Summary if upload was triggered */}
          {uploadResults && (
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#007685]" />
                Pipeline Export Results
              </h4>

              <div className="space-y-2">
                {uploadResults.map(res => (
                  <div 
                    key={res.candidatoId} 
                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {res.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {res.status === 'already_uploaded' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
                      {res.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <div>
                        <span className="font-mono font-bold text-slate-900">{res.candidatoId}</span>: {res.message}
                      </div>
                    </div>

                    {res.status === 'error' && (
                      <button
                        onClick={() => handleRetryCandidate(res.candidatoId)}
                        disabled={isUploading}
                        className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {uploadResults ? 'Close' : 'Cancel'}
          </button>

          {!uploadResults ? (
            <button
              onClick={handleConfirmUpload}
              disabled={validationState !== 'valid' || isUploading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs ${
                validationState === 'valid' && !isUploading
                  ? 'bg-[#007685] hover:bg-[#005d69] cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Exporting to CEIPAL...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Confirm export to CEIPAL</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-[#007685] hover:bg-[#005d69] rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
