# Self-Healing Demo Trick — Acto 4 del pitch

> **Coreografía exacta** del momento más arriesgado y más cinematográfico del demo.
> Quien lee esto: Jhulyam (agent), Emi (mock portal + trigger), Marita (visual del momento), Carlos (UI del step log).
> **Si este momento sale bien → ganamos. Si falla en vivo → backup video sin pestañear.**

---

## 1. La promesa al jurado

> *"Mientras el agente ejecuta el lote, vamos a CAMBIAR el portal en vivo. Sin avisarle al agente. Vean."*

A los ~30 segundos del Acto 3 (bulk en curso, 5-7 éxitos ya visibles), Emi hace **un click** en su segundo monitor. El portal cambia. La siguiente ejecución del lote muestra:

1. `⚡ Adaptando...` (yellow pulse, 2-3 segundos)
2. `✓ Capturar cantidad   3.4s ⚡` con subtítulo "Adaptó al cambio: 'Cantidad' → 'Cantidad solicitada'"
3. Lote continúa, las siguientes ejecuciones también usan el nuevo label sin problemas

**Total visible:** 5-6 segundos. **Total de wow:** infinito.

---

## 2. El cambio EXACTO

### Lo que cambia

En la página `/portal/surtido` del mock portal:
- El label del input de cantidad pasa de `"Cantidad"` a `"Cantidad solicitada"`
- El `name` attribute del input cambia de `name="cantidad"` a `name="cantidad_solicitada"`
- (El `id` puede quedar igual — no afecta porque Stagehand usa selectores semánticos)

### Por qué este cambio específicamente

- **Label visible:** el jurado ve la diferencia en el navegador embedded (importante visualmente)
- **Selector estructural cambia:** garantiza que el matcher por DOM falle y caiga al fallback de visión
- **Semánticamente equivalente:** Claude con visión lo resuelve fácilmente (alta tasa de éxito)
- **Reversible en 1 click:** Emi puede revertir entre ensayos sin reiniciar nada

### Lo que NO cambia

- La estructura general de la página
- Los otros campos
- La posición visual del input
- El comportamiento del botón Guardar

**Regla:** un solo cambio quirúrgico. No estamos demostrando "el agente sobrevive a una página rediseñada" — estamos demostrando **"el agente se adapta cuando algo razonable cambia"**. Realista, no épico.

---

## 3. Implementación técnica

### 3.1 El mock portal con "demo mode"

`apps/mock-portal/src/app/portal/surtido/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";

export default function SurtidoPage() {
  const [labelOverride, setLabelOverride] = useState<string | null>(null);

  // Lee el override de localStorage al montar y cada vez que cambia
  useEffect(() => {
    const sync = () => {
      const v = localStorage.getItem("demo:cantidad_label");
      setLabelOverride(v);
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const labelText = labelOverride ?? "Cantidad";
  const inputName = labelOverride ? "cantidad_solicitada" : "cantidad";

  return (
    <form>
      {/* ... resto del formulario ... */}
      <label htmlFor="cantidad-input" data-testid="cantidad-label">
        {labelText}
      </label>
      <input
        id="cantidad-input"
        name={inputName}
        type="number"
        data-testid="cantidad-input"
      />
      {/* ... */}
    </form>
  );
}
```

**Nota crítica:** NO usamos `data-testid` para el label change. El test-id queda fijo porque eso lo usaría el agente como fallback DOM. Si lo cambiamos, el agente usaría el test-id y el truco no se notaría. **Queremos que el agente caiga a vision.**

### 3.2 La página de control de Emi (oculta del demo)

`apps/mock-portal/src/app/demo-control/page.tsx`:

```tsx
"use client";
import { useState } from "react";

export default function DemoControl() {
  const [labelChanged, setLabelChanged] = useState(false);

  const trigger = () => {
    localStorage.setItem("demo:cantidad_label", "Cantidad solicitada");
    // Forzar evento storage para que el portal en otra tab actualice
    window.dispatchEvent(new StorageEvent("storage", {
      key: "demo:cantidad_label",
      newValue: "Cantidad solicitada",
    }));
    setLabelChanged(true);
  };

  const reset = () => {
    localStorage.removeItem("demo:cantidad_label");
    window.dispatchEvent(new StorageEvent("storage", {
      key: "demo:cantidad_label",
      newValue: null,
    }));
    setLabelChanged(false);
  };

  return (
    <main className="p-12 space-y-6">
      <h1>Demo Control · NO MOSTRAR EN PANTALLA</h1>

      <div className="space-y-2">
        <p>Estado actual del label: <strong>{labelChanged ? "Cantidad solicitada" : "Cantidad"}</strong></p>
        <button onClick={trigger} disabled={labelChanged}
          className="px-6 py-3 bg-red-600 text-white rounded">
          TRIGGER: Cambiar label
        </button>
        <button onClick={reset} disabled={!labelChanged}
          className="px-6 py-3 bg-zinc-700 text-white rounded">
          Reset
        </button>
      </div>
    </main>
  );
}
```

