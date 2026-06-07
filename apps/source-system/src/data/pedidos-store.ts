/**
 * Store in-memory de pedidos. Sobrevive hot-reload de Next via globalThis.
 */

import type { CatalogProduct } from "./catalog";
import { CATALOG } from "./catalog";

export interface PedidoLinea {
  sku_proveedor: string;
  cantidad_solicitada: number;
  precio_lista: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  cliente_destinatario: string;
  rfc_destinatario: string;
  fecha_solicitud: string;
  centro_distribucion: string;
  ruta_entrega: string;
  estatus: "borrador" | "confirmado" | "en_ruta" | "entregado";
  lineas: PedidoLinea[];
  total_bruto: number;
  iva_16pct: number;
  total_neto: number;
  observaciones: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __ddn_pedidos: Pedido[] | undefined;
}

function store(): Pedido[] {
  if (!globalThis.__ddn_pedidos) {
    globalThis.__ddn_pedidos = SEED_PEDIDOS;
  }
  return globalThis.__ddn_pedidos;
}

export function listPedidos(): Pedido[] {
  return [...store()];
}

export function getPedido(id: string): Pedido | undefined {
  return store().find((p) => p.id === id);
}

export function addPedido(p: Pedido): Pedido {
  store().unshift(p);
  return p;
}

export function calculateTotals(lineas: PedidoLinea[]): {
  total_bruto: number;
  iva_16pct: number;
  total_neto: number;
} {
  const total_bruto = lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const iva_16pct = +(total_bruto * 0.16 / 1.16).toFixed(2);
  const total_neto = +(total_bruto - iva_16pct).toFixed(2);
  return { total_bruto: +total_bruto.toFixed(2), iva_16pct, total_neto };
}

// Algunos pedidos seed para que la página no esté vacía la primera vez
const SEED_PEDIDOS: Pedido[] = [
  {
    id: "PED-2026-0411",
    cliente_destinatario: "OXXO Tec Sur",
    rfc_destinatario: "CTV051028N42",
    fecha_solicitud: "2026-06-05",
    centro_distribucion: "CD Monterrey-Norte",
    ruta_entrega: "Ruta NL-08 · Lunes/Miércoles",
    estatus: "entregado",
    lineas: [
      makeLine("DDN-CERV-INDIO-355", 48),
      makeLine("DDN-REFR-CCMEX-600", 36),
      makeLine("DDN-BOT-SABORI-170", 24),
    ],
    total_bruto: 0, // recalculado abajo
    iva_16pct: 0,
    total_neto: 0,
    observaciones: "Entrega antes de 11:00. Acceso por puerta trasera.",
  },
  {
    id: "PED-2026-0412",
    cliente_destinatario: "Soriana Galerías",
    rfc_destinatario: "SOR8910301HK7",
    fecha_solicitud: "2026-06-06",
    centro_distribucion: "CD Monterrey-Norte",
    ruta_entrega: "Ruta NL-12 · Martes/Jueves",
    estatus: "confirmado",
    lineas: [
      makeLine("DDN-AGUA-CIEL-1500", 60),
      makeLine("DDN-GLT-MARGAM-6PZ", 40),
      makeLine("DDN-CAF-NESCLA-100", 18),
    ],
    total_bruto: 0,
    iva_16pct: 0,
    total_neto: 0,
    observaciones: "",
  },
];

function makeLine(sku: string, cantidad: number): PedidoLinea {
  const p = CATALOG.find((c) => c.sku_proveedor === sku) as CatalogProduct;
  const subtotal = +(p.precio_lista * cantidad).toFixed(2);
  return {
    sku_proveedor: sku,
    cantidad_solicitada: cantidad,
    precio_lista: p.precio_lista,
    subtotal,
  };
}

// Recalcula totales de los seed pedidos al boot
SEED_PEDIDOS.forEach((p) => {
  const t = calculateTotals(p.lineas);
  Object.assign(p, t);
});
