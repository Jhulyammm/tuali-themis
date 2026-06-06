/**
 * In-memory store de SKUs capturados.
 *
 * Para el hackathon esto basta — no necesitamos persistencia real.
 * En producción esto sería Supabase / MongoDB / Postgres.
 *
 * IMPORTANTE: el state se resetea cuando Next reinicia el server.
 * Si necesitas persistencia entre restarts, mueve esto a un archivo JSON local.
 */

interface SkuData {
  denominacion_comercial: string;
  fabricante: string;
  precio_neto_sin_iva: string;
  rubro_contable: string;
  subrubro: string;
  codigo_interno: string;
  estado_de_stock: string;
  estado_del_producto: string;
  regimen_fiscal: string;
  url_de_referencia: string;
  cantidad_sugerida: string;
}

export interface SkuRecord {
  id: string;
  created_at: string;
  data: SkuData;
}

// Usamos globalThis para sobrevivir al hot-reload de Next dev
const KEY = Symbol.for("themis.erp-destino.skus");
type GlobalWithStore = typeof globalThis & {
  [KEY]?: SkuRecord[];
};
const g = globalThis as GlobalWithStore;
if (!g[KEY]) g[KEY] = [];

function getStore(): SkuRecord[] {
  return (g[KEY] ??= []);
}

export async function addSku(data: Record<string, string>): Promise<SkuRecord> {
  const record: SkuRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    data: data as unknown as SkuData,
  };
  getStore().unshift(record);
  return record;
}

export async function listSkus(): Promise<SkuRecord[]> {
  return [...getStore()];
}

export async function clearSkus(): Promise<void> {
  getStore().length = 0;
}