**Setup para el demo:**
- Emi abre `localhost:3001/demo-control` en su segundo monitor (NO compartido en pantalla)
- En el monitor principal (compartido) se ve el Operator UI ejecutando el lote
- Cuando llegue el momento, click en TRIGGER. Listo.

### 3.3 El detector + fallback de visión en el agente

`packages/agent/src/execute/stagehand-runner.ts` (pseudocódigo):

```typescript
async function resolveAndAct(action: PlaybookAction, page: Page) {
  const start = Date.now();

  // Intento 1: DOM-based resolver via Stagehand normal
  try {
    await stagehand.act(action.selector_intent, action.params);
    return logSuccess(action, Date.now() - start, "dom");
  } catch (err) {
    if (!(err instanceof SelectorNotResolvedError)) throw err;
    // continúa al fallback
  }

  // Intento 2: vision fallback
  await reportToUI({ status: "adapting", action });
  const screenshot = await page.screenshot();
  const visionResult = await claude.messages.create({
    model: "claude-sonnet-4-6",
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", data: screenshot } },
        { type: "text", text: `Esta página tenía un elemento descrito como "${action.selector_intent}". Pero el selector tradicional falló. Mira la imagen y dime: ¿qué elemento corresponde semánticamente? Devuelve bounding box y tu best guess de selector CSS.` }
      ]
    }],
    max_tokens: 256,
  });

  const newSelector = extractSelector(visionResult);
  await stagehand.act(newSelector, action.params);
  return logSuccess(action, Date.now() - start, "vision", { adapted_from: action.selector_intent, adapted_to: newSelector });
}
```

**El log de adaptación se guarda en `executions.logs`** con un flag `adapted=true` que la UI usa para mostrar el icono ⚡.

### 3.4 La UI del step log que muestra el momento

Carlos (`apps/operator-ui/src/components/StepLog.tsx`):

```tsx
{step.status === "adapting" && (
  <div className="flex items-center gap-2 text-status-warning">
    <PulsingDots />
    <span>Adaptando...</span>
  </div>
)}

{step.status === "succeeded" && step.adapted && (
  <div className="flex items-center gap-2">
    <Check className="text-status-success" />
    <span>{step.label}</span>
    <span className="font-mono text-text-tertiary">{step.duration_ms}ms</span>
    <Zap className="text-status-warning" />
    <span className="text-xs text-text-secondary">
      Adaptó al cambio: "{step.adapted_from}" → "{step.adapted_to}"
    </span>
  </div>
)}
```

Marita: la animación del icono ⚡ es **persistente** después de aparecer. No es un flash. Permanece como insignia de que ese paso se auto-curó.

---

## 4. Coreografía del demo en vivo

### Setup pre-demo (antes de subir al escenario)

