# Tuali Operator — Walkthrough conceptual end-to-end (BIG MVP)

> Una historia concreta para que el equipo entienda la idea ANTES de programar.
> Personaje real, datos realistas, ambos lados: lo que ve el usuario + lo que pasa por dentro.
> Cubre las **4 capacidades** del BIG MVP: multi-system, self-healing, conversational, bulk parallel.

---

## El personaje

**María Rodríguez**, 38 años. Planeadora senior en Arca Continental, hub Querétaro.
Responsable del **surtido de canal moderno** para 120 tiendas (OXXO, 7-Eleven, supermercados regionales).

### Su semana hoy, sin Tuali Operator

Cada lunes le llega un reporte de inventario. María tiene que:

1. Actualizar el **surtido de ~100 tiendas** en el portal Canal Moderno (~5h/sem)
2. Cruzar el **inventario de Tuali Internal** con los pedidos sugeridos y capturarlos en Canal Moderno (~4h/sem)
3. **Revisar precios promocionales** cuando hay campañas (~3h/sem)

12 procesos similares cada semana. ~15 horas de clic manual y cambio entre sistemas. María odia los lunes.

---

## Lunes 9:00 am — Llega un correo

> *"Hola María, prueba esta herramienta nueva — Tuali Operator. Te enseña una vez un proceso, lo hace ella sola las siguientes 100 veces, **y aprende a cruzar entre tus sistemas**."*

María, escéptica pero curiosa, hace clic.

### Lo que ve María

```
┌─ Tuali Operator ────────────────────────────────────────┐
│  Bienvenida, María                              [⚙]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   No tienes procesos aprendidos todavía.                │
│                                                         │
│   Para empezar, enséñale a la IA un proceso que         │
│   hagas a menudo. Solo tienes que hacerlo UNA VEZ.      │
│                                                         │
│              ┌──────────────────────────┐               │
│              │  + Enseñar nuevo proceso │               │
│              └──────────────────────────┘               │
│                                                         │
│   O simplemente dile qué hacer:                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Escribe lo que quieres hacer...         [↵]    │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

María nota algo: hay **dos formas de operar** — enseñarle un proceso nuevo, o **simplemente hablarle**. Va por la primera.

---

## 9:02 am — Modo Enseñar arranca

### Lo que ve María

```
┌─ Modo Enseñar  ●  00:00              [Pausar][Terminar]─┐
├────────────────────────────────────┬────────────────────┤
│                                    │  GUÍA              │
│   ┌─ Navegador Tuali ─────────────┐│                    │
│   │                               ││  1. Abre el portal │
│   │   (cargando...)               ││     donde haces tu │
│   │                               ││     trabajo.       │
│   │                               ││                    │
│   │                               ││  2. Narra en voz   │
│   │                               ││     alta lo que    │
│   │                               ││     vas a hacer.   │
│   │                               ││                    │
│   │                               ││  3. Cuando termi-  │
│   │                               ││     nes, TERMINAR. │
│   └───────────────────────────────┘│                    │
│                                    │  🎤 Micrófono on   │
└────────────────────────────────────┴────────────────────┘
```

Ventana pide permiso de micrófono. María acepta.

### Lo que pasa por dentro

```
packages/agent/src/teach/recorder.ts arranca:
- MutationObserver sobre el iframe del navegador
  → captura cada click, fill, navigate, scroll
- Intervalo de screenshots cada 500ms
  → guarda PNGs en Supabase Storage
- Web Audio API + Whisper API
  → narración transcrita en chunks de 5s
- Todo asociado con timestamp_ms relativo al inicio
```

---

## 9:03 am — María graba el primer proceso

Tipea la URL de Canal Moderno. Narra:

> *"Voy a actualizar el surtido de Coca-Cola 600 mililitros para la tienda 1234, OXXO Constituyentes. Le voy a poner 50 unidades."*

Hace login. Click en "Surtido". Busca tienda 1234. Captura "50" en cantidad de Coca 600ml. Click "Guardar".

```
┌─ Modo Enseñar  ●  02:14              [Pausar][Terminar]─┐
├────────────────────────────────────┬────────────────────┤
│   [navegador con form de surtido]  │ PASOS DETECTADOS   │
│                                    │                    │
│   Tienda: 1234 OXXO                │ ✓ Navegar a portal │
│   SKU: Coca 600ml                  │ ✓ Login            │
│   Cantidad: [  50  ] ✏             │ ✓ Click Surtido    │
│                                    │ ✓ Buscar tienda    │
│   [Guardar]                        │ ✓ Capturar 50      │
│                                    │     en Coca 600ml  │
│                                    │ ⏺ ...              │
└────────────────────────────────────┴────────────────────┘
```

Click "Terminar". Loader: **"Extrayendo proceso aprendido..."**

### Lo que pasa por dentro

```
Recording finalizada → Claude estructura el playbook:
  - 12 DOM events
  - 14 screenshots
  - 18 segundos de narración

