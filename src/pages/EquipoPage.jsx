import { Link } from "react-router-dom";
import Equipo from "@/components/Equipo";
import { HeartHandshake, BadgeCheck, Activity, ArrowRight } from "lucide-react";

export default function EquipoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      {/* Intro */}

      {/* Componente interactivo */}
      <Equipo
        title={
          <span className="text-white">
            Conoce al equipo
          </span>
        }
        subtitle={
          <span className="text-slate-200">
            Toca un perfil para ver más detalles. (Interacción ligera, ideal para salud)
          </span>
        }
      />

      {/* CTA secundaria */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              ¿Quieres ver tratamientos?
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Conoce los servicios y elige el enfoque que más se adapte a tu caso.
            </p>
          </div>

          <Link
            to="/servicios"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/15"
          >
            Ver tratamientos
          </Link>
        </div>
      </section>
    </div>
  );
}