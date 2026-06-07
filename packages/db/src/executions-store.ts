/**
 * Themis — Executions Store
 *
 * Persiste cada Execution finalizada por el endpoint SSE de /api/execute.
 * Cumple Capa 4 (memoria) extendida a runs históricos. El jurado puede ver
 * en /registro y /auto-reparacion qué ejecutó Themis y cuándo se reparó sola.
 *
 * Mismo patrón que playbook-store: MongoDB primary, filesystem fallback.
 */

import type { MongoClient, Db, Collection } from "mongodb";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Execution, ExecutionLog } from "@hack4her/playbooks";

const COLLECTION_NAME = "executions";
const FS_FALLBACK_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "data",
  "executions-store.json",
);
const FS_FALLBACK_PATH_ALT = path.join(
  process.cwd(),
  "data",
  "executions-store.json",
);

let cachedMongo: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedCollection: Collection<Execution> | null = null;

async function getMongoCollection(): Promise<Collection<Execution> | null> {
  if (cachedCollection) return cachedCollection;
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  try {
    const { MongoClient } = await import("mongodb");
    cachedMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await cachedMongo.connect();
    cachedDb = cachedMongo.db("themis");
    cachedCollection = cachedDb.collection<Execution>(COLLECTION_NAME);
    return cachedCollection;
  } catch (err) {
    console.warn(
      "[executions-store] MongoDB no conectó, usando filesystem:",
      (err as Error).message.slice(0, 100),
    );
    return null;
  }
}

async function resolveFsPath(): Promise<string> {
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

async function fsReadAll(): Promise<Execution[]> {
  const filePath = await resolveFsPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Execution[];
  } catch {
    return [];
  }
}

async function fsWriteAll(executions: Execution[]): Promise<void> {
  const filePath = await resolveFsPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(executions, null, 2));
}

// ============================================================
// Public API
// ============================================================

export async function saveExecution(execution: Execution): Promise<Execution> {
  const coll = await getMongoCollection();
  if (coll) {
    await coll.replaceOne({ id: execution.id }, execution, { upsert: true });
    return execution;
  }
  const all = await fsReadAll();
  const filtered = all.filter((e) => e.id !== execution.id);
  filtered.unshift(execution);
  // cap history at 200 entries para no inflar disk
  await fsWriteAll(filtered.slice(0, 200));
  return execution;
}

export async function listExecutions(): Promise<Execution[]> {
  const coll = await getMongoCollection();
  if (coll) {
    const docs = await coll
      .find({}, { sort: { started_at: -1 }, limit: 100 })
      .toArray();
    return docs.map((d) => {
      const { _id: _omit, ...rest } = d as Execution & { _id?: unknown };
      return rest as Execution;
    });
  }
  return fsReadAll();
}

export async function getExecution(id: string): Promise<Execution | null> {
  const coll = await getMongoCollection();
  if (coll) {
    const doc = await coll.findOne({ id });
    if (!doc) return null;
    const { _id: _omit, ...rest } = doc as Execution & { _id?: unknown };
    return rest as Execution;
  }
  const all = await fsReadAll();
  return all.find((e) => e.id === id) ?? null;
}

/**
 * Lista TODOS los logs que tienen `adapted_to` (self-healing events) cruzando
 * todas las ejecuciones. Para la página /auto-reparacion.
 */
export interface SelfHealEvent extends ExecutionLog {
  execution_id: string;
  playbook_id: string;
  occurred_at: string;
}

export async function listSelfHealEvents(): Promise<SelfHealEvent[]> {
  const executions = await listExecutions();
  const events: SelfHealEvent[] = [];
  for (const exec of executions) {
    for (const log of exec.logs ?? []) {
      if (log.adapted_to) {
        events.push({
          ...log,
          execution_id: exec.id,
          playbook_id: exec.playbook_id,
          occurred_at: log.timestamp,
        });
      }
    }
  }
  return events.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

export async function getExecutionsStatus(): Promise<{
  backend: "mongodb" | "filesystem";
  count: number;
  selfHealCount: number;
}> {
  const all = await listExecutions();
  const selfHealCount = all.reduce(
    (sum, e) => sum + (e.logs ?? []).filter((l) => l.adapted_to).length,
    0,
  );
  const coll = await getMongoCollection();
  return {
    backend: coll ? "mongodb" : "filesystem",
    count: all.length,
    selfHealCount,
  };
}