Prompt a Claude:
  "Dado este recording, extrae un Playbook reusable.
   Identifica VARIABLES que cambian (store_id, sku, quantity).
   Describe selectores en lenguaje natural."

Claude devuelve JSON. Zod valida. Supabase guarda.
```

---

## 9:04 am — El playbook está listo

```
┌─ Proceso aprendido ─────────────────────────────────────┐
│                                                         │
│  Nombre: [ Actualizar surtido por tienda          ]     │
│                                                         │
│  PASOS DETECTADOS:                                      │
│  1. Ir a portal Canal Moderno                           │
│  2. Iniciar sesión                                      │
│  3. Click en "Surtido"                                  │
│  4. Buscar tienda por { store_id }                      │
│  5. Capturar { quantity } en cantidad de { sku }        │
│  6. Click "Guardar"                                     │
│                                                         │
│  VARIABLES:                                             │
│   • store_id   (ej. 1234)                               │
│   • sku        (ej. Coca 600ml)                         │
│   • quantity   (ej. 50)                                 │
│                                                         │
│             [Descartar]   [Probar ejecución →]          │
└─────────────────────────────────────────────────────────┘
```

María lee. **Las variables están extraídas correctamente.** Click "Probar".

---

## 9:05 am — Primera ejecución (vanilla)

El navegador se mueve solo. **18 segundos.** Éxito.

```
┌─ Ejecución en vivo ─────────────────────────────────────┐
│ ⏵ Ejecutando · 00:08 · paso 4 de 6            [Detener] │
├────────────────────────────────────┬────────────────────┤
│   [navegador autónomo con cursor   │ ✓ Login    1.2s    │
│    moviéndose, glow coral sutil]   │ ✓ Surtido  0.5s    │
│                                    │ ✓ Buscar   1.8s    │
│   Tienda: 1234                     │ ⏺ Capturando...    │
│   SKU: Coca 600ml                  │     ...            │
│   Cantidad: 50                     │ · Guardar          │
└────────────────────────────────────┴────────────────────┘
```

María se queda viendo, sin parpadear. "OK. Eso ya lo sabía hacer yo." **Y aquí cambia todo.**

---

## 9:08 am — La forma natural: hablarle al agente (CAPACIDAD 3)

María vuelve al dashboard. En vez de hacer click en "Ejecutar" del playbook, escribe en el campo de chat:

> *"Actualiza surtido de Coca 600ml a 50 unidades en todas las OXXO de Querétaro."*

### Lo que ve María

```
┌─ Agente Tuali ──────────────────────────────────────────┐
│                                                         │
│  Tú:                                                    │
│  Actualiza surtido de Coca 600ml a 50 unidades en       │
│  todas las OXXO de Querétaro.                           │
│                                                         │
│  Agente:                                                │
│  Entendido. Encontré 30 tiendas tipo OXXO en zona       │
│  Querétaro. Voy a ejecutar el playbook                  │
│  "Actualizar surtido por tienda" para cada una          │
│  con los parámetros:                                    │
│                                                         │
│    sku: Coca 600ml                                      │
│    quantity: 50                                         │
│    stores: [1234, 1235, 1238, ... 30 total]             │
│                                                         │
│  ┌────────────────────────────┐  ┌──────────────┐       │
│  │ ▶ Ejecutar 30 instancias   │  │ Cancelar     │       │
│  └────────────────────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

María se sorprende: **el agente entendió "todas las OXXO de Querétaro"** sin que ella tuviera que abrir un filtro ni hacer click en una tabla. Le habló como le hablaría a una colega.

Click "Ejecutar 30 instancias".

### Lo que pasa por dentro

```
El comando entra al planner conversacional:

Claude con structured output:
{
  intent: "execute_bulk",
  playbook: "actualizar-surtido-por-tienda",
  filter: { tipo: "OXXO", zona: "Querétaro" },
  parameters: { sku: "Coca 600ml", quantity: 50 }
}

→ DB query: SELECT * FROM tiendas WHERE tipo='OXXO' AND zona='Querétaro'
→ Resultado: 30 tiendas
→ Para cada una: crear ejecución del playbook con esos parámetros
→ Lanzar 5 en paralelo (rate limit + control de costo)
```

---

## 9:09 am — 30 OXXO ejecutándose en paralelo (CAPACIDAD 4)

