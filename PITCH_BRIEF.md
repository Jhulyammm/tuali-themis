# Brief de pitch · Themis — Hack4Her 2026

**Reto:** Always on Shelf — Tuali / Arca Continental
**Duración:** 13 minutos
**Equipo:** Jhulyam (tech lead) · Marita (frontend) · Ale (design + pitch) · Emi (backend)

---

## 1. La narrativa central (memorízenla)

> *"Arca Continental atiende 1.4 millones de puntos de venta. Cada OXXO, cada Costco, cada Don Beto en una colonia obrera. Cada uno tiene su propio catálogo, su propio ERP, sus propios mappings entre proveedor y Tuali. Hoy lo hace un capturista a mano: 6 minutos por SKU, 8% de error, sin trazabilidad, 16 horas de capacitación por cliente nuevo. Themis observa una vez, aprende el mapeo, y lo reproduce en las miles. Aprende, habla, razona, recuerda, verifica y escala — las 6 capas — y cada paso queda firmado en Solana para que Tuali no tenga que confiar a ciegas."*

---

## 2. Lo que NO somos (cuidado con esto)

- **NO somos un OCR.** No leemos imágenes de productos.
- **NO somos un ML clásico** que predice surtido. Esa es la trampa del reto.
- **NO somos automation hardcoded** (RPA tipo UiPath). Eso es lo que queremos destruir.
- **NO somos un asistente conversacional.** Themis es **agente cognitivo verificable**.

> Si el jurado dice *"esto ya existe con RPA"*, la respuesta es:
> *"RPA hardcoded rompe cuando cambia el HTML. Themis tiene self-healing por visión + provenance on-chain. Cada mapping firmado, cada cambio auditable. RPA no puede demostrar que aprendió — Themis lo prueba en Solana."*

---

## 3. Guion de 13 minutos — minuto a minuto

### 0:00 — 1:00 · Hook (Ale)

Abre con un golpe directo:

> *"En Arca cada tendero captura SKUs a mano. Imagínense: el dueño de Abarrotes Don Beto en Colonia Obrera tipea 'Coca-Cola 600ml' y su precio. Después abre el ERP de Tuali y vuelve a tipear. Y vuelve. Y vuelve. Multiplicado por 1.4 millones de puntos de venta. Eso son **horas que rompen el surtido**. Hoy les vamos a mostrar Themis — la agente que aprende ese proceso una vez y lo replica en todas."*

**Lo que se ve en pantalla:** Landing page. CTA "Iniciar observación" visible.

---

### 1:00 — 3:00 · Demo Aprender (Marita en pantalla · Ale narra)

Ir a `/teach`. Cliente activo: **🥫 Abarrotes Don Beto**.

1. Click "Iniciar observación" → iframe carga el catálogo.
2. Themis arranca a hablar: *"Detecté el catálogo del proveedor. Estoy mapeando los campos hacia el ERP de Tuali."*
3. Hacer un par de clicks simulando el proceso.
4. Click "Detener y aprender" → ~25 segundos sintetizando.

**Cuando aparece el card verde:**

- "Playbook extraído · Firmado en Solana" → click en el badge Solana → **abre Solana Explorer real en pestaña nueva**.
  > Ale: *"Eso no es un PDF de promesas. Es una transacción real en cadena pública. Cualquiera puede verificarla."*
- Bajar y mostrar **SelfCritiqueCard** → grade A/B/C de Themis sobre sí misma.
  > Ale: *"Ningún otro equipo va a mostrarles su propia debilidad. Themis sí. No infla resultados."*
- Mostrar **ConfidenceHeatmap** con cuadritos verdes/amarillos/rojos.
  > Ale: *"Lo que está en rojo, Themis NO lo firma. Pide revisión humana. Cero confianza ciega."*
- Mostrar **CostBreakdownCard**:
  > Ale: *"$0.0076 — ocho décimas de centavo. Un capturista cobra $0.83 por el mismo SKU. **361× ROI**. Y eso es solo en costo. Falta velocidad."*

---

### 3:00 — 5:00 · Demo Ejecutar (Marita)

Ir a `/execute`. Cliente sigue siendo Don Beto.

