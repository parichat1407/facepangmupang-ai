/**
 * Saved simulations, kept only in this browser (IndexedDB) — never sent to or stored on the server.
 * Every call fails soft: private windows or blocked storage just mean nothing is saved.
 */
export type SavedSim = {
  id: string;
  createdAt: number;
  before: string; // data URL of the downsized photo that was sent
  after: string; // data URL of the generated image
  level: string;
  view: 'front' | 'side';
  model?: string;
  ms?: number;
};

const DB = 'facepangmupang';
const STORE = 'simulations';
export const MAX_SAVED = 12;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function listSims(): Promise<SavedSim[]> {
  try {
    const all = (await run<SavedSim[]>('readonly', s => s.getAll() as IDBRequest<SavedSim[]>)) ?? [];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch { return []; }
}

/** Saves a simulation and trims the oldest beyond MAX_SAVED. Returns the updated list (newest first). */
export async function saveSim(sim: SavedSim): Promise<SavedSim[]> {
  try {
    await run('readwrite', s => { s.put(sim); });
    const all = await listSims();
    for (const old of all.slice(MAX_SAVED)) await run('readwrite', s => { s.delete(old.id); });
    return all.slice(0, MAX_SAVED);
  } catch { return [sim]; }
}

export async function deleteSim(id: string) {
  try { await run('readwrite', s => { s.delete(id); }); } catch { /* ignore */ }
}

export async function clearSims() {
  try { await run('readwrite', s => { s.clear(); }); } catch { /* ignore */ }
}

export function downloadName(sim: Pick<SavedSim, 'createdAt' | 'after'>) {
  const d = new Date(sim.createdAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ext = sim.after.startsWith('data:image/jpeg') ? 'jpg' : sim.after.startsWith('data:image/webp') ? 'webp' : 'png';
  return `facepangmupang-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
}
