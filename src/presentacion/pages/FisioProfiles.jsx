// src/pages/FisioProfiles.jsx
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, BadgeCheck, Users } from "lucide-react";
import { STAFF } from "../data/staff";

export default function FisioProfiles() {
  const physios = STAFF.filter((p) => (p.role || "").includes("Fisioterapeuta"));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),transparent_60%),radial-gradient(circle_at_bottom,_rgba(37,99,235,0.28),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/#equipo"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <header className="mt-6 rounded-3xl bg-slate-900/70 p-6 ring-1 ring-white/10 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Conoce a nuestro equipo de fisioterapia</h1>
              <p className="mt-1 text-sm text-slate-300">
                Profesionales certificados que trabajan en conjunto.
              </p>
            </div>



            <div className="flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs text-slate-200 ring-1 ring-sky-500/30">
              <Users className="h-3.5 w-3.5 text-sky-400" />
              {physios.length} fisioterapeuta{physios.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-sky-500/10 p-4 ring-1 ring-sky-400/20">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm text-slate-200">
                  El fisioterapeuta asignado dependerá de tu valoración médica y disponibilidad del equipo.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Puedes consultar el CV de cada integrante del equipo.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Lista simple, elegante (sin tarjetas tipo doctor) */}
        <section className="mt-6 space-y-4">
          {physios.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-white/10"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">{p.role}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {p.bio || "Fisioterapeuta certificado en rehabilitación y terapia funcional."}
                    </p>

                    {Array.isArray(p.badges) && p.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.badges.slice(0, 6).map((b, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-slate-950/60 px-3 py-1 text-[11px] text-slate-200 ring-1 ring-white/10"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to={`/doctor/${p.slug}`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-950/70 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-slate-950"
                  >
                    Ver perfil
                  </Link>

                  <a
                    href={p.cvUrl || "#"}
                    target={p.cvUrl ? "_blank" : undefined}
                    rel={p.cvUrl ? "noreferrer" : undefined}
                    onClick={(e) => {
                      if (!p.cvUrl) e.preventDefault();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 ring-1 ring-sky-400/30 hover:bg-sky-500/20"
                    title={p.cvUrl ? "Abrir CV" : "Aún no hay CV cargado"}
                  >
                    <FileText className="h-4 w-4" />
                    Ver CV
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
