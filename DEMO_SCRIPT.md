# Themis — Demo Script (13 min para Hack4Her 2026)

> Co-pitch: Ale (apertura + cierre + narrativa visual) · Marita (técnico + cronómetro)
> Backup: video en local si la conexión falla

---

## Setup pre-pitch (5 min antes)

- [ ] Vultr URL responde: `curl http://<VULTR_IP>:3000/produccion`
- [ ] Browser tabs abiertas:
  1. `http://<VULTR_IP>:3000` (operator-ui)
  2. `http://<VULTR_IP>:3002/pedidos/nuevo` (en pestaña separada, para el "antes" manual)
  3. `http://<VULTR_IP>:3001/inventario` (ERP destino, para el "después")
  4. `https://explorer.solana.com/address/5ed4owUQMMoDmNqnnmUSc4pttstivZp1WkfVXtY1RsYV?cluster=devnet` (cierre on-chain)
- [ ] Audio del laptop subido al 70%
- [ ] Touchpad/mouse listos
- [ ] Marita: cronómetro en otro celular

---

## Minuto 0:00 — Apertura · Ale (45 seg)

> *"Themis era la diosa griega del orden divino — la que traía balance al
> caos cuando no había reglas escritas. En el mundo de Tuali y Arca
> Continental, implementar EDI con un cliente nuevo toma 6 meses. Mientras
> tanto, alguien copia datos a mano. Cero estándar. Cero escala.*
>
> *Hoy construimos un agente cognitivo que aprende observando, razona con
> contexto, recuerda lo aprendido, y prueba criptográficamente. Su nombre
> es Themis."*

**[Click en la pestaña operator-ui · landing]**

---

## Minuto 0:45 — El dolor manual · Marita (1 min)

**[Cambiar a pestaña `localhost:3002/pedidos/nuevo`]**

> *"Esto es lo que hace hoy un trabajador en Distribuidora del Norte: un
> portal CPG real, con 4 pasos. Cliente destinatario, productos,
> logística, confirmación."*

**[Hacé el wizard MUY despacio, mostrando cada campo distinto del ERP destino]**

> *"Fíjense — el proveedor le dice 'Producto'. El ERP de Tuali lo necesita
> como 'Denominación comercial'. El proveedor da 'Precio lista con IVA'.
> Tuali lo guarda como 'Precio neto'. Necesitás dividir entre 1.16."*

> *"Sin estándar EDI, un humano hace esto. 6 minutos por captura, 8% de
> error promedio, sin trazabilidad."*

---

## Minuto 1:45 — Acto 1: Aprender observando · Marita (2.5 min)

**[Cambiar a operator-ui · `/teach`]**

> *"Ahora Themis. Una sola vez muestro el proceso. Themis observa."*

**[Click "Sistema sugerido" → "Iniciar observación"]**

*Espera a que cargue el iframe Browserbase (~10s). Mientras carga:*

> *"Lo que ven es un browser real corriendo en Browserbase Cloud. Stagehand
> lo controla. Themis observa cada navegación."*

**[Iframe aparece con el catálogo. Click en "Pedidos" → "Nuevo pedido"]**

**[Hacé el wizard despacio, claramente, narrando]**

*Mientras vos clickeás, el panel derecho EMPIEZA A LLENARSE con mappings
detectados — y la VOZ de Themis los anuncia.*

> *"Escuchen — la voz de Themis. ElevenLabs, español mexicano. Está
> diciendo: 'Detecté un mapeo: Producto corresponde a Denominación
> comercial.' Eso no es scripted. Claude lo infiere en tiempo real."*

**[Después de paso 3 del wizard, click "Detener y aprender"]**

**[Aparece banner "Sintetizando playbook completo"]**

*Espera ~20s.*

**[Aparece card verde con el badge Solana clickeable]**

> *"Listo. Playbook extraído. 8 mapeos. Hash firmado en Solana devnet.
> Tx hash real."*

**[Click en el badge Solana → se abre el Explorer en nueva pestaña]**

> *"Esa transacción se generó hace 30 segundos. Si lo tuviera hardcoded,
> NO podría firmar esa tx en vivo."*

**[Cerrar la pestaña del Explorer, volver a operator-ui]**

---

## Minuto 4:15 — Acto 2: Ejecutar solo · Marita (2 min)

**[Click en sidebar → "Ejecución"]**

> *"Ahora Themis hace lo mismo, sola, con datos nuevos. Sin que nadie le
> diga qué hacer."*

**[Seleccionar el playbook recién aprendido en el dropdown · cambiar
product_id → click "Ejecutar playbook"]**

**[Iframe aparece — esta vez es Themis manejando el browser, no un humano]**

