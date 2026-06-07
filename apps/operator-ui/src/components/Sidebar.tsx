"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---------- Iconos inline ----------

function IconInicio({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}
function IconObservacion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
function IconEjecucion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function IconRegistro({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.3" /><circle cx="3.5" cy="12" r="1.3" /><circle cx="3.5" cy="18" r="1.3" />
    </svg>
  );
}
function IconAutoReparacion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 1.2-.3 2.3-.8 3.2" /><path d="m14 14 2 2 4-4" />
    </svg>
  );
}
function IconRecomendaciones({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M5 12H1M23 12h-4M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconMemoria({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" />
      <path d="M7.8 7.4 11 16M16.2 7.4 13 16M8 6h8" />
    </svg>
  );
}
function IconVerificacion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" /><path d="m9.2 12 1.9 1.9 3.7-3.7" />
    </svg>
  );
}
function IconProduccion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2" />
      <path d="M9 11a16 16 0 0 1 8-8c2 0 3 1 3 3a16 16 0 0 1-8 8l-3-3Z" />
      <circle cx="14.5" cy="9.5" r="1.4" />
    </svg>
  );
}

// ---------- Nav data ----------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operación",
    items: [
      { label: "Inicio",           href: "/",                icon: IconInicio },
      { label: "Observación",      href: "/teach",            icon: IconObservacion },
      { label: "Ejecución",        href: "/execute",          icon: IconEjecucion },
      { label: "Registro",         href: "/registro",         icon: IconRegistro },
      { label: "Auto-reparación",  href: "/auto-reparacion",  icon: IconAutoReparacion },
    ],
  },
  {
    title: "Inteligencia",
    items: [
      { label: "Recomendaciones",  href: "/recommendations",  icon: IconRecomendaciones },
      { label: "Memoria",          href: "/memory",           icon: IconMemoria },
    ],
  },
  {
    title: "Confianza",
    items: [
      { label: "Verificación",     href: "/validate",         icon: IconVerificacion },
      { label: "Comparativo",      href: "/comparativo",      icon: IconComparativo },
      { label: "Producción",       href: "/produccion",       icon: IconProduccion },
    ],
  },
];

function IconComparativo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  );
}

// ---------- Component ----------

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 74 : 248;

  return (
    // Wrapper relativo para que el botón de colapso pueda sobresalir
    <div className="flex-shrink-0 relative h-screen sticky top-0 z-40 transition-all duration-300" style={{ width: W }}>

      <aside
        className="flex flex-col h-full overflow-hidden transition-all duration-300"
        style={{
          width: W,
          background: "linear-gradient(177deg, #C8102E 0%, #B40D28 100%)",
        }}
      >
        {/* Shimmer */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 60% at 100% 0%, rgba(255,255,255,.10), transparent 60%)" }}
        />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-[11px] px-4" style={{ paddingTop: 18, paddingBottom: 20 }}>
          {/* Logo blanco sin caja */}
          <Image
            src="/assets/logo/THEMIS-logo-blanco.png"
            alt="Themis"
            width={28}
            height={28}
            className="flex-shrink-0 object-contain"
            style={{ marginTop: -3 }}
          />

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="leading-none font-semibold" style={{ fontSize: 17, letterSpacing: "0.14em", color: "#ffffff" }}>
                THEMIS
              </p>
              <p className="mt-[3px] font-medium" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(255,255,255,0.66)" }}>
                AI OPERATING SYSTEM
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.title}>
              {!collapsed && (
                <p
                  className="px-[10px] pb-[7px] font-semibold uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.5)",
                    paddingTop: gi === 0 ? 4 : 16,
                  }}
                >
                  {group.title}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="h-px mx-1 my-3" style={{ background: "rgba(255,255,255,0.12)" }} />
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={["flex items-center rounded-[10px] transition-colors duration-150", collapsed ? "justify-center py-[9px] px-0" : "gap-[11px] px-[11px] py-[9px]"].join(" ")}
                        style={
                          active
                            ? { background: "#ffffff", color: "#C8102E", fontWeight: 550, fontSize: 13.5 }
                            : { color: "rgba(255,255,255,0.85)", fontWeight: 450, fontSize: 13.5 }
                        }
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
                            (e.currentTarget as HTMLElement).style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
                          }
                        }}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar foot */}
        <div
          className="relative z-10 flex items-center gap-[10px] px-[10px] py-[14px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.16)" }}
        >
          <div
            className="flex-shrink-0 grid place-items-center rounded-[9px] font-semibold"
            style={{ width: 30, height: 30, background: "rgba(255,255,255,0.18)", color: "#ffffff", fontSize: 12 }}
          >
            M
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-[1.25]">
              <b className="block" style={{ color: "#ffffff", fontSize: 12.5, fontWeight: 550 }}>Marita</b>
              <span className="block" style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Operador</span>
            </div>
          )}
        </div>
      </aside>

      {/* Botón colapso fuera del sidebar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        className="absolute top-[22px] -right-3 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-border shadow-sm hover:shadow-md transition-shadow"
        style={{ color: "#C8102E" }}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
