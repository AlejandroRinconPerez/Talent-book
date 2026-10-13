/**
 * Compares the new 0-100 fit score against the label the gap-count rule produces
 * today, over every candidate x sample vacancy, to see whether the score can drive
 * the label without reclassifying people.
 *
 *   npx tsx scripts/check-fit-score.mjs
 */
import { MOCK_CANDIDATES } from '../src/data/candidatesData.ts';
import { SAMPLE_VACANCIES, evaluarCandidatoConVacante } from '../src/utils/evaluationEngine.ts';

const UMBRALES_PUNTAJE = { alto: 85, medio: 60 };

const fromScore = s => (s >= UMBRALES_PUNTAJE.alto ? 'High' : s >= UMBRALES_PUNTAJE.medio ? 'Medium' : 'Partial with gaps');

const rows = [];
for (const vacancy of SAMPLE_VACANCIES) {
  for (const candidate of MOCK_CANDIDATES) {
    const r = evaluarCandidatoConVacante(candidate, vacancy);
    rows.push({ label: r.nivelAjusteGeneral, score: r.puntajeAjuste, derived: fromScore(r.puntajeAjuste) });
  }
}

const byLabel = {};
for (const r of rows) {
  const b = (byLabel[r.label] ??= { n: 0, min: 100, max: 0, sum: 0, agree: 0 });
  b.n++;
  b.sum += r.score;
  b.min = Math.min(b.min, r.score);
  b.max = Math.max(b.max, r.score);
  if (r.derived === r.label) b.agree++;
}

console.log(`${rows.length} evaluations\n`);
console.log('label'.padEnd(20), 'n'.padStart(6), 'min'.padStart(5), 'avg'.padStart(6), 'max'.padStart(5), 'same label from score'.padStart(24));
for (const [label, b] of Object.entries(byLabel)) {
  console.log(
    label.padEnd(20),
    String(b.n).padStart(6),
    String(b.min).padStart(5),
    (b.sum / b.n).toFixed(1).padStart(6),
    String(b.max).padStart(5),
    `${((b.agree / b.n) * 100).toFixed(1)}%`.padStart(24)
  );
}

const agree = rows.filter(r => r.derived === r.label).length;
console.log(`\noverall agreement: ${((agree / rows.length) * 100).toFixed(1)}%`);