> *"Stagehand está clickeando. Los pasos van apareciendo en vivo via
> Server-Sent Events. Telemetría arriba — pasos completados, latencia
> total, auto-reparaciones, errores."*

**[Mostrar las 4 telemetry cards moviéndose]**

> *"En 30 segundos hizo lo que al humano le tomó 6 minutos."*

---

## Minuto 6:15 — Acto 3: Razonamiento contextual · Ale (1.5 min)

**[Click sidebar → "Recomendaciones"]**

> *"Hasta ahora Themis transcribió fielmente. Ahora razona con contexto."*

> *"OXXO Tec Sur. Zona universitaria, Monterrey. Este sábado: Clásico Regio."*

**[La página tarda ~5s en cargar Gemini]**

> *"Gemini Pro razona: cerveza nacional sube 35% en zonas universitarias
> con derbi. Botanas saladas 40%. Recomendación cuantitativa con
> justificación natural. Esto no es un modelo entrenado sobre el
> calendario de fútbol — lo razona en vivo."*

---

## Minuto 7:45 — Acto 4: Memoria persistente · Ale (1 min)

**[Click sidebar → "Memoria"]**

> *"Themis recuerda. Cada mapping aprendido vive en el knowledge graph
> de MongoDB Atlas. Es reusable cross-cliente."*

> *"Mañana, otro proveedor, otro portal. Themis llega con 'ya vi este
> mapeo' — y arranca con 9 de 11 campos pre-resueltos."*

---

## Minuto 8:45 — Acto 5: Self-healing · Marita (1.5 min)

**[Click sidebar → "Auto-reparación"]**

> *"Pregunta de un millón de dólares: ¿qué pasa cuando el sitio cambia?"*

> *"Themis no se rompe. Cuando un selector CSS falla, toma screenshot,
> Claude Vision lo localiza por semántica, se adapta sola."*

**[Mostrar los events de adapted_from → adapted_to]**

> *"Acá tienen los X eventos de auto-reparación reales. Cada uno: antes
> y después del selector. Confianza promedio 93%."*

---

## Minuto 10:15 — Acto 6: Prueba on-chain · Ale (1 min)

**[Click sidebar → "Producción"]**

> *"Producción real. URLs públicas en Vultr Cloud. Health en vivo de las
> 6 capas. Wallet Solana con balance real."*

> *"Cada playbook tiene proveniencia criptográfica. La pregunta del jurado
> antes de que la hagan: '¿cómo demostrás que aprendiste y no está
> hardcoded?'"*

**[Abrir el Solana Explorer en la pestaña ya preparada]**

> *"Tx hash en blockchain pública. Pueden verificar ustedes mismos.
> Hash del playbook coincide con el que está en MongoDB. Prueba
> criptográfica."*

---

## Minuto 11:15 — Comparativo · Ale (1 min)

**[Click sidebar → "Comparativo"]**

> *"Side-by-side. Manual vs Themis. Datos reales del store."*

**[Apuntar al hero "11× más rápido"]**

> *"Once veces más rápido. Cero capacitación por cliente. Trazabilidad
> on-chain. Cero errores en las ejecuciones registradas."*

---

## Minuto 12:15 — Cierre · Ale (45 seg)

> *"Themis es seis capas: aprende, te habla, razona con contexto,
> recuerda, escala en Vultr, prueba en Solana.*
>
> *Es la primera capa de fuerza laboral cognitiva verificable para CPG.
> Themis trae orden donde no hay estándar."*

**[Pausa]**

> *"Gracias."*

---

## Pregunta-killer · respuestas memorizadas

> **"¿Cómo demuestras que Themis aprendió y no lo hardcodeaste?"**

1. **Selector intent en lenguaje natural** — log real visible en `/registro`
2. **Self-healing en vivo** — abro DevTools, cambio un label, Themis se adapta
3. **"Propongan otro flujo"** — peg URL nueva, demo en vivo
4. **Memory graph cross-cliente** — N mapeos aprendidos, cero hardcoded
5. **🔥 Solana Explorer** — tx firmada hace 12 min · `<TX_HASH>`

---

## Drop rules durante el pitch

| Minuto | Si... | Acción |
|--------|-------|--------|
| 1-3 | Browserbase iframe tarda >15s en cargar | Cortá narrativa, mostrá videoclip backup |
| 3-5 | Live mappings no aparecen | Continuá igual — la card final con Solana hace el wow |
| 5-7 | Stagehand falla en /execute | Mostrá los logs en `/registro` de runs previos |
| 7-9 | Gemini 429 | "Cae automático a Claude" → mostralo |
| 11-13 | Vamos >13 min | Saltá comparativo, andá directo al cierre |

---

## Backup video

- Grabarlo h-2 antes del pitch
- 13 min exactos con narración encima
- Si la conexión a Vultr cae → lanzar el video sin parar
