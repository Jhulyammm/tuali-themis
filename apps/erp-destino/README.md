# erp-destino — Sistema B del demo

> Next.js 15 minimal. Look corporativo intencional (blanco + azul SAP-like).
> Este es el destino al que Themis escribe.

## Por qué se ve "feo" a propósito

El contraste con `operator-ui` (dark + coral + premium) es STORYTELLING:

- `operator-ui` = Themis, lo nuevo, lo cognitivo
- `erp-destino` = el sistema interno corporativo que ya existe

Cuando en el pitch Marita muestra ambos lado a lado, los jueces SIENTEN la diferencia. No hagas el ERP bonito.

## Páginas

- `/` — landing corporativo con tarjetas
- `/captura` — el form de 11 campos (Sistema B target). **Aquí escribe Themis.**
- `/inventario` — lista de SKUs capturados, para validación side-by-side (Paso 4 del demo)

## API

- `POST /api/skus` — Themis llama aquí cuando ejecuta el playbook
- `GET /api/skus` — para `/inventario` y para `/validate` del operator-ui

## Storage

In-memory (`src/lib/store.ts`). Se resetea al reiniciar `next dev`. Suficiente para hackathon.

## Cómo correr

```powershell
# Desde el root del workspace
pnpm install
pnpm dev:destino    # → http://localhost:3001
```

## Los `data-testid` son críticos

Cada input tiene `data-testid` (denominacion-input, fabricante-input, etc.). Stagehand los puede usar como hints. **No los cambies** — el agente espera estos selectores.

## Mapeo no-obvio (lo que prueba aprendizaje)

| Origen (automationexercise.com) | Destino (este form) |
|---|---|
| Product Name | denominacion_comercial |
| Brand | fabricante |
| Price (`$500`) | precio_neto_sin_iva (`431.03` — sin IVA, /1.16) |
| Category | rubro_contable |
| Availability ("In Stock") | estado_de_stock ("Disponible") |
| Condition ("New") | estado_del_producto ("Nuevo") |
| (URL del producto) | url_de_referencia |
| (autogenerado) | codigo_interno |
