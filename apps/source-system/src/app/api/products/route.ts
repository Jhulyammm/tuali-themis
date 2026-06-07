/**
 * GET /api/products — devuelve catálogo completo del proveedor.
 * Útil para que Themis lo consuma como API si quisiera saltar el HTML scraping.
 */

import { NextResponse } from "next/server";
import { CATALOG } from "@/data/catalog";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    proveedor: {
      razon_social: "Distribuidora del Norte SA de CV",
      rfc: "DNN960531ABC",
      cd: "Monterrey-Norte",
      portal_version: "3.2.1",
    },
    total: CATALOG.length,
    productos: CATALOG,
  });
}
