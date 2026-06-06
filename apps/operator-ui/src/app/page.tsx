import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-12">
        <header className="space-y-4">
          <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
            Themis · Hack4Her 2026
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Aprende viendo. Razona con contexto. Prueba en cadena.
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Themis era la diosa griega del orden divino — la que traía balance
            al caos cuando no había reglas escritas. Hoy es el agente cognitivo
            que mapea sistemas web que no se hablan.
          </p>
        </header>

        <nav className="grid grid-cols-2 gap-4">
          <Link
            href="/teach"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors"
          >
            <h2 className="text-lg font-medium mb-2">Modo Enseñar</h2>
            <p className="text-sm text-text-secondary">
              Themis observa el proceso una vez.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /teach
            </p>
          </Link>

          <Link
            href="/execute"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors"
          >
            <h2 className="text-lg font-medium mb-2">Modo Ejecutar</h2>
            <p className="text-sm text-text-secondary">
              Themis replica con datos nuevos.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /execute
            </p>
          </Link>

          <Link
            href="/memory"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors"
          >
            <h2 className="text-lg font-medium mb-2">Memoria</h2>
            <p className="text-sm text-text-secondary">
              Mapeos aprendidos. Verificados en Solana.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /memory
            </p>
          </Link>

          <Link
            href="/recommendations"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors"
          >
            <h2 className="text-lg font-medium mb-2">Recomendaciones</h2>
            <p className="text-sm text-text-secondary">
              Razonamiento contextual con Gemini.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /recommendations
            </p>
          </Link>

          <Link
            href="/validate"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors col-span-2"
          >
            <h2 className="text-lg font-medium mb-2">Validar Exactitud</h2>
            <p className="text-sm text-text-secondary">
              Side-by-side · origen vs destino · campo por campo. Rúbrica criterio 3.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /validate
            </p>
          </Link>

          <Link
            href="/diagnostics"
            className="group block rounded-lg border border-default p-6 hover:border-coral transition-colors col-span-2"
          >
            <h2 className="text-lg font-medium mb-2">Diagnostics</h2>
            <p className="text-sm text-text-secondary">
              Estado de las 6 capas. LIVE vs MOCK.
            </p>
            <p className="font-mono text-xs text-text-tertiary mt-4 group-hover:text-coral transition-colors">
              → /diagnostics
            </p>
          </Link>
        </nav>

        <footer className="pt-8 border-t border-subtle">
          <p className="text-xs text-text-tertiary font-mono">
            Reto Always on Shelf · Tuali / Arca Continental · 6 capas: Claude · ElevenLabs · Gemini · MongoDB · Vultr · Solana
          </p>
        </footer>
      </div>
    </main>
  );
}
