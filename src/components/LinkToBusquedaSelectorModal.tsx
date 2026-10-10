import React, { useState } from 'react';
import { X, FolderPlus, FolderKanban, Check, CheckCircle2, Building2, Calendar, Users } from 'lucide-react';
import { BusquedaComercial } from '../types';

interface LinkToBusquedaSelectorModalProps {
  candidateIds: string[];
  busquedas: BusquedaComercial[];
  onClose: () => void;
  onLinkToExistingBusqueda: (busquedaId: string, candidateIds: string[]) => void;
  onRequestCreateNewBusqueda: () => void;
}

export const LinkToBusquedaSelectorModal: React.FC<LinkToBusquedaSelectorModalProps> = ({
  candidateIds,
  busquedas,
  onClose,
  onLinkToExistingBusqueda,
  onRequestCreateNewBusqueda
}) => {
  const [selectedBusquedaId, setSelectedBusquedaId] = useState<string>(busquedas[0]?.id || '');
  const [isSuccess, setIsSuccess] = useState(false);

  const targetBusqueda = busquedas.find(b => b.id === selectedBusquedaId);

  const handleConfirm = () => {
    if (!selectedBusquedaId) return;
    onLinkToExistingBusqueda(selectedBusquedaId, candidateIds);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full my-8 p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-[#007685] bg-[#007685]/10 px-2 py-0.5 rounded">
                Link to Search
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Add {candidateIds.length === 1 ? `candidate ${candidateIds[0]}` : `${candidateIds.length} candidates`} to a search
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {isSuccess && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Candidates successfully linked to search!</span>
          </div>
        )}

        {/* Search Selection List */}
        <div className="py-4 space-y-3">
          <label className="font-bold text-slate-700 block">
            Select an existing search from your pipeline:
          </label>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {busquedas.map(b => {
              const isSelected = selectedBusquedaId === b.id;
              // Check how many of the candidateIds are already in this search
              const alreadyInSearchCount = candidateIds.filter(id => 
                b.candidatosVinculados.some(cv => cv.candidatoId === id)
              ).length;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBusquedaId(b.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-[#007685] bg-[#007685]/5 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {b.nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      {b.clienteEmpresa && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {b.clienteEmpresa}
                        </span>
                      )}
                      <span>·</span>
                      <span className="tabular-nums font-mono">
                        {b.candidatosVinculados.length} linked candidates
                      </span>
                    </div>

                    {alreadyInSearchCount > 0 && (
                      <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {alreadyInSearchCount} already linked in this search
                      </span>
                    )}
                  </div>

                  <div className="pt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#007685] bg-[#007685] text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action to create new search */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestCreateNewBusqueda();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-[#007685] hover:bg-[#007685]/5 text-slate-700 hover:text-[#007685] font-semibold transition-all flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4 text-[#007685]" />
              <span>Or create a new search for this talent</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedBusquedaId || isSuccess}
            className={`px-4 py-2 font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              selectedBusquedaId && !isSuccess
                ? 'bg-[#007685] hover:bg-[#005d69] cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Link now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
