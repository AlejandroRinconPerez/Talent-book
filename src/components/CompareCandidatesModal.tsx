import React, { useMemo } from 'react';
import { Check, Minus, FileSpreadsheet } from 'lucide-react';
import { Candidato, Vacancy } from '../types';
import { profileName } from '../data/indexes';
import { evaluarCandidatoConVacante } from '../utils/evaluationEngine';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CandidateId, EnglishChip, FitBadge, modalityLabel } from './shared/badges';
import { downloadWorkbook, CellValue } from '../utils/xlsx';
import { todayIso } from '../utils/format';

interface CompareCandidatesModalProps {
  candidates: Candidato[];
  /** When comparing inside a search, the vacancy adds fit score and must-have skill rows. */
  vacancy?: Vacancy;
  onClose: () => void;
  onOpenProfile?: (candidate: Candidato) => void;
}

const ENGLISH_RANK: Record<string, number> = { C2: 6, C1: 5, B2: 4, B1: 3, A2: 2, A1: 1 };

interface Row {
  label: string;
  cells: React.ReactNode[];
  /** Text version for the spreadsheet export. */
  values: CellValue[];
  /** Indexes of cells to mark as strongest in the row. */
  best?: number[];
}

/** Side-by-side comparison of 2 to 4 candidates, criteria as rows. */
export const CompareCandidatesModal: React.FC<CompareCandidatesModalProps> = ({ candidates, vacancy, onClose, onOpenProfile }) => {
  const rows = useMemo<Row[]>(() => {
    const maxExp = Math.max(...candidates.map(c => c.experienciaAnos));
    const maxEng = Math.max(...candidates.map(c => ENGLISH_RANK[c.nivelIngles] ?? 0));
    const evals = vacancy ? candidates.map(c => evaluarCandidatoConVacante(c, vacancy)) : null;
    const maxScore = evals ? Math.max(...evals.map(e => e.puntajeAjuste)) : 0;
    const skillSets = candidates.map(c => c.habilidades.map(h => h.toLowerCase()));
    const has = (i: number, skill: string) => skillSets[i].some(s => s.includes(skill.toLowerCase()) || skill.toLowerCase().includes(s));

    const list: Row[] = [];

    if (evals) {
      list.push({
        label: 'Fit for this search',
        cells: evals.map(e => <FitBadge level={e.nivelAjusteGeneral} score={e.puntajeAjuste} />),
        values: evals.map(e => e.puntajeAjuste),
        best: evals.flatMap((e, i) => (e.puntajeAjuste === maxScore ? [i] : []))
      });
      vacancy!.requisitos.habilidadesIndispensables.forEach(skill => {
        const matches = candidates.map((_, i) => has(i, skill));
        list.push({
          label: `Must-have: ${skill}`,
          cells: matches.map(m =>
            m ? (
              <span className="inline-flex items-center gap-1 text-ok">
                <Check className="size-4" /> Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-ink-3">
                <Minus className="size-4" /> No evidence
              </span>
            )
          ),
          values: matches.map(m => (m ? 'Yes' : 'No evidence')),
          best: matches.every(Boolean) ? undefined : matches.flatMap((m, i) => (m ? [i] : []))
        });
      });
    }

    list.push(
      {
        label: 'Book profiles',
        cells: candidates.map(c => c.perfilesAsociados.map(profileName).join(', ')),
        values: candidates.map(c => c.perfilesAsociados.map(profileName).join('; '))
      },
      {
        label: 'Experience',
        cells: candidates.map(c => <span className="tabular-nums">{c.experienciaTexto}</span>),
        values: candidates.map(c => c.experienciaAnos),
        best: candidates.flatMap((c, i) => (c.experienciaAnos === maxExp ? [i] : []))
      },
      {
        label: 'English',
        cells: candidates.map(c => <EnglishChip level={c.nivelIngles} />),
        values: candidates.map(c => c.nivelIngles),
        best: candidates.flatMap((c, i) => ((ENGLISH_RANK[c.nivelIngles] ?? 0) === maxEng && maxEng > 0 ? [i] : []))
      },
      {
        label: 'Location',
        cells: candidates.map(c => `${c.ciudad}, ${c.pais}`),
        values: candidates.map(c => `${c.ciudad}, ${c.pais}`)
      },
      { label: 'Work mode', cells: candidates.map(c => modalityLabel(c.modalidad)), values: candidates.map(c => modalityLabel(c.modalidad)) },
      { label: 'Availability', cells: candidates.map(c => c.disponibilidad), values: candidates.map(c => c.disponibilidad) },
      { label: 'Education', cells: candidates.map(c => c.educacion), values: candidates.map(c => c.educacion) },
      {
        label: 'Key competencies',
        cells: candidates.map(c => (
          <ul className="flex flex-wrap gap-1">
            {c.competenciasClave.map(k => (
              <li key={k} className="chip chip-brand">
                {k}
              </li>
            ))}
          </ul>
        )),
        values: candidates.map(c => c.competenciasClave.join('; '))
      },
      {
        label: 'Skills',
        cells: candidates.map(c => (
          <ul className="flex flex-wrap gap-1">
            {c.habilidades.map(k => (
              <li key={k} className="chip chip-neutral">
                {k}
              </li>
            ))}
          </ul>
        )),
        values: candidates.map(c => c.habilidades.join('; '))
      },
      {
        label: 'Certifications',
        cells: candidates.map(c => (c.certificaciones.length > 0 ? c.certificaciones.join(', ') : <span className="text-ink-3">None on file</span>)),
        values: candidates.map(c => c.certificaciones.join('; '))
      },
      {
        label: 'Internal rate',
        cells: candidates.map(c => <span className="tabular-nums">{c.rangoSalarialInterno ?? '—'}</span>),
        values: candidates.map(c => c.rangoSalarialInterno ?? '')
      }
    );
    return list;
  }, [candidates, vacancy]);

  const handleExport = () => {
    downloadWorkbook(
      `talent-book-comparison-${todayIso()}.xlsx`,
      'Comparison',
      [{ header: 'Criterion', width: 28 }, ...candidates.map(c => ({ header: `${c.nombre} (${c.id})`, width: 34 }))],
      rows.map(r => [r.label, ...r.values])
    );
  };

  return (
    <Modal
      size="xl"
      title={`Compare ${candidates.length} candidates`}
      description={vacancy ? `Against the criteria of “${vacancy.titulo}”. Strongest value in each row is marked.` : 'Strongest value in each row is marked.'}
      onClose={onClose}
      bodyClassName="!p-0"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button icon={<FileSpreadsheet className="size-4" />} onClick={handleExport}>
            Export to Excel
          </Button>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Candidate comparison, one criterion per row</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 top-0 z-20 w-44 border-b border-r border-rule bg-surface px-4 py-3 text-left text-[13px] font-medium text-ink-3">
                Criterion
              </th>
              {candidates.map(c => (
                <th key={c.id} scope="col" className="sticky top-0 z-10 min-w-48 border-b border-rule bg-surface px-4 py-3 text-left align-top">
                  {onOpenProfile ? (
                    <button type="button" onClick={() => onOpenProfile(c)} className="font-semibold text-ink hover:text-brand-ink hover:underline">
                      {c.nombre}
                    </button>
                  ) : (
                    <span className="font-semibold text-ink">{c.nombre}</span>
                  )}
                  <span className="block text-[13px] font-normal text-ink-3">
                    <CandidateId id={c.id} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th scope="row" className="sticky left-0 z-10 border-b border-r border-rule bg-surface px-4 py-3 text-left align-top text-[13px] font-medium text-ink-2">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => {
                  const isBest = row.best?.includes(i) && (row.best?.length ?? 0) < candidates.length;
                  return (
                    <td key={candidates[i].id} className={`border-b border-rule px-4 py-3 align-top text-ink-2 ${isBest ? 'bg-ok-wash/50' : ''}`}>
                      {cell}
                      {isBest ? <span className="sr-only"> (strongest)</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
