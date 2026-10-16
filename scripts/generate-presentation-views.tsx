/** Refresh the deck's read-only product views after an intentional app update.
 * Run `npm run build` then `npx tsx scripts/generate-presentation-views.tsx`.
 * The generated files are committed, so the normal app build stays unchanged.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve('public/presentacion/assets');
mkdirSync(target, {recursive:true});
const css = readdirSync('dist/assets').find(name => /^index-.*\.css$/.test(name));
if (!css) throw new Error('Run npm run build before refreshing the product views.');
copyFileSync(`dist/assets/${css}`, `${target}/app-preview.css`);
// Server rendering only: no browser storage is read or written.
(globalThis as any).window = {innerWidth:1200, innerHeight:760, location:{hash:''}, localStorage:{getItem:()=>null}, addEventListener(){}, removeEventListener(){}};
const { INITIAL_BUSQUEDAS } = await import('../src/data/mockBusquedas');
const { MOCK_CANDIDATES } = await import('../src/data/candidatesData');
const { BusquedasListSection } = await import('../src/components/BusquedasListSection');
const { BookSection } = await import('../src/components/BookSection');
const { PresentationMode } = await import('../src/components/PresentationMode');
const { SAMPLE_VACANCIES } = await import('../src/utils/evaluationEngine');
const noop = () => {};
const views: Record<string, React.ReactNode> = {
  searches: <BusquedasListSection busquedas={INITIAL_BUSQUEDAS} onSelectBusqueda={noop} onOpenCreateModal={noop}/>,
  book: <BookSection onNavigateToCandidates={noop}/>,
  dossier: <PresentationMode candidates={MOCK_CANDIDATES.filter(candidate => candidate.perfilesAsociados.includes('perfil-tec-fe01')).slice(0,3)} vacancy={{...SAMPLE_VACANCIES[0], cliente:'Fintech Global Bank'}} coverNote="Three profiles selected for your frontend engineering team." onClose={noop}/>,
};
const fonts = [400,500,600,700].map(weight => `@font-face{font-family:'Bricolage Grotesque';src:url('./bricolage-${weight}.ttf') format('truetype');font-weight:${weight};font-display:swap}`).join('');
for (const [name, view] of Object.entries(views)) {
  const markup = renderToStaticMarkup(view).replace(/file:\/\/\/[^" ]+talent-book-logo-v2\.png/g, './logo.png');
  const html = `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Talent Book / ${name} / Read-only product view</title><link rel="stylesheet" href="./app-preview.css"><style>${fonts}html,body{min-width:1050px;background:#F5F5F6}body{padding:28px;font-family:'Bricolage Grotesque','Segoe UI',sans-serif}button,input,select,a{pointer-events:none} [role="dialog"]{position:relative!important;inset:auto!important;max-height:none!important;width:100%!important;max-width:none!important;transform:none!important} .fixed{position:relative!important;inset:auto!important;background:transparent!important;backdrop-filter:none!important;padding:0!important} .max-h-\\[90dvh\\]{max-height:none!important} .overflow-y-auto{overflow:visible!important;max-height:none!important} .max-w-7xl{max-width:none!important} @media print{body{padding:20px}}</style></head><body><main inert>${markup}</main></body></html>`;
  if (html.includes('file:///')) throw new Error(`Unexpected local file URL in ${name}`);
  writeFileSync(`${target}/${name}.html`, html);
  console.log(`Rendered ${name}: ${html.length} characters`);
}
const book = JSON.parse(readFileSync('src/data/book.json','utf8'));
const candidates = JSON.parse(readFileSync('src/data/candidates.json','utf8'));
console.log('Verified dataset:', {families:book.length, specialties:book.flatMap((f:any)=>f.especialidades).length, profiles:book.flatMap((f:any)=>f.especialidades.flatMap((s:any)=>s.perfiles)).length, candidates:candidates.length});
