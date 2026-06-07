import { NextRequest, NextResponse } from "next/server";
import { addPedido, listPedidos, type Pedido } from "@/data/pedidos-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ pedidos: listPedidos() });
}

export async function POST(req: NextRequest) {
  let body: Partial<Pedido>;
  try {
    body = (await req.json()) as Partial<Pedido>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.cliente_destinatario || !body.rfc_destinatario) {
    return NextResponse.json(
      { error: "cliente_destinatario y rfc_destinatario son requeridos" },
      { status: 400 },
    );
  }

  const id = `PED-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
  const pedido: Pedido = {
    id,
    cliente_destinatario: body.cliente_destinatario,
    rfc_destinatario: body.rfc_destinatario,
    fecha_solicitud: body.fecha_solicitud ?? new Date().toISOString().slice(0, 10),
    centro_distribucion: body.centro_distribucion ?? "CD Monterrey-Norte",
    ruta_entrega: body.ruta_entrega ?? "Ruta NL-08",
    estatus: "borrador",
    lineas: body.lineas ?? [],
    total_bruto: body.total_bruto ?? 0,
    iva_16pct: body.iva_16pct ?? 0,
    total_neto: body.total_neto ?? 0,
    observaciones: body.observaciones ?? "",
  };

  addPedido(pedido);
  return NextResponse.json({ pedido });
}