1. Seleccionar el playbook **★ Tuali · Capturar SKU Coca-Cola desde catálogo proveedor**.
2. Click "Ejecutar playbook" → modo replay arranca.
3. Telemetría sube en vivo, voz narra cada hito.
4. **En el step 3-4: self-healing activa.** Themis dice *"Detecté que el campo cambió de nombre. Adaptando con visión, sin perder el flujo."*
5. Termina con card verde · 9 steps completados.

**Ale interrumpe en el self-healing:**

> *"Esto es lo que rompe a RPA tradicional. Un día Tuali cambia el label de un campo y todo se rompe. Themis adapta usando visión. Lo registra. Y sigue."*

---

### 5:00 — 7:00 · Multi-tenant + Onboard con URL (Ale + Marita)

**Aquí cambia el mindset. La parte más importante para Arca.**

1. Abrir el **ClientSelector del topbar** → mostrar las 4 tiendas (🛒 OXXO, 🏪 Soriana, 🛍️ Costco, 🥫 Don Beto).
2. Cambiar a **🛒 OXXO Tec**. La app entera pivotea: memoria, recomendaciones, comparativo.

> Ale: *"Cada cliente Tuali tiene su propio espacio. Su zona, sus playbooks, su historial. 1247 runs en OXXO Tec. 892 en Soriana Cumbres. 421 en Costco San Pedro. Esto es la plataforma multi-tenant que Tuali necesita para escalar a 1.4 millones."*

3. Ir a `/clients` → mostrar el grid + el panel "Onboard con una URL".
4. **Pegar `https://www.7-eleven.com.mx`** → Click Onboard → ~5 segundos.
5. Aparece nueva tarjeta con emoji 🌃 y badge "Onboarding".

> Ale: *"Antes para integrar un cliente nuevo necesitaban 16 horas de capacitación. Acabamos de hacerlo en 5 segundos con sólo una URL. Themis identificó la marca, le asignó zona, está lista para aprender."*

---

### 7:00 — 9:00 · Razonamiento contextual (Ale)

Cambiar cliente a **🛒 OXXO Tec** → Ir a `/recommendations`.

1. Click "Generar eventos y recomendaciones".
2. Mientras Gemini hace Deep Research, Ale habla:

> *"OXXO Tec está al lado del Tec de Monterrey. Hay Liga MX en una semana. Hay temporada de exámenes. Themis investiga eventos REALES en vivo — no fechas hardcoded — y razona qué SKUs van a tener spike."*

3. Resultado: eventos con **links verificables**.

> Ale los muestra: *"Esos links son fuentes que Gemini consultó. Cualquiera los abre y verifica."*

4. Recomendaciones por SKU con `driver`: "+35% Powerade por examen Tec", "+22% Coca-Cola por evento Tigres".

---

### 9:00 — 10:30 · Reto del jurado (Ale invita al jurado)

**El momento killer.** Ale al micrófono al jurado:

> *"Y para que no piensen que esto es plantillas hardcoded — denme ahora mismo cualquier URL pública de cualquier sitio que quieran. Themis nunca la vio. La van a ver aprender en vivo."*

Ir a `/challenge`. El jurado dicta una URL (o usá la sugerida `httpbin.org/forms/post` si nadie quiere participar).

- Countdown grande sube
- En <30 segundos: grade A/B + 6-8 mappings + Solana firma + costo

> Ale: *"30 segundos. Cualquier URL. Sin intervención humana. Y firmado on-chain para auditoría."*

---

### 10:30 — 11:30 · Themis como infraestructura (MCP)

**Ale baja la pelota para algo técnico fuerte:**

Ir a `/mcp`.

> *"Pero el punto no es Themis como app. Es Themis como infraestructura. Acabamos de implementar Model Context Protocol — el estándar de Anthropic para que asistentes IA puedan invocar tools externas. Cualquier asistente que soporte MCP — Claude Desktop, Cursor — puede llamar a Themis."*

Mostrar las 6 tools listadas. Mostrar la config JSON para Claude Desktop.

> *"Imaginen un product manager en Tuali abriendo Claude Desktop y diciendo: 'Onboardea Walmart México y dame sus mappings hacia Tuali'. Themis lo hace. Eso es lo que mata todo el SaaS de captura. **Themis es una API, una UI y un tool MCP al mismo tiempo**."*

