/**
 * Themis — Playbook Store (Capa 4 · Knowledge Graph)
 *
 * Persistencia dual:
 *   1. MongoDB Atlas si MONGODB_URI está configurada (MLH prize)
 *   2. Filesystem JSON si no — para que el demo nunca rompa
 *
 * Operaciones:
 *   - save(playbook)        guardar un playbook aprendido
 *   - list()                listar todos
 *   - get(id)               obtener uno
 *   - recallSimilar(query)  buscar mappings similares para reusar
 *
 * Owner: Jhulyam + Emi
 */

import type { MongoClient, Db, Collection } from "mongodb";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Playbook, Mapping } from "@hack4her/playbooks";

// ============================================================
// Backend selection
// ============================================================

let cachedMongo: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedCollection: Collection<Playbook> | null = null;

const COLLECTION_NAME = "playbooks";
const FS_FALLBACK_PATH = path.join(process.cwd(), "..", "..", "data", "playbooks-store.json");
const FS_FALLBACK_PATH_ALT = path.join(process.cwd(), "data", "playbooks-store.json");

async function getMongoCollection(): Promise<Collection<Playbook> | null> {
  if (cachedCollection) return cachedCollection;
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    const { MongoClient } = await import("mongodb");
    cachedMongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    await cachedMongo.connect();
    cachedDb = cachedMongo.db("themis");
    cachedCollection = cachedDb.collection<Playbook>(COLLECTION_NAME);
    return cachedCollection;
  } catch (err) {
    console.warn(
      "[playbook-store] MongoDB no conectó, usando filesystem:",
      (err as Error).message.slice(0, 100),
    );
    return null;
  }
}

// ============================================================
// Filesystem fallback
// ============================================================

async function resolveFsPath(): Promise<string> {
  // Intenta workspace root primero, después relativo
  try {
    await fs.access(path.dirname(FS_FALLBACK_PATH));
    return FS_FALLBACK_PATH;
  } catch {
    try {
      await fs.mkdir(path.dirname(FS_FALLBACK_PATH_ALT), { recursive: true });
      return FS_FALLBACK_PATH_ALT;
    } catch {
      return FS_FALLBACK_PATH_ALT;
    }
  }
}

async function fsReadAll(): Promise<Playbook[]> {
  const filePath = await resolveFsPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Playbook[];
  } catch {
    return [];
  }
}

async function fsWriteAll(playbooks: Playbook[]): Promise<void> {
  const filePath = await resolveFsPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(playbooks, null, 2));
}

// ============================================================
// Public API
// ============================================================

export async function saveSavedPlaybook(playbook: Playbook): Promise<Playbook> {
  const coll = await getMongoCollection();

  if (coll) {
    await coll.replaceOne({ id: playbook.id }, playbook, { upsert: true });
    return playbook;
  }

  const all = await fsReadAll();
  const filtered = all.filter((p) => p.id !== playbook.id);
  filtered.unshift(playbook);
  await fsWriteAll(filtered);
  return playbook;
}

export async function listSavedPlaybooks(): Promise<Playbook[]> {
  const coll = await getMongoCollection();
  if (coll) {
    const docs = await coll
      .find({}, { sort: { created_at: -1 }, limit: 50 })
      .toArray();
    return docs.map((d) => {
      const { _id: _omit, ...rest } = d as Playbook & { _id?: unknown };
      return rest as Playbook;
    });
  }

  return fsReadAll();
}

export async function getSavedPlaybook(id: string): Promise<Playbook | null> {
  const coll = await getMongoCollection();
  if (coll) {
    const doc = await coll.findOne({ id });
    if (!doc) return null;
    const { _id: _omit, ...rest } = doc as Playbook & { _id?: unknown };
    return rest as Playbook;
  }

  const all = await fsReadAll();
  return all.find((p) => p.id === id) ?? null;
}

/**
 * Recall: dado un par (source_site, destination_site), busca mappings
 * que ya hayamos aprendido. Para el demo del "ya vi este mapeo antes".
 */
export async function recallSimilarMappings(query: {
  source_site?: string;
  destination_site?: string;
}): Promise<{ playbook_id: string; matches: Mapping[] }[]> {
  const all = await listSavedPlaybooks();
  const results: { playbook_id: string; matches: Mapping[] }[] = [];

  for (const pb of all) {
    const matches: Mapping[] = [];
    const sourceMatches =
      !query.source_site || pb.source_url?.includes(query.source_site);
    const destMatches =
      !query.destination_site ||
      pb.destination_url?.includes(query.destination_site);

    if (sourceMatches && destMatches) {
      matches.push(...(pb.mappings ?? []));
    }
    if (matches.length > 0) {
      results.push({ playbook_id: pb.id, matches });
    }
  }
  return results;
}

export async function getStoreStatus(): Promise<{
  backend: "mongodb" | "filesystem";
  count: number;
}> {
  const coll = await getMongoCollection();
  if (coll) {
    const count = await coll.countDocuments();
    return { backend: "mongodb", count };
  }
  const all = await fsReadAll();
  return { backend: "filesystem", count: all.length };
}
