# Talent Book presentation

Six concise slides, including the cover, in English and Spanish. Open `/presentacion` in the running mock; no navigation link is added to the application.

- Select **Español / English** in the header. The selection stays in the URL (`?lang=es` or `?lang=en`), without touching application storage.
- Use the arrow keys, navigation buttons, or a horizontal swipe. `O` opens the slide index, `N` toggles speaker notes, and `F` toggles full screen.
- **Save PDF / Guardar PDF** prints six landscape pages in the selected language, without controls or notes.
- Product previews are read-only renders of the actual English mock. **Enlarge / Ampliar** opens the full view. They do not access or modify the live workspace.

The deck is standalone in `public/presentacion/`. The normal Vite build copies it to `dist/presentacion/`; the existing application, routing, configuration, and dependencies are unchanged. `presentacion/index.html` is an additive development entry because Vite's HTML fallback searches the project root. Static production hosts serve the built directory directly, including under `/Talent-book/presentacion/`.

Copy and speaker notes: `public/presentacion/translations.js`. The initial language is English. The self-hosted Bricolage Grotesque font includes its SIL Open Font License in `assets/OFL.txt`.

To intentionally refresh product views after a future mock update:

```sh
npm run build
npx tsx scripts/generate-presentation-views.tsx
npm run build
```

Browser verification uses a fresh headless Chrome profile and Node's built-in WebSocket, with no project dependencies added:

```sh
node scripts/check-presentation.mjs http://127.0.0.1:3004/presentacion/
```

Replace the port with the development server's port. On another system, set `CHROME_PATH` to its Chrome executable. Checks cover six slides in both languages, desktop/laptop/mobile layout, navigation, notes, overview, enlarged views, and exactly six PDF pages per language. Review artifacts are written to `output/presentation-qa/`.
