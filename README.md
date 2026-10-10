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
| `book.json` | The taxonomy: 12 job families → specialties → 62 generic profiles |
| `candidates.json` | 250 candidates spread across every profile. **Fictional names; no real person is represented.** |
| `busquedas.seed.json` | 9 sample client searches with statuses, stages and activity |

Regenerate the candidate pool (deterministic, seeded) with:

```bash
npm run data:candidates
```

Edit `scripts/generate-candidates.mjs` to change the volume (`TARGET_TOTAL`), the country mix or the per-family pools. The 19 hand-written candidates in `scripts/candidates.base.json` are always kept.

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
