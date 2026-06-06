# Skill — Carlos (Frontend Engineer)

> Destilado de `docs/references/skills/frontend-patterns/SKILL.md`
> Léelo en hora 0. ~3 min.

## Stack a usar

Next.js 15 (App Router) + TypeScript strict + Tailwind + shadcn/ui + Framer Motion. Server Components por default, `"use client"` solo cuando lo necesites.

## Composition > Inheritance

shadcn ya viene así. Patrón estándar:

```tsx
<Card>
  <CardHeader>Playbook: actualizar surtido</CardHeader>
  <CardBody>...</CardBody>
</Card>
```

NO heredes ni hagas mega-componentes con props condicionales.

## Compound components (úsalo para Tabs/Modos)

Necesitarás esto para "Modo Enseñar" vs "Modo Ejecutar":

```tsx
<Tabs defaultTab="teach">
  <TabList>
    <Tab id="teach">Enseñar</Tab>
    <Tab id="execute">Ejecutar</Tab>
  </TabList>
  <TabPanel id="teach"><TeachMode /></TabPanel>
  <TabPanel id="execute"><ExecuteMode /></TabPanel>
</Tabs>
```

Usa el `<Tabs>` de shadcn — ya está hecho.

## Hooks útiles para esta app

### `useDebounce` para inputs de búsqueda
```tsx
const [query, setQuery] = useState("")
const debounced = useDebounce(query, 300)
useEffect(() => searchPlaybooks(debounced), [debounced])
```

### `useQuery` (mejor usa Tanstack Query directamente)
Para fetching de playbooks, executions, etc.

```bash
pnpm add @tanstack/react-query
```

## Performance: 3 reglas

1. **`useMemo`** para cómputos caros (sorting, filtering de listas largas)
2. **`useCallback`** para funciones pasadas a hijos memoizados
3. **`React.memo`** para componentes puros que renderizan en listas

Para la lista de playbooks con potencialmente 50+ items, usa **@tanstack/react-virtual** si llega a +30.

## Lazy loading

```tsx
const PlaybookViewer = lazy(() => import("./PlaybookViewer"))

<Suspense fallback={<Skeleton />}>
  <PlaybookViewer id={id} />
</Suspense>
```

Especialmente para el viewer del navegador en vivo (es pesado).

## Forms (modo enseñar input + modo ejecutar input)

Usa **react-hook-form + Zod**, no controlled state manual:

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

El schema de Zod se comparte con el backend → 1 fuente de verdad.

## Animaciones — Framer Motion

```bash
pnpm add framer-motion
```

Patrones que vas a usar:

- **Lista animada de playbooks** entrando/saliendo:
```tsx
<AnimatePresence>
  {playbooks.map(p => (
    <motion.div key={p.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}>
      <PlaybookCard playbook={p} />
    </motion.div>
  ))}
</AnimatePresence>
```

- **Modal de confirmación de ejecución** con scale + fade

## Error Boundary

Envuelve `<TeachMode>` y `<ExecuteMode>` cada uno en su propio ErrorBoundary. Si uno falla, el otro sigue vivo (importante en demo en vivo).

## Accesibilidad

- **Keyboard navigation** en la lista de playbooks: ↑↓ navega, Enter selecciona, Esc cierra
- `aria-modal`, `aria-expanded`, roles correctos en dropdowns
- Focus management cuando abres un modal — restaura al elemento previo al cerrar

## Lo que NO hagas

- No useState manual para forms complejos — usa react-hook-form
- No fetches dispersos por la app — centraliza en `lib/api.ts` con Tanstack Query
- No useEffect para data fetching en componentes Server (usa async server components)
- No emojis decorativos en la UI

---

**Lectura secundaria (hora 24+):** `docs/references/skills/motion-ui/SKILL.md` para las animaciones del polish final.
