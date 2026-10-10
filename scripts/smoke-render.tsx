/**
 * Render smoke test: server-renders every major screen with the sample data
 * and round-trips the local storage service. Catches runtime errors without a
 * browser (headless browsers are blocked on some corporate machines).
 *
 *   npm run test:render
 */
import React from 'react';
import { renderToString } from 'react-dom/server';

const store = new Map<string, string>();
(globalThis as any).window = {
  location: { hash: '' },
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) },
  history: { replaceState() {}, pushState() {} },
  addEventListener() {}, removeEventListener() {},
  innerWidth: 1440, innerHeight: 900,
  scrollTo() {}, setTimeout, clearTimeout
};
(globalThis as any).document = { activeElement: null, body: { style: {} }, addEventListener() {}, removeEventListener() {}, querySelector: () => null };

(async () => {
const root = '../src';
const { INITIAL_BUSQUEDAS } = await import(root + '/data/mockBusquedas');
const { MOCK_CANDIDATES } = await import(root + '/data/candidatesData');
const { BusquedasListSection } = await import(root + '/components/BusquedasListSection');
const { BusquedaDetailSection } = await import(root + '/components/BusquedaDetailSection');
const { CandidatesSection } = await import(root + '/components/CandidatesSection');
const { BookSection } = await import(root + '/components/BookSection');
const { EvaluationSection } = await import(root + '/components/EvaluationSection');
const { PresentationMode } = await import(root + '/components/PresentationMode');
const { SAMPLE_VACANCIES } = await import(root + '/utils/evaluationEngine');
const { withActivity, relativeTime } = await import(root + '/utils/activity');
const { saveWorkspace, loadWorkspace, clearWorkspace } = await import(root + '/services/storage');
const App = (await import(root + '/App')).default;

const noop = () => {};
const checks: [string, () => string][] = [
  ['App (searches list)', () => renderToString(<App />)],
  ['BusquedasListSection', () => renderToString(<BusquedasListSection busquedas={INITIAL_BUSQUEDAS} onSelectBusqueda={noop} onOpenCreateModal={noop} />)],
  ['BusquedaDetailSection', () => renderToString(<BusquedaDetailSection busqueda={INITIAL_BUSQUEDAS[0]} onBackToList={noop} onUpdateBusqueda={noop} onOpenCandidateDetail={noop} onEvaluateCompatibility={noop} onOpenPresentation={noop} />)],
  ['BusquedaDetailSection (closed, 9 entries)', () => renderToString(<BusquedaDetailSection busqueda={INITIAL_BUSQUEDAS[4]} onBackToList={noop} onUpdateBusqueda={noop} onOpenCandidateDetail={noop} onEvaluateCompatibility={noop} onOpenPresentation={noop} />)],
  ['CandidatesSection', () => renderToString(<CandidatesSection selectedCandidateIds={['CAN-8821']} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} busquedas={INITIAL_BUSQUEDAS} />)],
  ['CandidatesSection (filtered from Book)', () => renderToString(<CandidatesSection initialFilter={{ familia: 'Technology', especialidad: 'Software Development & Cloud', perfilId: 'perfil-tec-fe01' }} selectedCandidateIds={[]} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} />)],
  ['BookSection', () => renderToString(<BookSection onNavigateToCandidates={noop} />)],
  ['EvaluationSection', () => renderToString(<EvaluationSection selectedCandidateIds={['CAN-8821', 'CAN-4432', 'CAN-5401']} onToggleCandidate={noop} onClearCandidates={noop} onNavigateToCandidates={noop} onOpenPresentation={noop} currentVacancy={SAMPLE_VACANCIES[0]} onUpdateVacancy={noop} busquedaNombre="X" onBackToBusqueda={noop} />)],
  ['PresentationMode (12 candidates)', () => renderToString(<PresentationMode candidates={MOCK_CANDIDATES.slice(0, 12)} vacancy={SAMPLE_VACANCIES[0]} onClose={noop} />)],
];
let failed = 0;
for (const [name, fn] of checks) {
  try { const html = fn(); console.log('OK  ', name, html.length, 'chars'); }
  catch (e: any) { failed++; console.log('FAIL', name, '->', e.message.split('\n')[0]); }
}
// storage + activity round trip
const b = withActivity(INITIAL_BUSQUEDAS[0], 'presentada', 'Presented 2 candidates.');
console.log('activity:', b.actividad.length, 'entries, newest', b.actividad[0].tipo, relativeTime(b.actualizadoEn));
const stamp = saveWorkspace({ busquedas: [b], selectedCandidateIds: ['CAN-1'] });
const back = loadWorkspace();
console.log('storage round trip:', stamp ? 'saved' : 'not saved', back?.busquedas.length === 1 && back.busquedas[0].actividad.length === b.actividad.length ? 'OK' : 'MISMATCH');
clearWorkspace(); console.log('after clear:', loadWorkspace() === null ? 'OK' : 'still there');
// pagination maths from CandidatesSection
const html = renderToString(<CandidatesSection selectedCandidateIds={[]} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} />);
// renderToString separates adjacent text nodes with <!-- -->; strip them before matching copy
const text = html.replace(/<!-- -->/g, '');
console.log('pagination text present:', /Showing 1–24 of 250/.test(text), '| sort control:', /Sort by/.test(text), '| cards on page:', (html.match(/select-card/g) || []).length);
process.exit(failed ? 1 : 0);
})();
