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
const { CompareCandidatesModal } = await import(root + '/components/CompareCandidatesModal');
const { PresentationBuilderModal } = await import(root + '/components/PresentationBuilderModal');
const { GlobalSearch } = await import(root + '/components/GlobalSearch');
const { buildWorkbook } = await import(root + '/utils/xlsx');
const { queryIndex } = await import(root + '/data/searchIndex');
const { SAMPLE_VACANCIES } = await import(root + '/utils/evaluationEngine');
const { withActivity, relativeTime } = await import(root + '/utils/activity');
const { saveWorkspace, loadWorkspace, clearWorkspace } = await import(root + '/services/storage');
const { searchCandidates, parseRequirement, englishRank } = await import(root + '/services/candidateSearch');
const { AddCandidatesToBusquedaModal } = await import(root + '/components/AddCandidatesToBusquedaModal');
const { CreateBusquedaModal } = await import(root + '/components/CreateBusquedaModal');
const App = (await import(root + '/App')).default;

const noop = () => {};
const checks: [string, () => string][] = [
  ['App (searches list)', () => renderToString(<App />)],
  ['BusquedasListSection', () => renderToString(<BusquedasListSection busquedas={INITIAL_BUSQUEDAS} onSelectBusqueda={noop} onOpenCreateModal={noop} />)],
  ['BusquedaDetailSection', () => renderToString(<BusquedaDetailSection busqueda={INITIAL_BUSQUEDAS[0]} onBackToList={noop} onUpdateBusqueda={noop} onOpenCandidateDetail={noop} onEvaluateCompatibility={noop} onOpenPresentation={noop} />)],
  ['BusquedaDetailSection (closed, 9 entries)', () => renderToString(<BusquedaDetailSection busqueda={INITIAL_BUSQUEDAS[4]} onBackToList={noop} onUpdateBusqueda={noop} onOpenCandidateDetail={noop} onEvaluateCompatibility={noop} onOpenPresentation={noop} />)],
  ['CandidatesSection', () => renderToString(<CandidatesSection selectedCandidateIds={['CAN-8821']} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} busquedas={INITIAL_BUSQUEDAS} />)],
  ['CandidatesSection (filtered from Book)', () => renderToString(<CandidatesSection initialFilter={{ familia: 'Technology', especialidad: 'Software Development & Cloud' }} selectedCandidateIds={[]} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} />)],
  ['BookSection', () => renderToString(<BookSection onNavigateToCandidates={noop} />)],
  ['EvaluationSection', () => renderToString(<EvaluationSection selectedCandidateIds={['CAN-8821', 'CAN-4432', 'CAN-5401']} onToggleCandidate={noop} onClearCandidates={noop} onNavigateToCandidates={noop} onOpenPresentation={noop} currentVacancy={SAMPLE_VACANCIES[0]} onUpdateVacancy={noop} busquedaNombre="X" onBackToBusqueda={noop} />)],
  ['PresentationMode (12 candidates)', () => renderToString(<PresentationMode candidates={MOCK_CANDIDATES.slice(0, 12)} vacancy={SAMPLE_VACANCIES[0]} coverNote="Three profiles pre-screened this week." onClose={noop} />)],
  ['CompareCandidatesModal (with vacancy)', () => renderToString(<CompareCandidatesModal candidates={MOCK_CANDIDATES.slice(0, 3)} vacancy={SAMPLE_VACANCIES[0]} onClose={noop} />)],
  ['PresentationBuilderModal', () => renderToString(<PresentationBuilderModal candidates={MOCK_CANDIDATES.slice(0, 4)} clientName="Acme" onClose={noop} onConfirm={noop} />)],
  ['AddCandidatesToBusquedaModal', () => renderToString(<AddCandidatesToBusquedaModal busqueda={INITIAL_BUSQUEDAS[0]} onClose={noop} onLinkCandidates={noop} />)],
  ['CreateBusquedaModal', () => renderToString(<CreateBusquedaModal onClose={noop} onCreate={noop} usuarioId="USR-001" />)],
  ['GlobalSearch', () => renderToString(<GlobalSearch busquedas={INITIAL_BUSQUEDAS} onClose={noop} onOpenSearch={noop} onOpenSpecialty={noop} onOpenCandidate={noop} />)],
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
// search index and xlsx writer
const hits = queryIndex('react colombia', INITIAL_BUSQUEDAS);
console.log('search "react colombia":', hits.total, 'hits |', hits.candidates.map((h: { title: string }) => h.title).join(', '));
const wb = buildWorkbook('Test', [{ header: 'ID' }, { header: 'Name' }], [['CAN-1', 'Ana'], ['CAN-2', 5]]);
const sig = String.fromCharCode(wb[0], wb[1]);
console.log('xlsx bytes:', wb.length, '| zip signature:', sig === 'PK' ? 'OK' : 'BAD');
// pagination maths from CandidatesSection
const html = renderToString(<CandidatesSection selectedCandidateIds={[]} onToggleCandidate={noop} onClearSelection={noop} onProceedToEvaluate={noop} />);
// renderToString separates adjacent text nodes with <!-- -->; strip them before matching copy
const text = html.replace(/<!-- -->/g, '');
console.log('pagination text present:', /Showing 1–24 of 250/.test(text), '| sort control:', /Sort by/.test(text), '| cards on page:', (html.match(/select-card/g) || []).length);
// candidate search rules the client asked for
const expect = (name: string, ok: boolean) => {
  if (!ok) failed++;
  console.log(ok ? 'OK  ' : 'FAIL', name);
};
const all = (filtros: any, incluirPorValidar = true, texto = '') => searchCandidates({ texto, filtros, incluirPorValidar }).hits;
const b1 = all({ inglesMinimo: 'B1' });
expect('English B1 brings B1, B2, C1 and C2', ['B1', 'B2', 'C1', 'C2'].every(l => b1.some((h: any) => h.candidato.nivelIngles === l)));
expect('English B1 leaves out A1 and A2', b1.every((h: any) => h.porValidar.length > 0 || englishRank(h.candidato.nivelIngles) >= 3));
expect('English with no data stays in, flagged to validate', b1.some((h: any) => h.porValidar.includes('ingles')));
expect('...and after every full match', b1.findIndex((h: any) => h.porValidar.length > 0) >= b1.filter((h: any) => h.porValidar.length === 0).length);
expect('Strict mode drops the ones to validate', all({ inglesMinimo: 'B1' }, false).every((h: any) => h.porValidar.length === 0));
const three = all({ experienciaMinima: 3 });
expect('3 years brings 3 or more, no upper limit', three.every((h: any) => h.candidato.experienciaAnos >= 3) && three.some((h: any) => h.candidato.experienciaAnos >= 10));
expect('No text and no filters: the whole pool', all({}).length === MOCK_CANDIDATES.length);
const sem = searchCandidates({ texto: 'contador con conciliaciones bancarias y cierre mensual', filtros: {}, incluirPorValidar: true });
expect('Spanish text finds accountants (semantic)', sem.semantica && /Account/i.test(sem.hits[0]?.candidato.resumenProfesional ?? ''));
const parsed = parseRequirement('Contador, inglés B2, mínimo 3 años, remoto desde Colombia o México');
expect('Requirements read from text', parsed.filtros.inglesMinimo === 'B2' && parsed.filtros.experienciaMinima === 3 && parsed.filtros.modalidad === 'Remote' && parsed.filtros.paises?.join() === 'Colombia,Mexico');
expect('Seed searches carry a Book specialty', INITIAL_BUSQUEDAS.every((s: any) => s.especialidadKey && !s.perfilBookId));
process.exit(failed ? 1 : 0);
})();
