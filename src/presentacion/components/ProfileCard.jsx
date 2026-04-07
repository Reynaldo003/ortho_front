// src/presentacion/components/ProfileCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import BookingModal from "./BookingModal";
import {
  Stethoscope,
  GraduationCap,
  BadgeCheck,
  CheckCircle2,
  CalendarClock,
  MapPin,
  Clock,
  Award,
  Star,
  Sparkles,
  Eye,
} from "lucide-react";

export default function ProfileCard({ person }) {
  const [open, setOpen] = useState(false);

  const short =
    person?.shortName ?? person?.name?.split(" ")?.[0] ?? "Doctor/a";

  const TopIcon =
    (person?.role || "").toLowerCase().includes("médico") ||
      (person?.role || "").toLowerCase().includes("ortop")
      ? Stethoscope
      : GraduationCap;

  const rating = clamp(person?.rating ?? 5, 0, 5);
  const years = person?.years ?? 5;
  const location = person?.location ?? "Córdoba, Ver.";

  return (
    <>
      <article
        className={cn(
          // ✅ nuevo efecto
          "uiverse-glow group relative",
          // tu card original intacto
          "rounded-2xl border border-white/10 bg-slate-900/60 ring-1 ring-white/10 shadow-lg backdrop-blur",
          "transition hover:-translate-y-0.5 hover:shadow-xl hover:ring-white/20"
        )}
      >
        {/* contenido arriba del glow */}
        <div className="relative z-10">
          {/* Decoración */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[conic-gradient(at_top_left,_theme(colors.cyan.400),_theme(colors.blue.600),_transparent_70%)] opacity-20 blur-3xl transition group-hover:opacity-30"
          />

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={person?.photo}
                  alt={person?.name}
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/20"
                  loading="lazy"
                />
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white ring-2 ring-slate-900">
                  <TopIcon className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0">
                <h4 className="truncate text-lg font-semibold text-white">
                  {person?.name}
                </h4>
                <p className="truncate text-slate-300">{person?.role}</p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-slate-300/90">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-300" />
                    {years} años exp.
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                    {location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-300" />
                    {rating.toFixed(1)} / 5
                  </span>
                </div>

                {person?.badges?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {person.badges.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200 ring-1 ring-cyan-400/20"
                      >
                        <BadgeCheck className="h-3 w-3" />
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            {person?.services?.length > 0 && (
              <ul className="mt-4 grid gap-1.5 text-sm text-slate-200 sm:grid-cols-2">
                {person.services.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                    <span className="leading-5">{s}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Distintivos */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                <Award className="h-4 w-4 text-cyan-300" />
                Atención certificada
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {Math.max(120, years * 60)}+ pacientes/año
              </span>
            </div>

            {/* Botones */}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="col-span-3 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Agendar con {short}
              </button>

              {person?.slug && (
                <Link
                  to={`/doctor/${person.slug}`}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-500/40 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-sky-100 shadow-sm transition hover:border-sky-300 hover:bg-sky-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <Eye className="h-4 w-4" />
                  Ver perfil
                </Link>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-6 -bottom-4 h-5 rounded-full bg-black/30 blur-xl" />
        </div>
      </article>

      <BookingModal open={open} setOpen={setOpen} person={person} />
    </>
  );
}

function clamp(n, min, max) {
  const num = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, num));
}

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}