```
┌─ Lote en progreso ─────────────────────────────[Detener]┐
│                                                         │
│  Actualizar surtido · Coca 600ml · 30 OXXO Querétaro    │
│                                                         │
│  ████████████████░░░░░░░░░░░░░░░░  16/30 · 53%          │
│  Estimado: 8:24 restante                                │
│                                                         │
│  ┌──────────┬──────────┬───────────┬──────────────┐     │
│  │ Éxito 14 │ Falla 0  │ En curso 5│ Pendiente 11 │     │
│  └──────────┴──────────┴───────────┴──────────────┘     │
│                                                         │
│  Últimas ejecuciones                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ OXXO Constituyentes  · 17.2s · ✓                 │   │
│  │ OXXO Centro          · 19.8s · ✓                 │   │
│  │ OXXO Plaza Norte     · 22.1s · ✓                 │   │
│  │ OXXO 5 de Mayo       · 18.4s · ⏵ en curso        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

María saca el celular. Va por café. Cuando vuelve, el lote casi termina.

---

## 9:11 am — El portal cambia y el agente se adapta (CAPACIDAD 2)

Mientras María toma café, **alguien del equipo IT de Canal Moderno publicó un cambio**: el label del campo de cantidad pasó de "Cantidad" a "Cantidad solicitada". Sin avisar.

Cualquier script Selenium tradicional se habría roto. Aquí no.

### Lo que ve María en el log

```
┌─ Step Log durante self-healing ───────────────┐
│                                               │
│ ✓ Login              1.2s                     │
│ ✓ Click Surtido      0.5s                     │
│ ✓ Buscar tienda      1.8s                     │
│ ⚡ Adaptando...      ◯◯◯                       │
│   "El campo cambió.                           │
│    Buscando equivalente con visión..."        │
│ · Capturar cantidad                           │
│ · Guardar                                     │
└───────────────────────────────────────────────┘

~2 segundos después:

┌─ Step Log post self-healing ──────────────────┐
│                                               │
│ ✓ Login              1.2s                     │
│ ✓ Click Surtido      0.5s                     │
│ ✓ Buscar tienda      1.8s                     │
│ ✓ Capturar cantidad  3.4s ⚡                   │
│   "Adaptó al cambio: 'Cantidad' → 'Cantidad   │
│    solicitada'"                               │
│ ⏺ Guardar...                                  │
└───────────────────────────────────────────────┘
```

María lo nota cuando vuelve. Hace click en el detalle. **"Adaptó al cambio."** El icono ⚡ permanece como insignia de que ese paso se auto-curó.

### Lo que pasa por dentro

```
Stagehand intentó resolver "campo de cantidad" por DOM tradicional.
Falló: el label exacto cambió.

Activó el fallback de visión:
  1. Toma screenshot del estado actual
  2. Pide a Claude: "Mira esta página. ¿Dónde está el input
     que corresponde a la cantidad de un SKU específico?"
  3. Claude responde con bounding box + selector inferido
  4. Stagehand interactúa con ese elemento
  5. Logea la adaptación para futuras ejecuciones

Lo importante:
  - El playbook NO fue re-grabado
  - El agente NO necesitó que alguien le dijera del cambio
  - Resiliencia automática