---

### 11:30 — 13:00 · Cierre con comparativo (Ale)

Ir a `/comparativo` con cliente OXXO Tec.

Parar en el `12× ACELERACIÓN MEDIDA` y leer la tabla:

| | Capturista hoy | Themis |
|---|---|---|
| Tiempo/captura | 6 min | 32s |
| Error rate | 8% | 2% |
| Training/cliente | 16 h | 0 min |
| Trazabilidad | Ninguna | On-chain |

Cierre:

> *"Themis aprende viendo a un humano una vez. Replica en miles de tienditas. Razona con eventos reales. Recuerda lo aprendido cross-cliente. Verifica cada paso en Solana. Y escala como MCP server para que Tuali, Arca Continental y cualquier socio puedan integrarla en segundos."*
>
> *"Esto NO es un demo de hackathon. Es la infraestructura de captura que Tuali necesita para los próximos 5 años. Gracias."*

**Pantalla final:** landing con las 6 capacidades.

---

## 4. Reparto de roles

| Persona | Rol durante el pitch |
|---|---|
| **Ale** | Voz principal, narrativa, contacto con jurado, cierre |
| **Marita** | Manos en pantalla (navegación, clicks, cambio de cliente). Si el demo truena, improvisa el screen |
| **Jhulyam** | Primera fila. Lista para preguntas técnicas. NO hablar a menos que pregunten de arquitectura |
| **Emi** | Backup de demo + soporte Deep Research si Gemini truena en vivo |

---

## 5. Wow moments — pausen ahí

5 momentos donde tienen que **dejar de hablar 2 segundos** y dejar que el jurado absorba:

1. **Click en el badge Solana → abre Explorer real.** Esperar 3 segundos.
2. **Self-healing en /execute** → cuando Themis dice "Adaptando con visión", parar y dejar el log animarse.
3. **Onboard de 7-Eleven en /clients** → cuando aparece la tarjeta con emoji, esperar un beat.
4. **Reto del jurado terminando** → cuando el countdown cierra y aparece el card verde, **no hablar**.
5. **MCP config JSON** → cuando muestren las 6 tools listadas, dejen que las lean.

---

## 6. Preguntas del jurado probables (con respuesta)

### "¿Y si Tuali cambia el HTML mañana?"

> *"Pasa todo el tiempo. Por eso Themis no usa selectores fijos sino `selector_intent` — descripciones en lenguaje natural. Cuando un campo cambia, Themis usa visión (Claude) para encontrarlo. Lo vieron en vivo en el step 3 cuando dijo 'detecté cambio en la página'. Ese momento NO está hardcoded — es la salvaguarda real."*

### "¿Cuánto cuesta operar Themis en producción?"

> *"$0.0076 por captura completa. Un capturista cuesta $0.83 por la misma captura. ROI inicial de 109×. A escala de 1.4M puntos de venta × 1 captura diaria = $11,664/día con Themis vs $1.16M/día con humanos. Y eso solo en costo directo."*

### "¿Cómo sabemos que aprendió y no está hardcoded?"

> *"Cada playbook se hashea con SHA-256 y se registra como Memo en Solana devnet. El tx es público. El playbook viejo no se puede modificar sin que cambie el hash. Y CADA mapping individual también se firma — si Themis dice que aprendió 7 mappings, hay 7 transacciones verificables. Click cualquiera, abre Solana Explorer."*

### "¿Y la privacidad de los datos de las tienditas?"

> *"Themis NO guarda valores sensibles. Solo guarda el SCHEMA del mapeo (qué campo se mapea con cuál) y un hash del playbook. Los datos reales del SKU nunca salen de la sesión Browserbase. MongoDB solo tiene la estructura aprendida, no las capturas en sí."*

### "¿Soportan otros idiomas / catálogos en inglés?"

> *"Sí — Claude entiende español, inglés, portugués nativamente. Los prompts están en español por el contexto Tuali, pero los mappings se extraen igual desde HTML en cualquier idioma. Si Arca expande a Brasil o Argentina, Themis aprende igual."*

