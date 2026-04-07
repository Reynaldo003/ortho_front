import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
      <div className="container max-w-9xl uw:max-w-10xl py-3 safe-px">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-28 w-auto" />
          </Link>

          {/* Frase centrada (solo desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-6">
            <span
              className="
                inline-block max-w-[680px]
                overflow-hidden pr-2
                border-r-2 border-r-red-500/70
                text-lg lg:text-2xl font-extrabold tracking-wide
                text-red-500
                animate-heroBrand animate-blinkSoft
                [will-change:clip-path]
                text-center
              "
              aria-label="Slogan"
            >
              Orgullo cordobés, ciencia y calidez
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#inicio"
              className="text-slate-600 dark:text-slate-300">
              Inicio
            </a>
            <a href="#equipo"
              className="text-slate-600 dark:text-slate-300">
              Equipo
            </a>
            <a href="#servicios" className="text-slate-600 dark:text-slate-300">
              Servicios
            </a>
            <a href="#ejercicios" className="text-slate-600 dark:text-slate-300">
              Ejercicios
            </a>
            <a href="#ubicacion" className="text-slate-600 dark:text-slate-300">
              Contacto
            </a>
          </nav>

          {/* Mobile toggler */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Frase en móvil (debajo, centrada) */}
        <div className="md:hidden mt-1 flex justify-center">
          <span
            className="
              inline-block max-w-[92%]
              overflow-hidden pr-2
              border-r-2 border-r-red-500/70
              text-[14px] font-extrabold tracking-wide
              text-red-500
              animate-heroBrand animate-blinkSoft
              [will-change:clip-path]
              text-center
            "
            aria-label="Slogan móvil"
          >
            Orgullo cordobés, ciencia y calidez
          </span>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden mt-3 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
            <a
              href="/"
              className="block px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Inicio
            </a>
            <a
              href="#equipo"
              className="block px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Equipo
            </a>
            <a
              href="#servicios"
              className="block px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Servicios
            </a>
            <a
              href="#ubicacion"
              className="block px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Contacto
            </a>
            <Link
              to="/book/dr-hernandez"
              className="btn btn-primary w-full justify-center"
            >
              Agendar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}