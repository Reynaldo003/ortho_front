import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { STAFF } from "../data/staff";
import SchedulePicker from "../components/SchedulePicker";

export default function Book() {
  const { slug } = useParams(); // ruta tipo /book/:slug
  const person = useMemo(() => {
    if (!slug) return null;
    return STAFF.find((p) => p.slug === slug) ?? null;
  }, [slug]);

  if (!person) {
    return (
      <div className="container safe-px py-12">
        <h1 className="text-2xl font-bold">Profesional no encontrado</h1>
        <p className="mt-2 text-slate-600">Verifica el enlace o regresa al equipo.</p>
        <Link className="btn btn-ghost mt-4" to="/#equipo">
          Ver equipo
        </Link>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container safe-px py-12">
        {/* Cabecera */}
        <div className="grid items-start gap-10 md:grid-cols-[1fr,420px]">
          <div>
            <div className="flex items-center gap-4">
              <img
                src={person.photo}
                alt={person.name}
                className="size-16 rounded-xl object-cover ring-1 ring-black/5"
              />
              <div>
                <h1 className="text-2xl font-bold">{person.name}</h1>
                <p className="text-slate-600 dark:text-slate-300">{person.role}</p>
              </div>
            </div>

            <div className="mt-6 max-w-prose space-y-3 text-slate-700 dark:text-slate-300">
              {(person.description ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(person.badges ?? []).map((b, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 aspect-video overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
              {person.videoUrl ? (
                <iframe
                  className="h-full w-full"
                  src={person.videoUrl}
                  title={person.name}
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="grid h-full place-items-center text-slate-500 text-sm">
                  Video no disponible
                </div>
              )}
            </div>
          </div>

          {/* Lado derecho: agendar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Agenda tu cita</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Selecciona servicio, fecha y horario disponibles.
            </p>
            <div className="mt-4">
              <SchedulePicker person={person} />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Link to="/#equipo" className="btn btn-ghost">
            ← Volver al equipo
          </Link>
        </div>
      </div>
    </section>
  );
}
