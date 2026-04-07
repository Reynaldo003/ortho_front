import { useEffect, useState } from "react";
import heroXray from "../assets/hero-xray.png";

export default function Hero() {
  const [showBrandStatic, setShowBrandStatic] = useState(false);
  const [showTitleStatic, setShowTitleStatic] = useState(false);

  useEffect(() => {
    const brandTimer = setTimeout(() => {
      setShowBrandStatic(true);
    }, 2200);

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
      className="relative overflow-hidden bg-cover bg-center min-h-[560px] md:min-h-[640px] uw:min-h-[720px]"
      style={{
        backgroundImage: `url(${heroXray})`,
        backgroundPosition: "60% 40%",
      }}
    >
      <div
        className="relative z-10 container max-w-9xl uw:max-w-10xl
                pt-28 md:pt-36 uw:pt-44
                pb-12 md:pb-16
                safe-px"
      >
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="mt-16 font-extrabold tracking-tight text-fluid-5xl text-[#2FD0D8] min-h-[72px] md:min-h-[88px]">
              {showBrandStatic ? (
                <span className="inline-block align-bottom pr-3">
                  ORTHO CLINIC
                </span>
              ) : (
                <span
                  className="
                    inline-block align-bottom
                    overflow-hidden whitespace-nowrap
                    border-r-4 border-r-[#2FD0D8]/80 pr-3
                    animate-heroBrand animate-blinkSoft
                    [will-change:clip-path]
                  "
                >
                  ORTHO CLINIC
                </span>
              )}
            </h1>

            <h2 className="mt-6 md:mt-8 uw:mt-10 font-extrabold tracking-tight text-fluid-5xl text-white min-h-[120px] md:min-h-[150px]">
              {showTitleStatic ? (
                <span className="inline-block align-bottom pr-4">
                  Traumatología y ortopedia, rehabilitación y terapia física
                </span>
              ) : (
                <span
                  className="
                    inline-block align-bottom
                    overflow-hidden
                    border-r-4 border-r-white/80 pr-4
                    animate-heroType animate-blinkSoft
                    [will-change:clip-path]
                  "
                >
                  Traumatología y ortopedia, rehabilitación y terapia física
                </span>
              )}
            </h2>

            <p className="mt-4 text-base md:text-lg text-slate-100 max-w-prose animate-fadeUp">
              Médicos especialistas y licenciados en fisioterapia listos para atenderte,
              agenda tu cita con el profesional adecuado
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#equipo"
                className="
                  group relative inline-flex items-center justify-center gap-2
                  px-9 py-3
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
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}