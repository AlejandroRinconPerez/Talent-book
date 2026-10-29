import type { TourStep } from './Tour';

/** Guided tour, in the order a sales rep works: searches → Book → pool → present. */
export const TOUR_STEPS: TourStep[] = [
  {
    tab: 'busquedas',
    target: 'nav',
    title: 'Three workspaces',
    body: 'My searches holds one search per client requirement. The Book is the catalog of families and specialties we sell. Candidates is the pool, searched by what the client asks for.'
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
    body: 'A new search captures the role, the client and the criteria. Paste the client requirement and Talent Book reads English, years, country and work mode out of it.'
  },
  {
    tab: 'book',
    target: 'book-index',
    title: 'The Book is an index',
    body: 'Twelve job families on the left. Open one to read its specialties: the roles each covers and what is in and out of scope.'
  },
  {
    tab: 'book',
    target: 'book-page',
    title: 'From specialty to candidates',
    body: 'Every specialty shows how many candidates it has. One click filters the pool to that specialty.'
  },
  {
    tab: 'candidates',
    target: 'semantic-search',
    title: 'Describe what the client needs',
    body: 'The text runs a semantic search over every CV. English level, years, country and work mode in the text become filters you can change.'
  },
  {
    tab: 'candidates',
    target: 'filters',
    title: 'Filters are optional',
    body: 'English and experience are minimums: B1 also brings B2, C1 and C2. A candidate with no data for a filter stays in the list, marked to validate.'
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
