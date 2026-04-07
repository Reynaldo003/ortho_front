// src/components/ServicesShowcase.jsx
import { useMemo, useState } from "react";
import {
  Stethoscope,
  Activity,
  Syringe,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  ClipboardList,
  HeartPulse,
} from "lucide-react";

const SERVICES = [
  {
    key: "consultas",
    title: "Consultas médicas",
    subtitle: "Valoración y seguimiento",
    desc:
      "Atención por especialistas en ortopedia y traumatología. Evaluación integral, diagnóstico y plan de tratamiento claro.",
    bullets: ["Historia clínica y exploración", "Plan diagnóstico", "Ajuste de tratamiento"],
    cta: { label: "Agendar consulta", href: "#equipo" },
    image: "/Consultas.png",
    Icon: Stethoscope,
    chips: ["Ortopedia y trauma", "Plan personalizado", "Seguimiento"],
    steps: [
      { title: "Valoración", desc: "Exploración clínica + revisión de estudios." },
      { title: "Diagnóstico", desc: "Hipótesis clara y ruta de tratamiento." },
      { title: "Plan", desc: "Objetivos y seguimiento para medir progreso." },
    ], 
  },
  {
    key: "rehab",
    title: "Rehabilitación",
    subtitle: "Funcional y deportiva",
    desc:
      "Fisioterapia basada en evidencia para recuperar movilidad, fuerza y rendimiento, con progresión segura y medible.",
    bullets: ["Readaptación funcional", "Neuromodulación", "Prevención de recaídas"],
    cta: { label: "Agendar fisioterapia", href: "#equipo" },
    image: "/Rehabilitacion.png",
    Icon: Activity,
    chips: ["Basado en evidencia", "Retorno al deporte", "Control de dolor"],
    steps: [
      { title: "Evaluación", desc: "Dolor, movilidad y objetivos del paciente." },
      { title: "Progresión", desc: "Carga gradual: movilidad → fuerza → función." },
      { title: "Alta segura", desc: "Criterios claros para volver a actividad." },
    ],
  },
  {
    key: "procedimientos",
    title: "Procedimientos",
    subtitle: "Mínima invasión",
    desc:
      "Técnicas ambulatorias para aliviar dolor y mejorar función con tiempos cortos de recuperación, según indicación médica.",
    bullets: ["Infiltración guiada", "Artroscopia", "Control de dolor e inflamación"],
    cta: { label: "Solicitar información", href: "#contacto" },
    image: "/Procedimiento.png",
    Icon: Syringe,
    chips: ["Ambulatorio", "Recuperación rápida", "Enfoque preciso"],
    steps: [
      { title: "Criterio", desc: "Indicaciones y beneficios explicados con claridad." },
      { title: "Procedimiento", desc: "Técnica segura con control y cuidado." },
      { title: "Recuperación", desc: "Guía + rehabilitación para volver mejor." },
    ],
  },
];

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  );
}

/**
 * Card pro con "blob" animado tipo Uiverse, adaptado a tu UI.
 * - No cambiamos paleta: el blob usa cyan suave y el bg respeta tus capas.
 * - Tiene hover sutil y respeta reduced-motion.
 */
function ProBlobCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "pro-card group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-white/5",
        "transition-transform duration-300 will-change-transform",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_80px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {/* “bg” interno (glass) */}
      <div className="pro-bg pointer-events-none absolute inset-[6px] rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl" />

      {/* “blob” animado */}
      <div className="pro-blob pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-xl" />

      {/* contenido real arriba */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <ProBlobCard className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/20">
          {Icon ? <Icon className="h-5 w-5 text-cyan-300" /> : null}
        </span>
        <div>
          <p className="text-xs text-white/60">{label}</p>
          <p className="text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </ProBlobCard>
  );
}

