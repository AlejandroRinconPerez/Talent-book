# Talent Book

Functional mockup of the internal sales tool for talent solutions: the occupational profile book, the candidate pool, client searches with CEIPAL export, fit evaluation and a client-facing presentation mode.

Everything runs in the browser. There is no backend yet; the app is ready for the .NET backend on Azure.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production bundle in dist/
npm run preview    # serve dist/ locally
```

## Sample data

All data is JSON under `src/data/`:

| File | What it holds |
|---|---|
| `book.json` | The taxonomy: 12 job families → 28 specialties. The 62 generic profiles inside are folded into their specialty (roles covered, scope, skills); the app no longer navigates or filters by profile |
| `candidates.json` | 250 candidates spread across every profile. **Fictional names; no real person is represented.** |
| `busquedas.seed.json` | 9 sample client searches with statuses, stages and activity |

Regenerate the candidate pool (deterministic, seeded) with:

```bash
npm run data:candidates
```

Edit `scripts/generate-candidates.mjs` to change the volume (`TARGET_TOTAL`), the country mix or the per-family pools. The 19 hand-written candidates in `scripts/candidates.base.json` are always kept.

## Candidate search

`src/services/candidateSearch.ts` holds the rules; the Candidates page and "Add candidates" inside a search both use it.

- The rep describes what the client needs. That text always ranks the pool by similarity to each CV. In production this is the pgvector query over the CV embeddings; here a TF-IDF vector stands in for the embedding.
- English level, years, country and work mode are read out of the text and applied as filters the rep can change. In production an LLM does this reading.
- Filters are optional. English and experience are minimums: B1 accepts B1, B2, C1 and C2; 3 years accepts 3 or more.
- A filter only rules out a candidate who has the data and falls short. A candidate with no data for it stays in the list, after the full matches, marked "To validate".

## Persistence for demos

Searches and the catalog selection are saved in the browser (`localStorage`, versioned schema) as you work. From the database icon in the header you can:

- **Export workspace** as a JSON file (to move a demo to another machine or keep a snapshot).
- **Import workspace** from such a file.
- **Reset demo data** to the seed searches.

The CEIPAL integration and the fit evaluation are simulated; the footer and the About dialog say so.

## Checks

```bash
npm run lint         # TypeScript
npm run test:render  # server-renders every screen with the sample data; no browser needed
```

`test:render` exists because headless browsers may be blocked by corporate policy on some workstations.