```

---

## 9:15 am — Cruzar dos sistemas en un solo proceso (CAPACIDAD 1)

María quiere automatizar otro proceso: **generar pedido sugerido**.

Este es más complejo: involucra **dos sistemas**:
1. Primero abrir **Inventario Tuali** y ver qué SKUs están en bajo stock
2. Luego abrir **Canal Moderno** y capturar el pedido sugerido para cada SKU

Manualmente, María cambia entre 2 pestañas, anota en un post-it, captura. Erráticos.

Con Tuali Operator: lo graba UNA vez navegando entre los 2 sistemas. El playbook resultante incluye una acción `switch_system` que cambia de portal a la mitad.

### Lo que ve María al grabarlo

```
┌─ Modo Enseñar  ●  03:45              [Pausar][Terminar]─┐
├────────────────────────────────────┬────────────────────┤
│   [Inventario Tuali]               │ PASOS DETECTADOS   │
│                                    │                    │
│   Coca 600ml      stock: 8         │ ✓ Login Inv. Tuali │
│   Sprite 500ml    stock: 12        │ ✓ Filtrar bajo     │
│   Fanta 600ml     stock: 5         │   stock            │
│                                    │ ✓ Extraer SKUs:    │
│   [María copia los SKUs y stocks]  │     Coca, Sprite,  │
│                                    │     Fanta          │
│                                    │ → CAMBIAR SISTEMA  │
│                                    │ ⏺ Abriendo         │
│                                    │   Canal Moderno... │
└────────────────────────────────────┴────────────────────┘
```

El playbook resultante tiene una acción nueva:

```json
{
  "name": "generar-pedido-sugerido",
  "steps": [
    { "action": "switch_system", "target": "inventario-tuali" },
    { "action": "navigate", "target": "/inventario/bajo-stock" },
    { "action": "extract_list", "selector_intent": "tabla de SKUs", "as": "skus_bajo_stock" },
    { "action": "switch_system", "target": "canal-moderno" },
    { "action": "navigate", "target": "/pedidos/nuevo" },
    { "action": "for_each", "input": "{skus_bajo_stock}", "as": "sku", "steps": [
      { "action": "fill", "selector_intent": "cantidad sugerida de {sku.name}", "value": "{sku.stock_minimo - sku.stock_actual}" }
    ]},
    { "action": "click", "selector_intent": "Confirmar pedido" }
  ]
}
```

María ejecuta. El agente:
1. Abre Inventario Tuali
2. Lee los 5 SKUs con bajo stock
3. **Cambia a Canal Moderno** (mantiene los datos extraídos en memoria)
4. Captura los pedidos correspondientes
5. Confirma

**20 segundos.** María se ríe.

---

## 10:30 am — La llamada del jefe

> *"María, ¿cómo va con Tuali Operator?"*
> *"Llevo 4 procesos automatizados. Le hablo y los corre."*
> *"Tenemos 12 procesos así. ¿Cuántos puede aprender?"*
> *"Cualquiera. Dame 5 minutos por proceso."*

**Esa frase es el ROI.** El agente no aprendió 4 procesos. Aprendió a **aprender procesos**. Cada uno nuevo cuesta 5 minutos.

---

## Qué acaba de pasar técnicamente — las 4 capacidades

### Capacidad 1: Multi-system playbooks
Un solo playbook navega entre 2+ portales como un workflow continuo. La acción `switch_system` cambia contexto del navegador manteniendo datos extraídos del sistema anterior. **El agente entiende el proceso de negocio, no el sitio web.**

### Capacidad 2: Self-healing por visión
Cuando un selector falla, el agente cae al fallback de visión: Claude analiza la screenshot y resuelve el elemento por inferencia visual. **Cambios en el target no rompen el playbook.**

### Capacidad 3: Conversational orchestration
María no llena formularios de parámetros — le habla al agente en español natural. Claude parsea el comando con structured output → consulta la BD → genera N ejecuciones paralelas. **La interfaz es la conversación.**

### Capacidad 4: Bulk parallel execution
N ejecuciones del mismo playbook con parámetros distintos, en paralelo controlado (5 concurrentes para no saturar APIs). Dashboard de progreso con estados granulares. **Escala lo que un humano no puede.**

---

## Lo que esto significa para el pitch (5 actos)

| Acto | Tiempo | Qué ve el jurado |
|------|--------|------------------|
| 0. Apertura | 20s | "Arca tiene 200 planeadores × 12 procesos/sem = 7,200h/sem manuales" |
| 1. Enseñanza | 45s | María enseña 1 proceso narrando |
| 2. Generalización | 30s | Mismo playbook, distintos valores idénticos |
| 3. Conversacional + Bulk | 60s | María le habla — 30 OXXO ejecutándose paralelo |
| 4. Self-healing | 60s | El portal cambia en vivo — el agente se adapta |
| 5. Multi-system | 45s | El segundo proceso cruza 2 portales solo |
| Cierre | 30s | Visión enterprise + métricas |

**Total: 4:50 min.** Si el jurado siente lo que María sintió en el minuto 9:08 o 9:11 — ganan.

---

## Lo que NO estamos construyendo

- **NO** un modelo predictivo de qué SKU va en qué tienda
- **NO** integraciones reales con el ERP de Arca
- **NO** auth corporativo
- **NO** monitoring / alerting
- **NO** un voice assistant separado — el chat es texto (voice es bonus si hay tiempo)

Solo construimos **una capa de aprendizaje + ejecución + adaptación + lenguaje natural** sobre cualquier portal web que el equipo ya use.

---

## ¿Lo entendiste?

Si después de leer puedes responder estas 4 preguntas, estamos alineados:

1. **¿Cuál es el momento "yo no podía hacer esto antes", y cuándo ocurre en la historia de María?**
2. **¿Por qué el agente NO se rompió cuando el portal cambió en el minuto 9:11?**
3. **¿Qué diferencia un `playbook` con `switch_system` de un script Selenium tradicional?**
4. **¿Por qué hablarle al agente es estratégicamente mejor que llenar formularios?**

Si cualquiera no es obvia → escríbelo y aclaramos antes de tocar código.

---

**Siguiente paso recomendado:** cuando esta historia esté clara en los 4, **entonces** Carlos scaffoldea el mock portal Y el chat UI, Emi prepara el truco de hot-reload para la sesión 4, Marita diseña el momento del self-healing, y Jhulyam construye el planner conversacional.