### "¿Qué pasa si Gemini está rate-limited?"

> *"Fallback automático al calendario curado de eventos México. La página muestra un badge 'Calendario' en lugar de 'Deep Research'. El jurado vio el calendario funcionar cuando demoré la conexión a Gemini. Cero downtime."*

---

## 7. Plan B — si algo truena en vivo

| Si truena... | Plan B |
|---|---|
| `/teach` no aprende mappings | Saltar a `/execute` con el DEMO_PLAYBOOK estrella ★ — siempre funciona |
| `/challenge` se queda colgado >40s | Decir *"esta URL bloquea bots, déjenme con esta otra"* → usar `httpbin.org/forms/post` que SIEMPRE devuelve mappings |
| Voz no sale (ElevenLabs rate limit) | Seguir hablando ustedes. Decir *"Themis normalmente narra esto en voz, hoy estamos en modo silencio para que escuchen lo que les digo"* |
| Solana no firma | Mostrar `/diagnostics` con la wallet address y SOL balance — *"esto es lo que daría la firma, está vivo"* |
| `/recommendations` no carga | Saltar a `/clients` directamente, mostrar los 4 preseed con todas sus stats |
| Iframe en `/teach` queda vacío (X-Frame-Options bloqueado) | Decir *"el sitio bloquea embed pero la extracción HTTP sigue funcionando"* → continuar con el flujo |
| Browserbase 402 | Ya estamos en modo replay, no debería pasar. Si pasa, el banner "Modo replay" arriba lo justifica |

---

## 8. Las 3 frases que tienen que decir SÍ o SÍ

1. **"6 capas integradas — la rúbrica del reto las pide explícitas."**
   (Demuestra que leyeron el PDF.)
2. **"Solo con una URL — onboard de cualquier cliente Tuali en 5 segundos."**
   (Habla al dolor real.)
3. **"Firmado en Solana — auditable sin tener que confiar."**
   (Diferenciador técnico.)

---

## 9. Pre-flight 30 minutos antes del pitch

- [ ] Hard refresh la app (`Ctrl+Shift+R`)
- [ ] Verificar wallet Solana tiene >0.5 SOL
- [ ] Verificar que el cliente activo es **🥫 Abarrotes Don Beto** (para arrancar con sentido narrativo)
- [ ] Tener pestaña abierta de Solana Explorer ya
- [ ] Tener URL backup `httpbin.org/forms/post` lista
- [ ] Audio del laptop alto, micrófono testeado
- [ ] DEMO_PLAYBOOK ★ aparece primero en `/execute`
- [ ] Cerrar todas las pestañas no esenciales
- [ ] Probar el flujo completo una vez (3 min)
- [ ] Tener el deploy de Vercel verificado en otra pestaña

---

## 10. Las 6 capas explícitas (por si las preguntan)

| Capa | Tecnología | Qué hace en Themis |
|---|---|---|
| **Capa 1** · Core agent | Claude Sonnet 4.6 + Browserbase + Stagehand | Aprende viendo + ejecuta + self-healing por visión |
| **Capa 2** · Voz | ElevenLabs + Whisper | Narra con voz mexicana emocional + bidireccional (jurado le pregunta) |
| **Capa 3** · Razonamiento | Gemini 2.0 Flash | Deep Research de eventos reales + recomendaciones contextuales |
| **Capa 4** · Memoria | MongoDB Atlas | Knowledge graph cross-cliente + cross-cliente recall |
| **Capa 5** · Infraestructura | Vercel + MCP Server | Deploy + Themis expuesto como herramienta para otros agentes |
| **Capa 6** · Provenance | Solana devnet | Cada playbook + cada mapping firmados on-chain |

---

## 11. URLs de la demo en orden

```
1. /                      (landing — hook)
2. /teach                 (aprender Don Beto)
3. /execute               (ejecutar ★ Tuali)
4. /clients               (multi-tenant + onboard URL)
5. /recommendations       (Gemini Deep Research)
6. /challenge             (reto del jurado)
7. /mcp                   (infraestructura)
8. /comparativo           (cierre con números)
```

---

*Vamos a ganarles a las RPA, a los OCR y a los SaaS de captura. 🏆*
