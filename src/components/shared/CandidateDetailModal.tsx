import React from 'react';
import { Candidato } from '../../types';
import { profileName } from '../../data/indexes';
import { Modal } from '../ui/Modal';
import { CandidateId, EnglishChip, modalityLabel } from './badges';
import { formatDate } from '../../utils/format';

interface CandidateDetailModalProps {
  candidate: Candidato;
  onClose: () => void;
  /** Optional primary action rendered in the footer next to Close. */
  action?: React.ReactNode;
}

/** Full candidate file. Shared by every screen that opens a candidate. */
export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, action }) => {
  const profileNames = candidate.perfilesAsociados.map(profileName);

  return (
    <Modal
      size="lg"
      onClose={onClose}
      context={
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <CandidateId id={candidate.id} />
          <span>
            {candidate.ciudad}, {candidate.pais}
          </span>
          <span>{modalityLabel(candidate.modalidad)}</span>
        </span>
      }
      title={candidate.nombre}
      description={profileNames.join(' / ')}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          {action}
        </>
      }
    >
      <div className="space-y-7">
        <dl className="facts">
          <div>
            <dt>Experience</dt>
            <dd className="tabular-nums">{candidate.experienciaTexto}</dd>
          </div>
          <div>
            <dt>English</dt>
            <dd>
              <EnglishChip level={candidate.nivelIngles} />
            </dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{candidate.disponibilidad}</dd>
          </div>
          <div>
            <dt>Education</dt>
            <dd>{candidate.educacion}</dd>
          </div>
          {candidate.rangoSalarialInterno ? (
            <div>
              <dt>Internal rate</dt>
              <dd className="tabular-nums">{candidate.rangoSalarialInterno}</dd>
            </div>
          ) : null}
          {candidate.fuente ? (
            <div>
              <dt>Source</dt>
              <dd>{candidate.fuente}</dd>
            </div>
          ) : null}
          {candidate.ultimaActualizacion ? (
            <div>
              <dt>Profile updated</dt>
              <dd>{formatDate(candidate.ultimaActualizacion)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="text-[13px] text-ink-3">Internal rate and source are for the sales team only; they never appear in the client presentation.</p>

        <section>
          <h3 className="mb-2 text-base font-semibold">Professional summary</h3>
          <p className="max-w-[70ch] text-[15px] leading-relaxed text-ink-2">{candidate.resumenProfesional}</p>
        </section>

        <section>
          <h3 className="mb-2 text-base font-semibold">Key competencies</h3>
          <ul className="flex flex-wrap gap-1.5">
            {candidate.competenciasClave.map(c => (
              <li key={c} className="chip chip-brand">
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-base font-semibold">Skills</h3>
          <ul className="flex flex-wrap gap-1.5">
            {candidate.habilidades.map(h => (
              <li key={h} className="chip chip-neutral">
                {h}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold">Career history</h3>
          <ol className="divide-y divide-rule border-y border-rule">
            {candidate.trayectoria.map((item, idx) => (
              <li key={idx} className="grid gap-1 py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <div className="text-[13px] tabular-nums text-ink-3">{item.duracion}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{item.cargo}</div>
                  <div className="text-[13px] text-ink-2">{item.sectorEmpresa}</div>
                  {item.logros.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-2 marker:text-ink-3">
                      {item.logros.map((logro, lIdx) => (
                        <li key={lIdx}>{logro}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {candidate.certificaciones.length > 0 && (
          <section>
            <h3 className="mb-2 text-base font-semibold">Certifications</h3>
            <ul className="list-disc space-y-1 pl-4 text-ink-2 marker:text-ink-3">
              {candidate.certificaciones.map(c => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
};
