import React, { useEffect, useEffectEvent, useRef } from 'react';
import { X, Printer, CheckCircle2, HelpCircle } from 'lucide-react';
import { Candidato, Vacancy, EvaluacionCandidato } from '../types';
import { evaluarCandidatoConVacante } from '../utils/evaluationEngine';
import { Button } from './ui/Button';
import { EnglishChip, FitBadge, englishRequirementLabel, modalityLabel } from './shared/badges';
import { TalentBookLogo } from './TalentBookLogo';
import { formatDate, plural, todayIso } from '../utils/format';

interface PresentationModeProps {
  candidates: Candidato[];
  vacancy: Vacancy;
  onClose: () => void;
}

/**
 * Client-facing view: a typeset dossier for screen sharing or printing.
 * Everything internal (CEIPAL state, salary ranges, pool counts) stays out.
 */
export const PresentationMode: React.FC<PresentationModeProps> = ({ candidates, vacancy, onClose }) => {
  const evaluations: Record<string, EvaluacionCandidato> = {};
  candidates.forEach(c => {
    evaluations[c.id] = evaluarCandidatoConVacante(c, vacancy);
  });

  const closeRef = useRef<HTMLButtonElement>(null);
  const requestClose = useEffectEvent(() => onClose());

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="presentation-title" className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-paper print:static print:overflow-visible print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white sm:px-6 print:hidden">
        <p className="text-sm">
          <span className="font-semibold">Presentation mode</span>
          <span className="ml-2 hidden text-white/70 sm:inline">Clean view for sharing with the client</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="on-dark" size="sm" icon={<Printer className="size-4" />} onClick={() => window.print()}>
            <span className="hidden sm:inline">Print or save PDF</span>
            <span className="sm:hidden">Print</span>
          </Button>
          <Button ref={closeRef} variant="secondary" size="sm" icon={<X className="size-4" />} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <main className="mx-auto my-6 max-w-4xl bg-surface px-6 py-10 shadow-pop sm:my-10 sm:rounded-lg sm:px-14 sm:py-14 print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-ink pb-8">
          <div className="flex items-start justify-between gap-6">
            <TalentBookLogo className="h-8" showText />
            <p className="text-right text-[13px] text-ink-3">
              {formatDate(todayIso(), 'long')}
              <br />
              Confidential shortlist
            </p>
          </div>

          <h1 id="presentation-title" className="mt-10 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            {vacancy.titulo || 'Position under evaluation'}
          </h1>
          {vacancy.cliente && <p className="mt-3 text-lg text-ink-2">Prepared for {vacancy.cliente}</p>}
          <p className="mt-1 text-ink-3">{plural(candidates.length, 'candidate')} proposed</p>

          {vacancy.descripcion && (
            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_14rem]">
              <p className="max-w-[64ch] text-[15px] leading-relaxed text-ink-2">{vacancy.descripcion}</p>
              <dl className="space-y-2 border-l border-rule pl-5 text-[13px]">
                <div>
                  <dt className="text-ink-3">Experience</dt>
                  <dd className="font-medium tabular-nums">{vacancy.requisitos.experienciaMinimaAnos}+ years</dd>
                </div>
                <div>
                  <dt className="text-ink-3">English</dt>
                  <dd className="font-medium">{englishRequirementLabel(vacancy.requisitos.nivelInglesMinimo)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Work mode</dt>
                  <dd className="font-medium">
                    {modalityLabel(vacancy.requisitos.modalidad)}, {vacancy.requisitos.ubicacionRequerida}
                  </dd>
                </div>
                {vacancy.requisitos.habilidadesIndispensables.length > 0 && (
                  <div>
                    <dt className="text-ink-3">Key skills</dt>
                    <dd className="font-medium">{vacancy.requisitos.habilidadesIndispensables.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </header>

        <section aria-label="Candidates" className="divide-y divide-rule">
          {candidates.map((cand, index) => {
            const ev = evaluations[cand.id];

            return (
              <article key={cand.id} className="py-10 break-inside-avoid">
                <div className="grid gap-6 sm:grid-cols-[3rem_1fr]">
                  {/* The shortlist is an ordered proposal, so numbering is information here. */}
                  <div className="text-3xl font-semibold tabular-nums text-brand" aria-hidden="true">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold leading-tight">
                          <span className="sr-only">Candidate {index + 1}: </span>
                          {cand.nombre}
                        </h2>
                        <p className="mt-1 text-ink-2">
                          {cand.ciudad}, {cand.pais}. {modalityLabel(cand.modalidad)}.
                        </p>
                      </div>
                      {ev && <FitBadge level={ev.nivelAjusteGeneral} prefix="Overall fit" />}
                    </div>

                    <dl className="facts mt-5">
                      <div>
                        <dt>Experience</dt>
                        <dd className="tabular-nums">{cand.experienciaTexto}</dd>
                      </div>
                      <div>
                        <dt>English</dt>
                        <dd>
                          <EnglishChip level={cand.nivelIngles} />
                        </dd>
                      </div>
                      <div>
                        <dt>Availability</dt>
                        <dd>{cand.disponibilidad}</dd>
                      </div>
                      <div>
                        <dt>Education</dt>
                        <dd>{cand.educacion}</dd>
                      </div>
                    </dl>

                    <p className="mt-6 max-w-[64ch] text-[15px] leading-relaxed text-ink">{cand.resumenProfesional}</p>

                    <h3 className="mt-7 mb-3 text-base font-semibold">Career highlights</h3>
                    <ol className="divide-y divide-rule border-y border-rule">
                      {cand.trayectoria.map((t, tIdx) => (
                        <li key={tIdx} className="grid gap-1 py-3.5 sm:grid-cols-[8rem_1fr] sm:gap-6">
                          <div className="text-[13px] tabular-nums text-ink-3">{t.duracion}</div>
                          <div>
                            <div className="font-semibold">{t.cargo}</div>
                            <div className="text-[13px] text-ink-2">{t.sectorEmpresa}</div>
                            {t.logros.length > 0 && (
                              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] text-ink-2 marker:text-ink-3">
                                {t.logros.map((l, lIdx) => (
                                  <li key={lIdx}>{l}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    <h3 className="mt-7 mb-2 text-base font-semibold">Skills</h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {cand.habilidades.map(skill => (
                        <li key={skill} className="chip chip-neutral">
                          {skill}
                        </li>
                      ))}
                    </ul>

                    {ev && (
                      <div className="mt-7 rounded-lg bg-paper p-5 print:border print:border-rule">
                        <p className="max-w-[64ch] text-[15px] leading-relaxed text-ink-2">{ev.sintesisAjuste}</p>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2">
                          <div>
                            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                              <CheckCircle2 className="size-4 text-ok" />
                              Strengths for this role
                            </h4>
                            <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-ink-2 marker:text-ink-3">
                              {ev.requisitosCumplidos.slice(0, 3).map((item, idx) => (
                                <li key={idx}>{item.criterio}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                              <HelpCircle className="size-4 text-brand" />
                              To discuss in the interview
                            </h4>
                            <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-ink-2 marker:text-ink-3">
                              {ev.informacionPorValidar.slice(0, 2).map((item, idx) => (
                                <li key={idx}>{item.criterio}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <footer className="mt-4 border-t-2 border-ink pt-6 text-[13px] text-ink-3">
          <p>
            <span className="font-semibold text-ink-2" translate="no">
              Talent Book
            </span>
            , talent sourcing and staffing solutions. Candidate files are anonymized by sector. This shortlist is preliminary and places no
            hold on the candidates.
          </p>
        </footer>
      </main>
    </div>
  );
};
