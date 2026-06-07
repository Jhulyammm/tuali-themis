/**
 * Catálogo del Sistema A — proveedor CPG ficticio "Distribuidora del Norte".
 *
 * Los nombres de campo se eligieron deliberadamente DISTINTOS al ERP Tuali,
 * para que el "mapping no-obvio" sea genuino y Claude tenga que inferirlo:
 *
 *   Sistema A (este)                     Sistema B (ERP Tuali)
 *   ────────────────────────────────────────────────────────────
 *   Producto                          → Denominación comercial
 *   SKU proveedor                     → Código interno
 *   Precio lista (con IVA)            → Precio neto sin IVA  (transformar /1.16)
 *   Categoría comercial               → Rubro contable
 *   Marca                             → Fabricante
 *   Presentación                      → Unidad de medida
 *   Lote                              → Identificador de lote
 *   Disponibilidad "En existencia"    → Estado stock "Disponible"
 */

export interface CatalogProduct {
  id: string;
  producto: string;
  sku_proveedor: string;
  precio_lista: number; // con IVA
  categoria_comercial: string;
  marca: string;
  presentacion: string;
  lote: string;
  disponibilidad: "En existencia" | "Agotado" | "Por llegar";
  descripcion: string;
  imagen_url: string;
}

export const CATALOG: CatalogProduct[] = [
  {
    id: "P-001",
    producto: "Cerveza Indio Lager 355ml",
    sku_proveedor: "DDN-CERV-INDIO-355",
    precio_lista: 18.5,
    categoria_comercial: "Bebidas alcohólicas / Cerveza nacional",
    marca: "Cervecería Cuauhtémoc Moctezuma",
    presentacion: "Botella 355 ml · Pack 6",
    lote: "L-2026-0421-A",
    disponibilidad: "En existencia",
    descripcion: "Cerveza tipo Munich oscura, lager regional norteño.",
    imagen_url: "/img/indio-355.png",
  },
  {
    id: "P-002",
    producto: "Refresco Coca-Cola Mexicana 600ml",
    sku_proveedor: "DDN-REFR-CCMEX-600",
    precio_lista: 22.0,
    categoria_comercial: "Bebidas / Refrescos cola",
    marca: "Coca-Cola FEMSA",
    presentacion: "Botella PET 600 ml",
    lote: "L-2026-0512-CC",
    disponibilidad: "En existencia",
    descripcion: "Coca-Cola fórmula mexicana endulzada con azúcar de caña.",
    imagen_url: "/img/coca-600.png",
  },
  {
    id: "P-003",
    producto: "Botana Sabritas Original 170g",
    sku_proveedor: "DDN-BOT-SABORI-170",
    precio_lista: 38.9,
    categoria_comercial: "Botanas saladas / Papas fritas",
    marca: "Sabritas (PepsiCo)",
    presentacion: "Bolsa 170 g",
    lote: "L-2026-0501-SB",
    disponibilidad: "En existencia",
    descripcion: "Papas fritas clásicas con sal de mar.",
    imagen_url: "/img/sabritas-170.png",
  },
  {
    id: "P-004",
    producto: "Agua Embotellada Ciel 1.5L",
    sku_proveedor: "DDN-AGUA-CIEL-1500",
    precio_lista: 14.5,
    categoria_comercial: "Bebidas no alcohólicas / Agua natural",
    marca: "Ciel (Coca-Cola FEMSA)",
    presentacion: "Botella PET 1.5 L",
    lote: "L-2026-0428-CI",
    disponibilidad: "En existencia",
    descripcion: "Agua purificada con minerales naturales.",
    imagen_url: "/img/ciel-1500.png",
  },
  {
    id: "P-005",
    producto: "Galletas Marías Gamesa Caja 6pz",
    sku_proveedor: "DDN-GLT-MARGAM-6PZ",
    precio_lista: 28.0,
    categoria_comercial: "Galletería / Galletas dulces",
    marca: "Gamesa (PepsiCo)",
    presentacion: "Caja con 6 paquetes de 8 piezas",
    lote: "L-2026-0410-GM",
    disponibilidad: "En existencia",
    descripcion: "Galletas tradicionales mexicanas tipo Marie.",
    imagen_url: "/img/marias-6pz.png",
  },
  {
    id: "P-006",
    producto: "Café Soluble Nescafé Clásico 100g",
    sku_proveedor: "DDN-CAF-NESCLA-100",
    precio_lista: 89.9,
    categoria_comercial: "Abarrotes / Café e infusiones",
    marca: "Nescafé (Nestlé)",
    presentacion: "Frasco vidrio 100 g",
    lote: "L-2026-0319-NS",
    disponibilidad: "En existencia",
    descripcion: "Café instantáneo 100% puro, sabor robusto.",
    imagen_url: "/img/nescafe-100.png",
  },
  {
    id: "P-007",
    producto: "Tequila José Cuervo Especial Reposado 750ml",
    sku_proveedor: "DDN-TEQ-CUERREP-750",
    precio_lista: 285.0,
    categoria_comercial: "Bebidas alcohólicas / Destilados / Tequila",
    marca: "Casa Cuervo",
    presentacion: "Botella vidrio 750 ml · 38% Alc.Vol.",
    lote: "L-2026-0224-CU",
    disponibilidad: "En existencia",
    descripcion: "Tequila reposado dos meses en barrica de roble blanco.",
    imagen_url: "/img/cuervo-750.png",
  },
  {
    id: "P-008",
    producto: "Detergente Roma Polvo 1kg",
    sku_proveedor: "DDN-LIM-ROMAPL-1K",
    precio_lista: 32.5,
    categoria_comercial: "Limpieza / Detergentes ropa",
    marca: "Fábrica de Jabón La Corona",
    presentacion: "Bolsa 1 kg",
    lote: "L-2026-0505-RM",
    disponibilidad: "Por llegar",
    descripcion: "Detergente para lavadora con suavizante incluido.",
    imagen_url: "/img/roma-1k.png",
  },
  {
    id: "P-009",
    producto: "Chocolate Carlos V Tableta 18g · Pack 18",
    sku_proveedor: "DDN-CHOC-CV18-18PK",
    precio_lista: 95.0,
    categoria_comercial: "Confitería / Chocolatería",
    marca: "Carlos V (Nestlé)",
    presentacion: "Display 18 tabletas de 18g",
    lote: "L-2026-0316-CV",
    disponibilidad: "En existencia",
    descripcion: "Chocolate de leche tradicional mexicano.",
    imagen_url: "/img/carlosv-18pk.png",
  },
  {
    id: "P-010",
    producto: "Atún Aleta Amarilla en Agua Dolores 140g",
    sku_proveedor: "DDN-ATU-DOLAGU-140",
    precio_lista: 24.9,
    categoria_comercial: "Abarrotes / Enlatados / Mariscos",
    marca: "Dolores (Pinsa)",
    presentacion: "Lata 140 g · 105g escurrido",
    lote: "L-2026-0429-DL",
    disponibilidad: "En existencia",
    descripcion: "Atún aleta amarilla en lomos enteros, agua y sal.",
    imagen_url: "/img/dolores-140.png",
  },
];

export function getProduct(id: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.id === id);
}
