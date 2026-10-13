/**
 * Renders the printable profile of one candidate to tmp/print-profile.html so the
 * page layout can be inspected in a browser without opening the print dialog.
 *
 *   npx tsx scripts/render-print-profile.mjs [candidateId]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { MOCK_CANDIDATES } from '../src/data/candidatesData.ts';
import { profileName } from '../src/data/indexes.ts';
import { modalityLabel } from '../src/components/shared/badges.tsx';
import { buildCandidateProfileDocument } from '../src/utils/printProfile.ts';

const wanted = process.argv[2];
const candidate = wanted ? MOCK_CANDIDATES.find(c => c.id === wanted) : MOCK_CANDIDATES[0];
if (!candidate) throw new Error(`No candidate ${wanted}`);

const html = buildCandidateProfileDocument(candidate, {
  profileNames: candidate.perfilesAsociados.map(profileName),
  modality: modalityLabel(candidate.modalidad)
});

mkdirSync('tmp', { recursive: true });
writeFileSync('tmp/print-profile.html', html);
console.log(`Rendered ${candidate.id} -> tmp/print-profile.html (${html.length} bytes)`);