export default function ServicesShowcase() {
  const [activeKey, setActiveKey] = useState("consultas");

  const active = useMemo(
    () => SERVICES.find((s) => s.key === activeKey) ?? SERVICES[0],
    [activeKey]
  );

  return (
    <section id="servicios" className="py-14 md:py-16">
      {/* CSS local para animación tipo Uiverse (sin tocar tailwind config) */}
      <style>{`
        @keyframes pro-blob-bounce {
          0%   { transform: translate(-100%, -100%) translate3d(0, 0, 0); }
          25%  { transform: translate(-100%, -100%) translate3d(110%, 0, 0); }
          50%  { transform: translate(-100%, -100%) translate3d(110%, 110%, 0); }
          75%  { transform: translate(-100%, -100%) translate3d(0, 110%, 0); }
          100% { transform: translate(-100%, -100%) translate3d(0, 0, 0); }
        }
        .pro-blob {
          animation: pro-blob-bounce 6s infinite ease-in-out;
          opacity: 1;
        }
        /* Hover: un poquito más vivo, sin cambiar colores */
        .pro-card:hover .pro-blob {
          filter: blur(18px);
        }
        /* Accesibilidad: respeta reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .pro-blob { animation: none; }
          .pro-card { transition: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4">
        {/* Header premium */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Servicios
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Atención integral para tu recuperación
          </h2>
          <p className="mt-2 max-w-2xl text-white/70">
            Atención médica, rehabilitación y procedimientos. Todo con enfoque clínico y
            seguimiento para que sepas exactamente qué sigue.
          </p>
        </div>

        {/* Tabs mobile (pills) */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICES.map((s) => {
            const isActive = s.key === activeKey;
            return (
              <button
                key={s.key}
                onClick={() => setActiveKey(s.key)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-cyan-400/30 bg-cyan-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {s.title}
              </button>
            );
          })}
        </div>

        {/* Desktop layout: selector + panel */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Selector desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2">
              {SERVICES.map((s) => {
                const isActive = s.key === activeKey;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveKey(s.key)}
                    className={cn(
                      "relative w-full rounded-xl p-4 text-left transition",
                      "border border-transparent",
                      isActive ? "bg-white/10 border-white/10" : "hover:bg-white/5"
                    )}
                  >
                    {/* indicador activo */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full transition",
                        isActive ? "bg-cyan-400/80" : "bg-transparent"
                      )}
                    />

                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-xl border",
                          isActive
                            ? "border-cyan-400/30 bg-cyan-500/15"
                            : "border-white/10 bg-black/20"
                        )}
                      >
                        <s.Icon
                          className={cn("h-5 w-5", isActive ? "text-cyan-300" : "text-white/70")}
                        />
                      </span>

                      <div className="min-w-0">
                        <p className={cn("font-semibold", isActive ? "text-white" : "text-white/85")}>
                          {s.title}
                        </p>
                        <p className="mt-1 text-sm text-white/60">{s.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-white/50">
              Selecciona un servicio para ver detalles, proceso y siguientes pasos.
            </p>
          </div>

          {/* Panel premium */}
          <div className="lg:col-span-8">
            <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {/* Imagen + overlay */}
              <div className="relative h-56 w-full md:h-64">
                <img
                  key={active.image} // fuerza refresh suave al cambiar
                  src={active.image}
                  alt={active.title}
                  className="h-full w-full object-cover opacity-95"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-black/10 to-transparent" />

                {/* chips */}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {active.chips?.map((m) => (
                    <Pill key={m}>{m}</Pill>
                  ))}
                </div>

                {/* “badge” top-right */}
                <div className="absolute right-4 top-4 hidden sm:block">
                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    {active.subtitle}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{active.title}</h3>
                    <p className="mt-1 text-sm text-white/60">{active.subtitle}</p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                    <active.Icon className="h-5 w-5 text-cyan-300" />
                  </span>
                </div>

                <p className="mt-4 max-w-prose text-white/75">{active.desc}</p>

                {/* bullets */}
                <ul className="mt-6 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                  {active.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <span className="leading-5">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* proceso (más pro con cards animadas) */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Cómo trabajamos
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {active.steps?.map((st) => (
                      <ProBlobCard
                        key={st.title}
                        className={cn(
                          "p-4",
                          "transition-all duration-300",
                          "hover:border-white/15"
                        )}
                      >
                        <p className="text-sm font-semibold text-white">{st.title}</p>
                        <p className="mt-1 text-sm text-white/65">{st.desc}</p>

                        {/* detalle pro: microlinea inferior, sin cambiar paleta */}
                        <div className="mt-4 h-px w-full bg-white/10" />
                        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                          <span>Proceso</span>
                          <span className="text-cyan-300/80">Verificado</span>
                        </div>
                      </ProBlobCard>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={active.cta.href}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    {active.cta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>

                  <a
                    href="#ejercicios"
                    className="text-center text-sm text-cyan-300 hover:text-cyan-200"
                  >
                    Ver ejercicios de rehabilitación →
                  </a>
                </div>
              </div>

              {/* Glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
              />
            </article>
          </div>
        </div>

        {/* Métricas (credibilidad) con el mismo estilo pro */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric icon={ClipboardList} label="Proceso" value="Evaluación → plan → seguimiento" />
          <Metric icon={HeartPulse} label="Enfoque" value="Función, dolor y retorno seguro" />
          <Metric icon={Sparkles} label="Atención" value="Clara, humana y basada en evidencia" />
        </div>
      </div>
    </section>
  );
}