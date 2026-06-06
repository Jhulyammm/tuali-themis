import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-corp-blue mb-1">Bienvenida, María</h1>
      <p className="text-sm text-corp-gray mb-6">
        Sistema interno de captura. Selecciona una acción para empezar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ActionCard
          title="Captura SKU"
          desc="Registrar producto nuevo desde portal de cliente."
          href="/captura"
          highlighted
        />
        <ActionCard
          title="Inventario"
          desc="Consultar y editar inventario actual."
          href="/inventario"
        />
        <ActionCard
          title="Reportes"
          desc="Generar reportes de captura y validación."
          href="#"
          disabled
        />
      </div>

      <div className="mt-8 p-3 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
        <strong>⚠ Aviso:</strong> Cliente Walmart no tiene EDI activado. Captura
        manual obligatoria de cada SKU. Ticket #4521 abierto desde 2026-04-12.
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  desc: string;
  href: string;
  highlighted?: boolean;
  disabled?: boolean;
}

function ActionCard({ title, desc, href, highlighted, disabled }: ActionCardProps) {
  const className = [
    "block p-4 border bg-white",
    highlighted
      ? "border-corp-blue border-2"
      : "border-corp-border",
    disabled
      ? "opacity-50 cursor-not-allowed"
      : "hover:bg-corp-blue-light",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <h2 className="font-semibold text-corp-blue mb-1">{title}</h2>
      <p className="text-xs text-corp-gray">{desc}</p>
    </>
  );

  if (disabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
