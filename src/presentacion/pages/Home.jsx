// src/pages/Home.jsx
import Hero from "../components/Hero";
import ProfileCard from "../components/ProfileCard";
import { STAFF } from "../data/staff";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import ServicesShowcase from "../components/ServicesShowcase";
import MapSection from "../components/MapSection";
import { Users, ArrowRight } from "lucide-react";

import RehabVideosSection from "../components/RehabVideosSection";


export default function Home() {
  const doctors = STAFF.filter((p) => (p.role || "").includes("Médico"));

  return (
    <>
      <Hero />

      {/* Conoce al equipo */}
      <section id="equipo" className="py-14 md:py-16 uw:py-20">
        <div className="container max-w-9xl uw:max-w-10xl safe-px">
          <h2 className="font-bold tracking-tight text-fluid-4xl text-slate-300">Conoce al equipo</h2>
          <p className="mt-2 max-w-prose text-slate-600 dark:text-slate-300">
            Dos médicos ortopedistas y un área de fisioterapia.
          </p>

          {/* ===================== DOCTORES ===================== */}
          <h3 className="mt-8 mb-3 font-semibold text-slate-200">Doctores</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {doctors.map((p) => (
              <ProfileCard key={p.id} person={p} />
            ))}
          </div>

          <div className="mt-10">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-200">Fisioterapia</h3>
                <p className="mt-1 text-sm text-slate-300">
                  La agenda se maneja por tipo de servicio.
                </p>

              </div>
              <a
                href="/fisioterapia/equipo"
                className="
    group relative inline-flex items-center justify-center gap-2
    px-7 py-3
    rounded-2xl hover:rounded-3xl
    border border-white/15 ring-1 ring-white/10
    bg-slate-950/60 backdrop-blur
    text-sm font-semibold text-white
    overflow-hidden
    transition-all duration-700
    hover:text-slate-950
    hover:-translate-y-0.5 hover:shadow-2xl
    active:translate-y-0
  "
              >
                {/* Flecha izquierda (entra) */}
                <svg
                  viewBox="0 0 24 24"
                  className="
      absolute w-5 z-[9]
      fill-white
      transition-all duration-700
      -left-1/4
      group-hover:left-4
      group-hover:fill-slate-950
    "
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                </svg>

                {/* Texto */}
                <span
                  className="
      relative z-[10]
      transition-all duration-700
      -translate-x-3
      group-hover:translate-x-3
      inline-flex items-center gap-2
    "
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 ring-1 ring-sky-400/25 transition group-hover:bg-white/30">
                    <Users className="h-4 w-4 text-sky-300 group-hover:text-slate-950 transition-colors duration-700" />
                  </span>

                  <span className="leading-none text-left">
                    <span className="block text-[11px] font-semibold text-slate-300/90 group-hover:text-slate-950/80 transition-colors duration-700">
                      Conoce al
                    </span>
                    <span className="block font-semibold tracking-tight">
                      Equipo de fisioterapia
                    </span>
                  </span>

                  <ArrowRight className="h-4 w-4 text-slate-200/90 transition duration-700 group-hover:translate-x-0.5 group-hover:text-slate-950" />
                </span>

                {/* Burbuja (fondo animado) */}
                <span
                  className="
      absolute left-1/2 top-1/2
      -translate-x-1/2 -translate-y-1/2
      h-5 w-5 rounded-full opacity-0
      transition-all duration-700
      group-hover:opacity-100
      group-hover:h-[260px] group-hover:w-[260px]
      bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.95),rgba(37,99,235,0.85))]
    "
                  aria-hidden="true"
                />

                {/* Flecha derecha (sale) */}
                <svg
                  viewBox="0 0 24 24"
                  className="
      absolute w-5 z-[9]
      fill-white
      transition-all duration-700
      right-4
      group-hover:-right-1/4
      group-hover:fill-slate-950
    "
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                </svg>

                {/* capa interna para consistencia */}
                <span
                  className="pointer-events-none absolute inset-[1px] rounded-2xl bg-slate-950/75 group-hover:bg-transparent transition-colors duration-700"
                  aria-hidden="true"
                />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Card 1 */}
              <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      Activación física para adultos mayores
                    </h4>
                    <p className="mt-1 text-sm text-slate-300">
                      Movilidad, equilibrio, fuerza suave, acondicionamiento físico y prevención de caídas.
                    </p>
                  </div>

                  <a
                    href="/agenda/fisioterapia?tipo=adulto-mayor"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-sky-400"
                  >
                    Agendar
                  </a>
                </div>
                <p className="mt-3 text-[12px] text-slate-400">
                  * Requisito: para iniciar terapia es necesario haber pasado primero por una{" "}
                  <span className="text-slate-200 font-semibold">
                    valoración médica de Ortopedia/Traumatología
                  </span>{" "}
                  (interna o externa).
                </p>


                <div className="mt-4 rounded-xl bg-slate-950/50 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-semibold text-white">Incluye</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>• Rutinas guiadas y progresivas según condición</li>
                    <li>• Ejercicios para equilibrio y coordinación</li>
                    <li>• Fortalecimiento y movilidad articular</li>
                    <li>• Recomendaciones para actividades diarias</li>
                  </ul>
                </div>
              </section>

              {/* Card 2 */}
              <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      Fisioterapia general y funcional
                    </h4>
                    <p className="mt-1 text-sm text-slate-300">
                      Rehabilitación, terapia manual, readaptación, electroterapia y recuperación funcional.
                    </p>
                  </div>

                  <a
                    href="/agenda/fisioterapia?tipo=funcional"
                    className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-sky-400"
                  >
                    Agendar
                  </a>
                </div>
                <p className="mt-3 text-[12px] text-slate-400">
                  * Requisito: para iniciar terapia es necesario haber pasado primero por una{" "}
                  <span className="text-slate-200 font-semibold">
                    valoración médica de Ortopedia/Traumatología
                  </span>{" "}
                  (interna o externa).
                </p>


                <div className="mt-4 rounded-xl bg-slate-950/50 p-4 ring-1 ring-white/10">
                  <p className="text-sm font-semibold text-white">Incluye</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>• Evaluación funcional y objetivos por sesión</li>
                    <li>• Terapia manual y liberación miofascial</li>
                    <li>• Fortalecimiento, estabilidad y movilidad</li>
                    <li>• Plan de ejercicios para casa</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios (anuncios) */}
      <ServicesShowcase />

      <RehabVideosSection />

      {/* Testimonios */}
      <Testimonials />

      {/* Preguntas frecuentes */}
      <FAQ />

      {/* Mapa / Ubicación */}
      <MapSection />
    </>
  );
}
