/**
 * Themis — Client Store (multi-tenant)
 *
 * Persiste Clientes Tuali (OXXO, Soriana, Costco, Abarrotes) con su catálogo,
 * ERP, zona y playbooks asociados. Dual backend: MongoDB Atlas o filesystem.
 *
 * Pre-seed: 4 clientes demo siempre disponibles para que el jurado vea el
 * concepto multi-tenant en acción desde el primer click.
 */

import type { MongoClient, Db, Collection } from "mongodb";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Client } from "@hack4her/playbooks";

const COLLECTION_NAME = "clients";
const FS_FALLBACK_PATH = path.join(process.cwd(), "..", "..", "data", "clients-store.json");
const FS_FALLBACK_PATH_ALT = path.join(process.cwd(), "data", "clients-store.json");

let cachedMongo: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedCollection: Collection<Client> | null = null;

// ============================================================
// Pre-seed: 4 clientes Tuali siempre disponibles para demo
// ============================================================

export const PRESEED_CLIENTS: Client[] = [
  {
    id: "oxxo-tec-mty",
    name: "OXXO Tec de Monterrey",
    brand: "OXXO",
    emoji: "🛒",
    source_system_name: "Catálogo Arca Continental",
    source_system_url: "https://catalogo.arca-continental.demo/oxxo",
    destination_system_name: "ERP Tuali",
    destination_system_url: "https://erp.tuali.demo/oxxo-tec",
    zone: {
      zone_id: "tec-mty",
      zone_name: "Tecnológico",
      city: "Monterrey",
      profile: "universitaria",
      nearby_institutions: ["Tec de Monterrey Campus MTY"],
    },
    playbook_ids: ["demo-tuali-coca-cola"],
    baseline_skus: {
      "Coca-Cola 600ml": 240,
      "Powerade 500ml": 90,
      "Topo Chico Twist Limón": 60,
      "Ciel 1L": 180,
    },
    status: "active",
    onboarded_at: "2026-05-15T10:00:00.000Z",
    onboarded_via: "preseed",
    total_runs: 1247,
    avg_seconds: 32,
    last_run_at: new Date().toISOString(),
  },
  {
    id: "soriana-cumbres",
    name: "Soriana Híper Cumbres",
    brand: "Soriana",
    emoji: "🏪",
    source_system_name: "Catálogo Arca Continental",
    source_system_url: "https://catalogo.arca-continental.demo/soriana",
    destination_system_name: "ERP Tuali",
    destination_system_url: "https://erp.tuali.demo/soriana-cumbres",
    zone: {
      zone_id: "cumbres-mty",
      zone_name: "Cumbres",
      city: "Monterrey",
      profile: "familiar",
      nearby_institutions: ["Plaza Cumbres", "Parque España"],
    },
    playbook_ids: ["demo-tuali-coca-cola"],
    baseline_skus: {
      "Coca-Cola 2L": 380,
      "Topo Chico 600ml": 220,
      "Powerade 600ml": 140,
      "Fanta 600ml": 95,
      "Sprite 2L": 160,
    },
    status: "active",
    onboarded_at: "2026-05-20T14:30:00.000Z",
    onboarded_via: "preseed",
    total_runs: 892,
    avg_seconds: 34,
    last_run_at: new Date().toISOString(),
  },
  {
    id: "costco-san-pedro",
    name: "Costco San Pedro",
    brand: "Costco",
    emoji: "🛍️",
    source_system_name: "Catálogo Arca Continental",
    source_system_url: "https://catalogo.arca-continental.demo/costco",
    destination_system_name: "ERP Tuali",
    destination_system_url: "https://erp.tuali.demo/costco-spgg",
    zone: {
      zone_id: "san-pedro",
      zone_name: "San Pedro Garza García",
      city: "San Pedro Garza García",
      profile: "comercial",
      nearby_institutions: ["Plaza Fiesta San Agustín", "Tec Sede SGG"],
    },
    playbook_ids: ["demo-tuali-coca-cola"],
    baseline_skus: {
      "Coca-Cola Pack 24x355ml": 540,
      "Topo Chico Pack 24x600ml": 420,
      "Powerade Pack 12x600ml": 280,
      "Ciel Pack 24x1L": 600,
    },
    status: "active",
    onboarded_at: "2026-05-25T09:15:00.000Z",
    onboarded_via: "preseed",
    total_runs: 421,
    avg_seconds: 29,
    last_run_at: new Date().toISOString(),
  },
  {
    id: "abarrotes-don-beto",
    name: "Abarrotes Don Beto",
    brand: "Abarrotes",
    emoji: "🥫",
    source_system_name: "Catálogo Arca Continental",
    source_system_url: "https://catalogo.arca-continental.demo/abarrotes",
    destination_system_name: "ERP Tuali",
    destination_system_url: "https://erp.tuali.demo/abarrotes-don-beto",
    zone: {
      zone_id: "colonia-obrera",
      zone_name: "Colonia Obrera",
      city: "Monterrey",
      profile: "familiar",
      nearby_institutions: ["Mercado Juárez"],
    },
    playbook_ids: ["demo-tuali-coca-cola"],
    baseline_skus: {
      "Coca-Cola 600ml": 120,
      "Topo Chico 600ml": 80,
      "Powerade 500ml": 30,
      "Sabritas 150g": 60,
    },
    status: "active",
    onboarded_at: "2026-06-01T11:00:00.000Z",
    onboarded_via: "preseed",
    total_runs: 156,
    avg_seconds: 38,
    last_run_at: new Date().toISOString(),
  },
];

