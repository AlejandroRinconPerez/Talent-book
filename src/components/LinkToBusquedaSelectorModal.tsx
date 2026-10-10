import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { BusquedaComercial } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { plural } from '../utils/format';

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

  const handleConfirm = () => {
    if (!selectedBusquedaId) return;
    onLinkToExistingBusqueda(selectedBusquedaId, candidateIds);
    onClose();
  };

  const subject = candidateIds.length === 1 ? `candidate ${candidateIds[0]}` : plural(candidateIds.length, 'candidate');

  return (
    <Modal
      size="sm"
      title="Add to a search"
      description={`Choose the search where ${subject} should be linked.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!selectedBusquedaId}>
            Link to search
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Target search</legend>
        <ul className="max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-1">
          {busquedas.map(b => {
            const alreadyInSearchCount = candidateIds.filter(id => b.candidatosVinculados.some(cv => cv.candidatoId === id)).length;
            const radioId = `link-${b.id}`;

            return (
              <li key={b.id} className="select-card p-3">
                <div className="flex items-start gap-3">
                  <input
                    id={radioId}
                    type="radio"
                    name="target-search"
                    value={b.id}
                    checked={selectedBusquedaId === b.id}
                    onChange={() => setSelectedBusquedaId(b.id)}
                    className="mt-1 size-4 shrink-0"
                  />
                  <label htmlFor={radioId} className="stretch min-w-0 flex-1 cursor-pointer">
                    <span className="block font-semibold text-ink">{b.nombre}</span>
                    <span className="block text-[13px] text-ink-2">
                      {b.clienteEmpresa ? `${b.clienteEmpresa}, ` : ''}
                      <span className="tabular-nums">{plural(b.candidatosVinculados.length, 'linked candidate')}</span>
                    </span>
                    {alreadyInSearchCount > 0 && (
                      <span className="chip chip-warn mt-1.5">
                        {alreadyInSearchCount} already in this search
                      </span>
                    )}
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <button
        type="button"
        onClick={() => {
          onClose();
          onRequestCreateNewBusqueda();
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-rule-strong px-3 py-2.5 text-sm font-medium text-ink-2 hover:border-brand hover:bg-brand-wash/50 hover:text-brand-ink"
      >
        <FolderPlus className="size-4" />
        Create a new search instead
      </button>
    </Modal>
  );
};
