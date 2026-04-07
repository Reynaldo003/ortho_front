// src/components/RehabVideosSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { rehabVideos } from "../data/rehabVideos";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function getYoutubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function VideoModal({ open, onClose, video }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !video) return null;

  const isShort = video.format === "short";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video de rehabilitación"
    >
      <div className="flex h-full items-center justify-center p-3 sm:p-6">
        <div
          className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-[90vh] overflow-y-auto">
            {/* Header sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1220]/95 px-4 py-3 backdrop-blur">
              <div className="min-w-0">
                <p className="truncate text-sm text-white/70">{video.category}</p>
                <h3 className="truncate text-base font-semibold text-white">
                  {video.title}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              {/* 
                Para que el SHORT se vea COMPLETO:
                - Lo metemos en un contenedor vertical
                - con ancho máximo y centrado
                - y en pantallas chicas le damos max-height para que no se salga
              */}
              <div
                className={cn(
                  "mx-auto overflow-hidden rounded-xl bg-black/40",
                  isShort
                    ? "w-full max-w-[420px] aspect-[9/16] max-h-[70vh]"
                    : "w-full aspect-video"
                )}
              >
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {video.desc ? (
                <p className="mt-4 text-sm text-white/70">{video.desc}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ video, onOpen }) {
  const isShort = video.format === "short";
  const thumb = getYoutubeThumb(video.youtubeId);

  return (
    <button
      type="button"
      onClick={() => onOpen(video)}
      className={cn(
        "group text-left",
        "rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm",
        "transition hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-black/40",
          isShort ? "aspect-[9/16]" : "aspect-video"
        )}
      >
        <img
          src={thumb}
          alt={video.title}
          className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03] group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid place-items-center rounded-full border border-white/15 bg-black/35 p-4 backdrop-blur-sm transition group-hover:bg-black/45">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M9 7l10 5-10 5V7z" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
          {video.category}
        </div>
      </div>

      <div className="px-1 pb-1 pt-3">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-white">
          {video.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/70">{video.desc}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Ver video
          </span>
          <span className="text-xs text-white/50">{isShort ? "Short" : "Video"}</span>
        </div>
      </div>
    </button>
  );
}

export default function RehabVideosSection() {
  const [active, setActive] = useState("Todos");
  const [openVideo, setOpenVideo] = useState(null);

  // Carrusel
  const scrollerRef = useRef(null);

  const categories = useMemo(() => {
    const set = new Set(rehabVideos.map((v) => v.category));
    return ["Todos", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    if (active === "Todos") return rehabVideos;
    return rehabVideos.filter((v) => v.category === active);
  }, [active]);

  const scrollByCards = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const cardWidth = card ? card.getBoundingClientRect().width : 280;
    const gap = 16; // gap-4
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: "smooth" });
  };

  return (
    <section id="ejercicios" className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              Biblioteca de ejercicios
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Ejercicios y rehabilitación en casa
            </h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Videos compartidos por la clínica para acompañar tu proceso. Realízalos
              solo si tu especialista te los indicó.
            </p>
          </div>
        </div>


        {/* ✅ Mobile/Small: carrusel con flechas */}
        <div className="lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-white/60">Desliza o usa las flechas</p>

            <div className="flex gap-2">
              <button
                onClick={() => scrollByCards(-1)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10"
                aria-label="Anterior"
              >
                ←
              </button>
              <button
                onClick={() => scrollByCards(1)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10"
                aria-label="Siguiente"
              >
                →
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              No hay videos en esta categoría todavía.
            </div>
          ) : (
            <div
              ref={scrollerRef}
              className={cn(
                "flex gap-4 overflow-x-auto pb-2",
                "snap-x snap-mandatory scroll-smooth",
                // Oculta scrollbar fea en algunos navegadores (opcional)
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              )}
            >
              {filtered.map((v) => (
                <div
                  key={v.id}
                  data-card
                  className="snap-start shrink-0 w-[78%] sm:w-[52%]"
                >
                  <VideoCard video={v} onOpen={setOpenVideo} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Desktop: grid */}
        <div className="hidden lg:block">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              No hay videos en esta categoría todavía.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <VideoCard key={v.id} video={v} onOpen={setOpenVideo} />
              ))}
            </div>
          )}
        </div>

        <p className="mt-10 text-sm text-white/50">
          *Este contenido es informativo y de apoyo. No sustituye una valoración
          profesional. Suspende si hay dolor agudo y consulta a tu especialista.
        </p>
      </div>

      <VideoModal
        open={Boolean(openVideo)}
        video={openVideo}
        onClose={() => setOpenVideo(null)}
      />
    </section>
  );
}