// ============================================================
// Backend selection
// ============================================================

async function getMongoCollection(): Promise<Collection<Client> | null> {
  if (cachedCollection) return cachedCollection;
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    const { MongoClient } = await import("mongodb");
    cachedMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await cachedMongo.connect();
    cachedDb = cachedMongo.db("themis");
    cachedCollection = cachedDb.collection<Client>(COLLECTION_NAME);
    return cachedCollection;
  } catch (err) {
    console.warn(
      "[client-store] MongoDB no conectó, usando filesystem:",
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

async function fsReadAll(): Promise<Client[]> {
  const filePath = await resolveFsPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Client[];
  } catch {
    return [];
  }
}

async function fsWriteAll(clients: Client[]): Promise<void> {
  const filePath = await resolveFsPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(clients, null, 2));
}

// ============================================================
// Public API
// ============================================================

export async function listClients(): Promise<Client[]> {
  const coll = await getMongoCollection();
  if (coll) {
    const docs = await coll.find({}, { sort: { onboarded_at: -1 } }).toArray();
    const stored = docs.map((d) => {
      const { _id: _omit, ...rest } = d as Client & { _id?: unknown };
      return rest as Client;
    });
    // Merge preseed para que SIEMPRE estén los 4 demo (aunque MongoDB vacío)
    return mergePreseed(stored);
  }
  const stored = await fsReadAll();
  return mergePreseed(stored);
}

function mergePreseed(stored: Client[]): Client[] {
  const ids = new Set(stored.map((c) => c.id));
  const missing = PRESEED_CLIENTS.filter((p) => !ids.has(p.id));
  return [...stored, ...missing];
}

export async function saveClient(client: Client): Promise<Client> {
  const coll = await getMongoCollection();
  if (coll) {
    await coll.replaceOne({ id: client.id }, client, { upsert: true });
    return client;
  }
  const all = await fsReadAll();
  const filtered = all.filter((c) => c.id !== client.id);
  filtered.unshift(client);
  await fsWriteAll(filtered);
  return client;
}

export async function getClient(id: string): Promise<Client | null> {
  const all = await listClients();
  return all.find((c) => c.id === id) ?? null;
}
