import { Facebook, Instagram, Youtube, MapPin, Clock } from "lucide-react";

export default function Footer() {
  const ABOUT = {
    title: "Ortho Clinic Córdoba",
    blurb:
      "Atención ortopédica y rehabilitación basada en evidencia, con especialistas y equipamiento de vanguardia.",
    address: "Córdoba, Veracruz, México",
  };

  const HOURS = {
    weekday: "Lun – Vie · 9:00 – 20:00",
    saturday: "Sáb · 9:00 – 14:00",
  };

  const SOCIAL = {
    youtube: "https://youtube.com/@tucanal",
    facebook: "https://www.facebook.com/share/1BRnDEuCZz/",
    instagram:
      "https://www.instagram.com/orthocliniccordoba?igsh=MWNhcmg3cnV6MXo5Ng==",
  };

  const TAGLINE =
    "Cuidamos tu movilidad y rendimiento con tratamientos personalizados y mínima invasión.";

  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-4">
            <h4 className="text-2xl font-semibold text-white">{ABOUT.title}</h4>

            <p className="max-w-md text-base leading-8 text-slate-400">
              {ABOUT.blurb}
            </p>

            <div className="flex items-start gap-3 text-base text-slate-400">
              <MapPin className="mt-1 h-5 w-5 shrink-0" />
              <span>{ABOUT.address}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-2xl font-semibold text-white">Horarios</h5>

            <div className="space-y-3 text-base text-slate-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-slate-300" />
                <span>{HOURS.weekday}</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-slate-300" />
                <span>{HOURS.saturday}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-5 lg:items-center lg:text-center">
            <img
              src="/logo.png"
              alt="Logo de la clínica"
              className="h-24 w-auto object-contain sm:h-28 lg:h-32"
            />

            <p className="max-w-sm text-base leading-8 text-slate-400">
              {TAGLINE}
            </p>

            <div className="flex items-center gap-3">
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>

              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-200 transition hover:-translate-y-0.5 hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>

              <a
                href={SOCIAL.youtube}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-200 transition hover:-translate-y-0.5 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Desarrollado por:</span>
              <a
                href="https://www.instagram.com/robots.dev"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <img
                  src="/RObots.png"
                  alt="RObots"
                  className="h-7 w-auto rounded-sm object-contain ring-1 ring-white/10"
                />
              </a>
              <span className="font-medium text-slate-200">RObots</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}