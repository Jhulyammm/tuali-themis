/**
 * GET /api/playbook/sample — devuelve un Playbook de ejemplo "pre-aprendido".
 *
 * Útil para probar `/execute` sin tener que correr `/teach` primero.
 * Este playbook corresponde al caso de uso del demo:
 *   automationexercise.com → erp-destino (form de captura SKU)
 */

import { NextResponse } from "next/server";
import type { Playbook } from "@hack4her/playbooks";

export const runtime = "nodejs";

const SAMPLE_PLAYBOOK: Playbook = {
  id: "sample-aex-to-erp",
  name: "Capturar producto: automationexercise → ERP Tuali",
  intent:
    "Leer producto del catálogo de automationexercise.com (Sistema A) y capturarlo en el form de Tuali ERP (Sistema B) con mapeo de campos no-obvio.",
  source_url: "https://automationexercise.com/products",
  destination_url: "http://localhost:3001/captura",
  parameters: ["product_id"],
  mappings: [
    {
      source_field: "Product Name",
      source_selector_intent: "nombre del producto en la vista detalle",
      destination_field: "Denominación comercial",
      destination_selector_intent: "campo denominación comercial",
      confidence: 0.97,
      examples: [{ source_value: "Blue Top", destination_value: "Blue Top" }],
    },
    {
      source_field: "Brand",
      source_selector_intent: "marca del producto",
      destination_field: "Fabricante",
      destination_selector_intent: "campo fabricante",
      confidence: 0.92,
      examples: [{ source_value: "H&M", destination_value: "H&M" }],
    },
    {
      source_field: "Price",
      source_selector_intent: "precio del producto con símbolo de moneda",
      destination_field: "Precio neto sin IVA",
      destination_selector_intent: "campo precio neto sin IVA",
      confidence: 0.9,
      transformation:
        "Remover símbolo de moneda y convertir a número; el destino guarda precio sin IVA, dividir entre 1.16",
      examples: [{ source_value: "Rs. 500", destination_value: "431.03" }],
    },
    {
      source_field: "Category",
      source_selector_intent: "categoría del producto en breadcrumb",
      destination_field: "Rubro contable",
      destination_selector_intent: "select de rubro contable",
      confidence: 0.85,
      examples: [{ source_value: "Women > Tops", destination_value: "Textiles" }],
    },
    {
      source_field: "Availability",
      source_selector_intent: "estado de disponibilidad del producto",
      destination_field: "Estado de stock",
      destination_selector_intent: "select de estado de stock",
      confidence: 0.88,
      examples: [{ source_value: "In Stock", destination_value: "Disponible" }],
    },
    {
      source_field: "Condition",
      source_selector_intent: "condición del producto",
      destination_field: "Estado del producto",
      destination_selector_intent: "select de estado del producto",
      confidence: 0.86,
      examples: [{ source_value: "New", destination_value: "Nuevo" }],
    },
  ],
  steps: [
    {
      action: "navigate",
      target: "https://automationexercise.com/product_details/{product_id}",
    },
    {
      action: "extract",
      selector_intent: "nombre del producto en la vista detalle",
      as: "product_name",
    },
    {
      action: "extract",
      selector_intent: "marca del producto",
      as: "brand",
    },
    {
      action: "extract",
      selector_intent: "precio del producto",
      as: "price",
    },
    {
      action: "extract",
      selector_intent: "categoría del producto en breadcrumb",
      as: "category",
    },
    { action: "switch_system", target: "destination" },
    { action: "navigate", target: "http://localhost:3001/captura" },
    {
      action: "fill",
      selector_intent: "campo denominación comercial",
      value: "{product_name}",
    },
    {
      action: "fill",
      selector_intent: "campo fabricante",
      value: "{brand}",
    },
    {
      action: "fill",
      selector_intent: "campo precio neto sin IVA",
      value: "{price}",
    },
    {
      action: "select",
      selector_intent: "select de rubro contable",
      value: "Textiles",
    },
    {
      action: "select",
      selector_intent: "select de estado de stock",
      value: "Disponible",
    },
    {
      action: "select",
      selector_intent: "select de estado del producto",
      value: "Nuevo",
    },
    {
      action: "click",
      selector_intent: "botón guardar SKU",
    },
  ],
  version: 1,
  created_at: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json({ playbook: SAMPLE_PLAYBOOK });
}