| Quién | Acción |
|-------|--------|
| Emi | Abrir `localhost:3001/demo-control` en monitor secundario (no compartido) |
| Emi | Confirmar que `localStorage["demo:cantidad_label"]` está limpio (Reset) |
| Jhulyam | Verificar que el agente está conectado a Browserbase y responde |
| Carlos | Operator UI cargado con el lote ya pre-iniciado a 5/30 (mock state) o real |
| Marita | Confirmar que el icono ⚡ se renderiza con el color correcto (#f59e0b) |

### Durante el demo (Acto 3 → Acto 4)

| Segundo | Quién dice / hace |
|---------|-------------------|
| 0:00 | Presentador (en el chat): *"Actualiza surtido de Coca 600ml a 50 unidades en todas las OXXO de Querétaro."* |
| 0:05 | Click "Ejecutar 30 instancias" — bulk arranca |
| 0:08 | Primera ejecución termina ✓ |
| 0:15 | 5 ejecuciones ✓ visibles en la lista |
| 0:18 | Presentador: *"Mientras el agente trabaja, vamos a cambiar el portal sin avisarle."* |
| 0:20 | **Emi: 1 click en TRIGGER del demo-control** |
| 0:22 | La siguiente ejecución del lote muestra `⚡ Adaptando...` |
| 0:24 | Presentador: *"El campo 'Cantidad' acaba de cambiar a 'Cantidad solicitada'. El agente lo detectó."* |
| 0:25 | El step se actualiza a `✓ Capturar cantidad  3.4s ⚡` |
| 0:27 | Subtítulo de adaptación visible |
| 0:30 | El lote continúa. Las siguientes ejecuciones usan el nuevo selector sin pulse (ya aprendió). |
| 0:40 | Presentador: *"Y todas las siguientes también. El agente se adaptó una vez, y se quedó adaptado."* |

**Tiempo total del Acto 4: ~45-60 segundos.** Encaja en el slot del [PLAN.md sección 7](./PLAN.md#7-demo-strategy-los-5-momentos-del-wow-430-min).

---

## 5. Ensayos obligatorios

Antes del demo final, este momento se ensaya **mínimo 5 veces** consecutivas. Si en alguna falla, debugger antes de continuar.

### Checklist de ensayo

- [ ] El TRIGGER de Emi propaga inmediatamente al portal embedded del agente (< 1 seg)
- [ ] El agente detecta el fallo de selector dentro de 2 seg
- [ ] La llamada de visión a Claude tarda < 4 seg
- [ ] El agente resuelve el selector correcto (NO un input distinto)
- [ ] La UI muestra "Adaptando..." durante toda la espera (no se queda en blanco)
- [ ] El step final muestra el ⚡ y el subtítulo correctos
- [ ] Las siguientes ejecuciones del lote NO vuelven a pulsar adapting (importante — sugiere que aprendió)

### Si falla en ensayo: orden de debugging

1. ¿El `localStorage` cambió? Abrir DevTools en el portal y verificar
2. ¿El portal embedded refrescó? Verificar evento `storage` se disparó
3. ¿El selector Stagehand falló? Verificar logs del agente
4. ¿La llamada a Claude vision falló? Verificar response JSON
5. ¿El selector devuelto es correcto? Verificar bounding box

Cada uno se valida en su propio paso. Si pasa los 5 → ensayo verde.

---

## 6. Planes de fallback escalonados

### Plan A (objetivo): trigger en vivo funciona
- 0 intervención manual durante el momento
- 100% del flujo orgánico
- Mejor wow posible

### Plan B (si vision es lento o inconsistente): video pre-grabado del momento
- Grabar previamente la versión perfecta del Acto 4 (~60 seg de video)
- Si en vivo se nota lag o inconsistencia, **Emi corta a video** (transición invisible si está bien editada)
- Mantiene la promesa al jurado

### Plan C (si todo el demo en vivo falla): backup video del demo completo
- Grabado en hora 40
- Versión perfecta de los 5 actos
- Se reproduce sin reconocer que no es en vivo
- Pierde 30% del wow pero protege el pitch

### Plan D (si el video también falla): explicación verbal con slides estáticos
- Slide con screenshots de cada momento
- Presentador narra
- "Esto es lo que el agente hizo en nuestras pruebas" — honesto pero perdemos el wow
- Pero el pitch sigue siendo coherente

**Cada plan se prepara EXPLÍCITAMENTE.** Emi en hora 40 confirma que tiene los 4 listos.

---

## 7. Variantes del cambio (si el label cambia es muy obvio)

Si el equipo siente que cambiar un label es "demasiado fácil" para vender el self-healing, hay variantes con más punch:

| Variante | Dificultad para el agente | Visibilidad para el jurado | Riesgo del demo |
|----------|---------------------------|----------------------------|-----------------|
| Cambiar label | Baja | Media | Bajo (recomendado) |
| Cambiar posición visual del input (mover a otra columna) | Media | Alta | Medio |
| Renombrar el botón "Guardar" → "Confirmar cambios" | Baja | Alta | Bajo |
| Reorganizar form en sections | Alta | Alta | Alto |
| Cambiar el flujo en 2 clicks | Muy Alta | Muy Alta | Muy Alto |

**Default: cambiar label.** Si en ensayos sale 5 de 5 verde → probar variante de renombrar botón también. Si sale 5/5 también → mostrar AMBOS cambios al mismo tiempo (el wow se multiplica).

---

## 8. Decisiones críticas pendientes

- [ ] **Emi confirma:** segundo monitor disponible en el lugar del demo
- [ ] **Carlos confirma:** el portal embedded del agente refleja `localStorage` cambios en < 1 seg
- [ ] **Jhulyam confirma:** la latencia de Claude vision es < 4 seg en ensayos
- [ ] **Marita confirma:** la animación del ⚡ persistente está implementada (no flash)
- [ ] **Todos confirman:** en hora 40 hacen 5 ensayos consecutivos cronometrados
- [ ] **Backup video del Acto 4:** Emi graba versión perfecta en hora 38

---

## 9. La regla de oro

> **Si en hora 44 (4 horas antes del pitch) el Acto 4 no sale 5/5 en ensayos consecutivos:**
> **→ Cambian a Plan B (video del Acto 4) sin debate.**
>
> **No se puede improvisar este momento en vivo si no está sólido.**

Mejor un demo con 4 wows en vivo + 1 video segmentado, que un demo con 5 wows en vivo donde 1 se ve roto.
