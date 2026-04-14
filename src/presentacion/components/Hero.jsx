import { useEffect, useState } from "react";
import heroXray from "../assets/hero-xray.png";

export default function Hero() {
  const [showBrandStatic, setShowBrandStatic] = useState(false);
  const [showTitleStatic, setShowTitleStatic] = useState(false);

  useEffect(() => {
    const brandTimer = setTimeout(() => {
      setShowBrandStatic(true);
    }, 1800);

    const titleTimer = setTimeout(() => {
      setShowTitleStatic(true);
    }, 3200);

    return () => {
      clearTimeout(brandTimer);
      clearTimeout(titleTimer);
    };
  }, []);

  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-cover bg-center min-h-[560px] sm:min-h-[620px] md:min-h-[700px] uw:min-h-[760px]"
      style={{
        backgroundImage: `url(${heroXray})`,
        backgroundPosition: "62% 40%",
      }}
    >
      {/* Capa oscura para contraste */}
      <div className="absolute inset-0 bg-slate-950/45" />

      {/* Gradientes para mejorar lectura */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.58)_36%,rgba(2,6,23,0.18)_58%,rgba(2,6,23,0.34)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(15,118,190,0.18),transparent_34%)]" />

      <div
        className="relative z-10 container max-w-9xl uw:max-w-10xl safe-px
                   pt-28 sm:pt-32 md:pt-36 uw:pt-44
                   pb-14 sm:pb-16 md:pb-20"
      >
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 xl:col-span-6">
            {/* Marca animada */}
            <div className="min-h-[40px] sm:min-h-[48px]">
              {showBrandStatic ? (
                <p className="inline-block align-bottom text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#2FD0D8]">
                  ORTHO CLINIC
                </p>
              ) : (
                <p
                  className="
                    inline-block align-bottom
                    overflow-hidden whitespace-nowrap
                    border-r-4 border-r-[#2FD0D8]/80 pr-3
                    text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#2FD0D8]
                    animate-heroBrand animate-blinkSoft
                    [will-change:clip-path]
                  "
                >
                  ORTHO CLINIC
                </p>
              )}
            </div>

            {/* H1 principal */}
            <div className="mt-5 sm:mt-6 md:mt-8 min-h-[150px] sm:min-h-[190px] md:min-h-[220px]">
              {showTitleStatic ? (
                <h1 className="max-w-4xl text-[2.25rem] leading-[1.02] sm:text-[3rem] md:text-[4rem] lg:text-[4.5rem] font-extrabold tracking-tight text-white">
                  Traumatología, ortopedia y rehabilitación física en Córdoba, Veracruz
                </h1>
              ) : (
                <h1
                  className="
                    inline-block max-w-4xl
                    overflow-hidden
                    border-r-4 border-r-white/80 pr-4
                    text-[2.25rem] leading-[1.02] sm:text-[3rem] md:text-[4rem] lg:text-[4.5rem]
                    font-extrabold tracking-tight text-white
                    animate-heroType animate-blinkSoft
                    [will-change:clip-path]
                  "
                >
                  Traumatología, ortopedia y rehabilitación física en Córdoba, Veracruz
                </h1>
              )}
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base md:text-lg animate-fadeUp">
              Atención con médicos especialistas y profesionales de fisioterapia
              para valoración, seguimiento, recuperación funcional y tratamiento
              personalizado.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#equipo"
                className="
                  group relative inline-flex items-center justify-center gap-2
                  px-7 sm:px-8 py-3
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

                <span
                  className="
                    relative z-[10]
                    transition-all duration-700
                    -translate-x-3
                    group-hover:translate-x-3
                    inline-flex items-center gap-2
                    text-white
                    group-hover:text-slate-950
                  "
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 ring-1 ring-sky-400/25">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-sky-300 group-hover:text-slate-950 transition-colors duration-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  Conoce al equipo
                </span>

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

                <span
                  className="pointer-events-none absolute inset-[1px] rounded-2xl bg-slate-950/75 group-hover:bg-transparent transition-colors duration-700"
                  aria-hidden="true"
                />
              </a>

              <a
                href="#servicios-home"
                className="
                  inline-flex items-center justify-center
                  rounded-2xl border border-white/15 bg-slate-950/35 px-7 py-3
                  text-sm font-semibold text-white backdrop-blur
                  transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10
                "
              >
                Ver servicios
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 animate-fadeUp">
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur">
                Traumatología y ortopedia
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur">
                Fisioterapia y rehabilitación
              </span>
              <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur">
                Córdoba, Veracruz
              </span>
            </div>
          </div>

          {/* Columna vacía para conservar el look del hero */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-6" />
        </div>
      </div>
    </section>
  );
}