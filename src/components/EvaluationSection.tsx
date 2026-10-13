import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Presentation, ArrowLeft, X, Plus, Briefcase, SlidersHorizontal, ShieldCheck, Users } from 'lucide-react';
import { Vacancy, ItemEvaluacion, NivelIngles } from '../types';
import { CANDIDATE_BY_ID } from '../data/indexes';
import { SAMPLE_VACANCIES, evaluarCandidatoConVacante } from '../utils/evaluationEngine';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Field } from './ui/Field';
import { CandidateId, EnglishChip, FitBadge, ScoreBreakdown } from './shared/badges';
import { plural } from '../utils/format';

interface EvaluationSectionProps {
  selectedCandidateIds: string[];
  onToggleCandidate: (id: string) => void;
  onClearCandidates: () => void;
  onNavigateToCandidates: () => void;
  onOpenPresentation: () => void;
  currentVacancy: Vacancy;
  onUpdateVacancy: (vacancy: Vacancy) => void;
  onBackToBusqueda?: () => void;
  busquedaNombre?: string;
}

const SAMPLE_LABELS = ['Frontend developer', 'Bilingual executive assistant', 'Accounting & compliance analyst'];

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  selectedCandidateIds,
  onToggleCandidate,
  onClearCandidates,
  onNavigateToCandidates,
  onOpenPresentation,
  currentVacancy,
  onUpdateVacancy,
  onBackToBusqueda,
  busquedaNombre
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEditRequirements, setShowEditRequirements] = useState(false);
  const [newMustSkill, setNewMustSkill] = useState('');
  const [newNiceSkill, setNewNiceSkill] = useState('');

  // Keep selection order; drop ids that no longer resolve to a pool record
  const selectedCandidates = useMemo(
    () => selectedCandidateIds.flatMap(id => CANDIDATE_BY_ID.get(id) ?? []),
    [selectedCandidateIds]
  );

  // Evaluate and pair each candidate with its result in one pass
  const evaluations = useMemo(
    () => selectedCandidates.map(candidate => ({ candidate, result: evaluarCandidatoConVacante(candidate, currentVacancy) })),
    [selectedCandidates, currentVacancy]
  );

  const handleLoadSample = (sample: Vacancy) => onUpdateVacancy({ ...sample });

  // Evaluation is computed live; this re-run exists to make the recalculation visible on demand.
  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    setTimeout(() => setIsEvaluating(false), 450);
  };

  const updateRequisitos = (patch: Partial<Vacancy['requisitos']>) =>
    onUpdateVacancy({ ...currentVacancy, requisitos: { ...currentVacancy.requisitos, ...patch } });

  const addSkill = (kind: 'habilidadesIndispensables' | 'habilidadesDeseables', value: string, reset: () => void) => {
    const skill = value.trim();
    if (!skill) return;
    updateRequisitos({ [kind]: [...currentVacancy.requisitos[kind], skill] });
    reset();
  };

  const removeSkill = (kind: 'habilidadesIndispensables' | 'habilidadesDeseables', skill: string) =>
    updateRequisitos({ [kind]: currentVacancy.requisitos[kind].filter(s => s !== skill) });

  return (
    <div className="space-y-6">
      <div>
        {onBackToBusqueda && (
          <button
            type="button"
            onClick={onBackToBusqueda}
            className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[13px] font-medium text-ink-2 hover:text-brand-ink"
          >
            <ArrowLeft className="size-3.5" />
            {busquedaNombre}
          </button>
        )}
        <div className={`page-header ${onBackToBusqueda ? 'mt-3' : ''}`}>
          <div>
            <h1 className="page-title">Fit evaluation</h1>
            <p className="page-lede">
              Compares each candidate with the vacancy criteria and separates what is met, what is missing and what to confirm on the
              screening call. Rule-based, no generative AI.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button icon={<Users className="size-4" />} onClick={onNavigateToCandidates} title="Return to the pool and keep this vacancy">
              Change candidates
            </Button>
            <Button variant="commercial" icon={<Presentation className="size-4" />} onClick={onOpenPresentation} disabled={selectedCandidates.length === 0}>
              Present ({selectedCandidates.length})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Vacancy */}
        <section aria-labelledby="vacancy-heading" className="panel lg:col-span-5 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100dvh-6rem)] lg:flex-col">
          <div className="panel-head">
            <h2 id="vacancy-heading" className="text-base font-semibold">
              Vacancy
            </h2>
            <button
              type="button"
              onClick={() => setShowEditRequirements(v => !v)}
              aria-expanded={showEditRequirements}
              aria-controls="requirements-editor"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-ink hover:underline"
            >
              <SlidersHorizontal className="size-3.5" />
              {showEditRequirements ? 'Hide criteria' : 'Edit criteria'}
            </button>
          </div>

          <div className="panel-body space-y-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            <div>
              <p className="mb-1.5 text-[13px] text-ink-3">Load a sample vacancy</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_VACANCIES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadSample(s)}
                    className="pill"
                    aria-pressed={currentVacancy.titulo === s.titulo}
                  >
                    {SAMPLE_LABELS[idx] ?? s.titulo}
                  </button>
                ))}
              </div>
            </div>

            <Field id="vac-title" label="Job title">
              <input
                type="text"
                name="job-title"
                autoComplete="off"
                value={currentVacancy.titulo}
                onChange={e => onUpdateVacancy({ ...currentVacancy, titulo: e.target.value })}
                placeholder="Senior Frontend Developer, bilingual"
                className="input font-medium"
              />
            </Field>

            <Field id="vac-desc" label="Requirement">
              <textarea
                rows={4}
                name="requirement"
                value={currentVacancy.descripcion}
                onChange={e => onUpdateVacancy({ ...currentVacancy, descripcion: e.target.value })}
                placeholder="Paste or write what the client asked for…"
                className="input textarea"
              />
            </Field>

            {showEditRequirements && (
              <div id="requirements-editor" className="space-y-4 border-t border-rule pt-5 animate-fade">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="vac-exp" label="Min. experience (years)">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={15}
                      value={currentVacancy.requisitos.experienciaMinimaAnos}
                      onChange={e => updateRequisitos({ experienciaMinimaAnos: parseInt(e.target.value) || 0 })}
                      className="input tabular-nums"
                    />
                  </Field>
                  <Field id="vac-english" label="Min. English">
                    <select
                      value={currentVacancy.requisitos.nivelInglesMinimo}
                      onChange={e => updateRequisitos({ nivelInglesMinimo: e.target.value as NivelIngles })}
                      className="input select"
                    >
                      <option value="A2">A2, elementary</option>
                      <option value="B1">B1, pre-intermediate</option>
                      <option value="B2">B2, intermediate</option>
                      <option value="C1">C1, advanced</option>
                      <option value="C2">C2, bilingual</option>
                    </select>
                  </Field>
                  <Field id="vac-modality" label="Work mode">
                    <select value={currentVacancy.requisitos.modalidad} onChange={e => updateRequisitos({ modalidad: e.target.value })} className="input select">
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </Field>
                  <Field id="vac-location" label="Location">
                    <input
                      type="text"
                      autoComplete="off"
                      value={currentVacancy.requisitos.ubicacionRequerida}
                      onChange={e => updateRequisitos({ ubicacionRequerida: e.target.value })}
                      className="input"
                    />
                  </Field>
                </div>

                <SkillEditor
                  id="must-skill"
                  label="Must-have skills"
                  skills={currentVacancy.requisitos.habilidadesIndispensables}
                  tone="chip-brand"
                  value={newMustSkill}
                  onChange={setNewMustSkill}
                  onAdd={() => addSkill('habilidadesIndispensables', newMustSkill, () => setNewMustSkill(''))}
                  onRemove={skill => removeSkill('habilidadesIndispensables', skill)}
                />
                <SkillEditor
                  id="nice-skill"
                  label="Nice-to-have skills"
                  skills={currentVacancy.requisitos.habilidadesDeseables}
                  tone="chip-neutral"
                  value={newNiceSkill}
                  onChange={setNewNiceSkill}
                  onAdd={() => addSkill('habilidadesDeseables', newNiceSkill, () => setNewNiceSkill(''))}
                  onRemove={skill => removeSkill('habilidadesDeseables', skill)}
                />
              </div>
            )}

            <Button
              variant="primary"
              icon={<ShieldCheck className="size-4" />}
              onClick={handleRunEvaluation}
              disabled={selectedCandidates.length === 0}
              loading={isEvaluating}
              loadingLabel="Calculating…"
              className="w-full"
            >
              Re-run evaluation
            </Button>
          </div>
        </section>

        {/* Results */}
        <section aria-labelledby="results-heading" className="min-w-0 space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 id="results-heading" className="text-base font-semibold">
              Candidates <span className="tabular-nums text-ink-3">({selectedCandidates.length})</span>
            </h2>
            {selectedCandidates.length > 0 && (
              <button type="button" onClick={onClearCandidates} className="text-[13px] text-ink-2 hover:text-ink hover:underline">
                Clear all
              </button>
            )}
          </div>

          {selectedCandidates.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Briefcase className="size-5" />}
                title="No candidates to evaluate"
                description="Select candidates from the pool or open a search with linked candidates."
                action={
                  <Button variant="primary" icon={<Users className="size-4" />} onClick={onNavigateToCandidates}>
                    Choose candidates
                  </Button>
                }
              />
            </div>
          ) : (
            <ol className="space-y-4">
              {evaluations.map(({ candidate, result: evalResult }) => {
                return (
                  <li key={candidate.id} className={`panel overflow-hidden transition-opacity ${isEvaluating ? 'opacity-60' : ''}`} aria-busy={isEvaluating}>
                    <header className="flex flex-col gap-2 border-b border-rule bg-paper/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-snug">{candidate.nombre}</h3>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
                          <CandidateId id={candidate.id} />
                          <span className="tabular-nums">{candidate.experienciaTexto}</span>
                          <EnglishChip level={candidate.nivelIngles} withLabel />
                          <span>
                            {candidate.ciudad}, {candidate.pais}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FitBadge level={evalResult.nivelAjusteGeneral} score={evalResult.puntajeAjuste} />
                        <Button variant="icon" onClick={() => onToggleCandidate(candidate.id)} aria-label={`Remove ${candidate.nombre} from the evaluation`} title="Remove from evaluation">
                          <X className="size-4" />
                        </Button>
                      </div>
                    </header>

                    <div className="space-y-5 p-5">
                      <p className="max-w-[70ch] border-l-2 border-brand pl-4 text-[15px] leading-relaxed text-ink-2">{evalResult.sintesisAjuste}</p>

                      <section aria-label={`How the ${evalResult.puntajeAjuste} score was reached`} className="rounded-lg bg-well/60 px-4 py-3.5">
                        <h4 className="mb-3 text-[13px] font-medium text-ink-3">
                          Score breakdown
                          {evalResult.desglosePuntaje.length < 5 ? (
                            <span className="ml-2 font-normal">· criteria with no data on file are left out</span>
                          ) : null}
                        </h4>
                        <ScoreBreakdown dimensions={evalResult.desglosePuntaje} />
                      </section>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <CriteriaList
                          icon={<CheckCircle2 className="size-4 text-ok" />}
                          title="Met"
                          items={evalResult.requisitosCumplidos}
                          emptyText="No criteria met yet."
                        />
                        <CriteriaList
                          icon={<XCircle className="size-4 text-accent" />}
                          title="Gaps"
                          items={evalResult.brechasEncontradas}
                          emptyText="No gaps found."
                        />
                        <CriteriaList
                          icon={<HelpCircle className="size-4 text-brand" />}
                          title="To confirm"
                          items={evalResult.informacionPorValidar}
                          emptyText="Nothing pending."
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};

const CriteriaList: React.FC<{ icon: React.ReactNode; title: string; items: ItemEvaluacion[]; emptyText: string }> = ({ icon, title, items, emptyText }) => (
  <section>
    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
      {icon}
      {title} <span className="font-normal tabular-nums text-ink-3">({items.length})</span>
    </h4>
    {items.length === 0 ? (
      <p className="text-[13px] text-ink-3">{emptyText}</p>
    ) : (
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx} className="text-[13px]">
            <div className="font-medium text-ink">{item.criterio}</div>
            <div className="mt-0.5 leading-snug text-ink-2">{item.detalle}</div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

interface SkillEditorProps {
  id: string;
  label: string;
  skills: string[];
  tone: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (skill: string) => void;
}

const SkillEditor: React.FC<SkillEditorProps> = ({ id, label, skills, tone, value, onChange, onAdd, onRemove }) => (
  <div>
    <p className="label" id={`${id}-label`}>
      {label}
    </p>
    {skills.length > 0 && (
      <ul className="mb-2 flex flex-wrap gap-1.5" aria-labelledby={`${id}-label`}>
        {skills.map(skill => (
          <li key={skill} className={`chip ${tone} pr-0.5`}>
            {skill}
            <button
              type="button"
              onClick={() => onRemove(skill)}
              aria-label={`Remove ${skill}`}
              className="ml-0.5 flex size-4 items-center justify-center rounded-sm hover:bg-ink/10"
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    )}
    <form
      onSubmit={e => {
        e.preventDefault();
        onAdd();
      }}
      className="flex gap-1.5"
    >
      <label htmlFor={id} className="sr-only">
        Add {label.toLowerCase()}
      </label>
      <input id={id} type="text" autoComplete="off" value={value} onChange={e => onChange(e.target.value)} placeholder="Add a skill…" className="input h-8 flex-1 text-[13px]" />
      <Button type="submit" size="sm" icon={<Plus className="size-4" />} disabled={!value.trim()}>
        Add
      </Button>
    </form>
  </div>
);
