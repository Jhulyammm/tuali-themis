/**
 * GET /api/products/[id] — ficha individual.
 */

import { NextResponse } from "next/server";
import { getProduct } from "@/data/catalog";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ producto: product });
}
