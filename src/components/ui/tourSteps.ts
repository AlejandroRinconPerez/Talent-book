import type { TourStep } from './Tour';

/** Guided tour, in the order a sales rep works: searches → Book → pool → present. */
export const TOUR_STEPS: TourStep[] = [
  {
    tab: 'busquedas',
    target: 'nav',
    title: 'Three workspaces',
    body: 'My searches holds one search per client requirement. The Book is the catalog of profiles we sell. Candidates is the pool, classified by those profiles.'
  },
  {
    tab: 'busquedas',
    target: 'kpis',
    title: 'Your pipeline at a glance',
    body: 'Open searches, candidates in process, exports to CEIPAL and presentations in the last 30 days, calculated from your searches.'
  },
  {
    tab: 'busquedas',
    target: 'new-search',
    title: 'Start from the client requirement',
    body: 'A new search captures the role, the client and the criteria. Picking a Book profile pre-fills the description and the must-have skills.'
  },
  {
    tab: 'book',
    target: 'book-index',
    title: 'The Book is an index',
    body: 'Twelve job families on the left. Open one to read its specialties and the generic profiles, each stating what the role includes and excludes.'
  },
  {
    tab: 'book',
    target: 'book-page',
    title: 'From profile to candidates',
    body: 'Every profile shows how many candidates carry it. One click filters the pool to exactly that profile.'
  },
  {
    tab: 'candidates',
    target: 'filters',
    title: 'Filter the pool',
    body: 'Narrow by family, specialty and profile, then by experience, English level and country. Filters combine.'
  },
  {
    tab: 'candidates',
    target: 'results',
    title: 'Select and act',
    body: 'Tick candidates to add them to a search or evaluate their fit against a vacancy. Switch to the table to compare side by side.'
  },
  {
    tab: 'busquedas',
    target: 'present',
    title: 'Present to the client',
    body: 'Opens a clean, printable dossier of the shortlist for screen sharing: no internal notes, no rates, no pipeline state.'
  }
];
