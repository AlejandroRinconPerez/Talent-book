import { BusquedaComercial } from '../types';

/**
 * Browser persistence for the demo. Searches and the catalog selection live in
 * localStorage under a versioned key; the same JSON can be exported, imported
 * on another machine, or reset to the seed. Every read and write is guarded:
 * private windows and blocked storage must not break the app.
 */

const STORAGE_KEY = 'talentbook.workspace';
const SCHEMA_VERSION = 2;

export interface Workspace {
  schemaVersion: number;
  savedAt: string;
  busquedas: BusquedaComercial[];
  selectedCandidateIds: string[];
}

export function loadWorkspace(): Workspace | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.busquedas)) return null;
    return {
      schemaVersion: SCHEMA_VERSION,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      busquedas: parsed.busquedas,
      selectedCandidateIds: Array.isArray(parsed.selectedCandidateIds) ? parsed.selectedCandidateIds : []
    };
  } catch {
    return null;
  }
}

export function saveWorkspace(data: Omit<Workspace, 'schemaVersion' | 'savedAt'>): string | null {
  const savedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, savedAt, ...data }));
    return savedAt;
  } catch {
    return null;
  }
}

export function clearWorkspace(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable; nothing to clear.
  }
}

/** Serializes the workspace as a downloadable JSON file. */
export function exportWorkspaceFile(data: Omit<Workspace, 'schemaVersion' | 'savedAt'>): void {
  const payload: Workspace = { schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talent-book-workspace-${payload.savedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true; workspace: Workspace } | { ok: false; reason: string };

/** Parses a previously exported file. Validates the shape before accepting it. */
export async function importWorkspaceFile(file: File): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { ok: false, reason: 'The file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'The file does not contain a workspace.' };
  const ws = parsed as Partial<Workspace>;
  if (ws.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `This file uses schema version ${String(ws.schemaVersion)}; this app expects version ${SCHEMA_VERSION}.` };
  }
  if (!Array.isArray(ws.busquedas) || !ws.busquedas.every(isBusqueda)) {
    return { ok: false, reason: 'The searches in the file have an unexpected format.' };
  }
  return {
    ok: true,
    workspace: {
      schemaVersion: SCHEMA_VERSION,
      savedAt: typeof ws.savedAt === 'string' ? ws.savedAt : new Date().toISOString(),
      busquedas: ws.busquedas,
      selectedCandidateIds: Array.isArray(ws.selectedCandidateIds) ? ws.selectedCandidateIds.filter(id => typeof id === 'string') : []
    }
  };
}

function isBusqueda(value: unknown): value is BusquedaComercial {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.nombre === 'string' &&
    typeof b.estado === 'string' &&
    typeof b.requisitos === 'object' &&
    Array.isArray(b.candidatosVinculados) &&
    Array.isArray(b.actividad)
  );
}
