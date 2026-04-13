import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Star,
  ShieldCheck,
  MessageSquare,
  User,
} from "lucide-react";
import RatingStars from "./RatingStars";
import {
  crearComentario,
  obtenerComentariosPublicos,
  obtenerProfesionalesPublicos,
} from "../lib/comentariosApi";

const FOTOS_FALLBACK = {
  "dr. martin buganza": "/MartinBuganza.png",
  "dr. miguel puig": "/MiguelPuig.png",
  "martin buganza": "/MartinBuganza.png",
  "miguel puig": "/MiguelPuig.png",
  "rehabilitacion general": "/Rehabilitacion.png",
  "acondicionamiento general": "/Rehabilitacion.png",
};

const SERVICIOS_PUBLICOS = [
  {
    uid: "servicio-publico-rehabilitacion_general",
    backendId: null,
    tipo_objetivo: "servicio",
    objetivo_publico: "rehabilitacion_general",
    name: "Rehabilitación general",
    role: "Terapia y rehabilitación física",
    photo: "/Rehabilitacion.png",
    tag: "Servicio",
  },
  {
    uid: "servicio-publico-acondicionamiento_general",
    backendId: null,
    tipo_objetivo: "servicio",
    objetivo_publico: "acondicionamiento_general",
    name: "Acondicionamiento general",
    role: "Activación física y adulto mayor",
    photo: "/Rehabilitacion.png",
    tag: "Servicio",
  },
];

function avg(arr) {
  if (!arr || !arr.length) return 0;
  return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function getDistribution(starsArr) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const s of starsArr || []) {
    const valor = clamp(Number(s) || 0, 1, 5);
    dist[valor] = (dist[valor] || 0) + 1;
  }

  return dist;
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerFotoFallback(nombre, tipo) {
  const clave = normalizeText(nombre);

  if (clave.includes("buganza")) {
    return "/MartinBuganza.png";
  }

  if (clave.includes("puig")) {
    return "/MiguelPuig.png";
  }

  if (clave.includes("rehabilitacion")) {
    return "/Rehabilitacion.png";
  }

  if (clave.includes("acondicionamiento")) {
    return "/Rehabilitacion.png";
  }

  if (FOTOS_FALLBACK[clave]) {
    return FOTOS_FALLBACK[clave];
  }

  return tipo === "servicio" ? "/Rehabilitacion.png" : "/logo.png";
}

function construirClaveObjetivo(tipoObjetivo, id) {
  return `${tipoObjetivo}-${id}`;
}

function construirClaveServicioPublico(slug) {
  return `servicio-publico-${slug}`;
}

function esDoctorPermitido(item) {
  const nombre = normalizeText(item?.nombre || "");
  return nombre.includes("miguel puig") || nombre.includes("martin buganza");
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
      {children}
    </span>
  );
}

function BarRow({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-10 items-center gap-1 text-xs text-white/70">
        <span>{label}</span>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      </div>

      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-amber-400/80"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="w-10 text-right text-xs text-white/60">{count}</div>
    </div>
  );
}

export default function Testimonials() {
  const [targets, setTargets] = useState([]);
  const [reviewsByTarget, setReviewsByTarget] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      setFeedback({ type: "", message: "" });

      const [profesionales, comentarios] = await Promise.all([
        obtenerProfesionalesPublicos(),
        obtenerComentariosPublicos(),
      ]);

      const doctoresPermitidos = (profesionales || []).filter(esDoctorPermitido);

      const targetsNormalizados = [
        ...doctoresPermitidos.map((item) => ({
          uid: construirClaveObjetivo("profesional", item.id),
          backendId: item.id,
          tipo_objetivo: "profesional",
          objetivo_publico: "",
          name: item.nombre,
          role: item.subtitulo || "Doctor",
          photo:
            item.foto_url || obtenerFotoFallback(item.nombre, "profesional"),
          tag: item.tag || "Doctor",
        })),
        ...SERVICIOS_PUBLICOS,
      ];

      const mapaBase = {};
      for (const target of targetsNormalizados) {
        mapaBase[target.uid] = { reviews: [] };
      }

      for (const item of comentarios || []) {
        let uid = "";

        if (item.tipo_objetivo === "profesional") {
          uid = construirClaveObjetivo("profesional", item.profesional);
        } else if (item.objetivo_publico) {
          uid = construirClaveServicioPublico(item.objetivo_publico);
        } else if (item.servicio) {
          uid = construirClaveObjetivo("servicio", item.servicio);
        }

        if (!uid || !mapaBase[uid]) continue;

        mapaBase[uid].reviews.push({
          id: item.id,
          rating: Number(item.calificacion || 0),
          comment: item.descripcion || "",
          author: item.nombre_completo || "Paciente anónimo",
          createdAt: item.created_at,
          targetPhoto: item.objetivo_foto_url || null,
        });
      }

      Object.keys(mapaBase).forEach((uid) => {
        mapaBase[uid].reviews.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });

      setTargets(targetsNormalizados);
      setReviewsByTarget(mapaBase);
      setSelectedId((prev) => {
        if (prev && targetsNormalizados.some((item) => item.uid === prev)) {
          return prev;
        }
        return targetsNormalizados[0]?.uid || "";
      });
    } catch (error) {
      console.error(error);
      setTargets([]);
      setReviewsByTarget({});
      setFeedback({
        type: "error",
        message:
          error.message ||
          "No se pudieron cargar las calificaciones y comentarios.",
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedTarget = useMemo(() => {
    return targets.find((item) => item.uid === selectedId) || null;
  }, [targets, selectedId]);

  const globalStats = useMemo(() => {
    const allReviews = Object.values(reviewsByTarget).flatMap(
      (item) => item.reviews || []
    );
    const allRatings = allReviews.map((r) => r.rating);
    const dist = getDistribution(allRatings);

    return {
      total: allReviews.length,
      avg: avg(allRatings),
      dist,
    };
  }, [reviewsByTarget]);

  const ranked = useMemo(() => {
    return targets
      .map((target) => {
        const reviews = reviewsByTarget[target.uid]?.reviews || [];
        const ratings = reviews.map((r) => r.rating);

        return {
          ...target,
          total: reviews.length,
          promedio: avg(ratings),
          reviews,
        };
      })
      .sort((a, b) => {
        if (b.promedio !== a.promedio) return b.promedio - a.promedio;
        return b.total - a.total;
      });
  }, [targets, reviewsByTarget]);

  const recentReviews = useMemo(() => {
    return targets
      .flatMap((target) => {
        const reviews = reviewsByTarget[target.uid]?.reviews || [];

        return reviews.map((review, index) => ({
          id: review.id || `${target.uid}-${index}-${review.createdAt}`,
          targetId: target.uid,
          targetName: target.name,
          targetTag: target.tag,
          targetPhoto:
            review.targetPhoto ||
            target.photo ||
            obtenerFotoFallback(target.name, target.tipo_objetivo),
          ...review,
        }));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [targets, reviewsByTarget]);

  async function handleSubmitReview() {
    const cleanComment = comment.trim();
    const cleanAuthor = author.trim();

    if (!selectedTarget || !stars || !cleanComment) return;

    try {
      setSending(true);
      setFeedback({ type: "", message: "" });

      const payload = {
        tipo_objetivo: selectedTarget.tipo_objetivo,
        descripcion: cleanComment,
        calificacion: stars,
        nombre_completo: cleanAuthor || "Paciente anónimo",
      };

      if (selectedTarget.tipo_objetivo === "profesional") {
        payload.profesional = selectedTarget.backendId;
      } else if (selectedTarget.objetivo_publico) {
        payload.objetivo_publico = selectedTarget.objetivo_publico;
      } else if (selectedTarget.backendId) {
        payload.servicio = selectedTarget.backendId;
      }

      await crearComentario(payload);

      setStars(0);
      setComment("");
      setAuthor("");
      setFeedback({
        type: "success",
        message:
          "¡Gracias! Tu reseña se envió a revisión. Cuando sea aprobada aparecerá publicada en la web.",
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message:
          error.message ||
          "No se pudo enviar tu comentario. Intenta nuevamente.",
      });
    } finally {
      setSending(false);
    }
  }

  const distTotal = globalStats.total;
  const d = globalStats.dist;

  return (
    <section id="testimonios" className="py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            Calificaciones y reseñas
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Experiencias de pacientes
          </h2>

          <p className="mt-2 max-w-2xl text-white/70">
            Califica al Dr. Puig, al Dr. Buganza o a un área general de servicio.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">Promedio general</p>

              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-bold tracking-tight text-white">
                  {globalStats.avg ? globalStats.avg.toFixed(1) : "—"}
                </div>

                <div className="pb-2">
                  <RatingStars value={globalStats.avg} readOnly size="lg" />
                  <p className="mt-1 text-xs text-white/60">
                    {distTotal
                      ? `${distTotal} reseña${distTotal === 1 ? "" : "s"} aprobada${distTotal === 1 ? "" : "s"}`
                      : "Aún no hay reseñas"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill>Dr. Puig</Pill>
                <Pill>Dr. Buganza</Pill>
                <Pill>Rehabilitación</Pill>
                <Pill>Acondicionamiento</Pill>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">
                  Distribución por estrellas
                </p>

                <p className="text-xs text-white/60">
                  {distTotal ? "Basado en reseñas" : "Sin reseñas aún"}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <BarRow label="5" count={d[5]} total={distTotal} />
                <BarRow label="4" count={d[4]} total={distTotal} />
                <BarRow label="3" count={d[3]} total={distTotal} />
                <BarRow label="2" count={d[2]} total={distTotal} />
                <BarRow label="1" count={d[1]} total={distTotal} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-1 gap-6 p-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Calificar y comentar
              </h3>

              <p className="mt-1 text-sm text-white/70">
                Tu comentario primero pasa a revisión administrativa y después,
                si se aprueba, se publica en la web.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    disabled={loading || !targets.length}
                    className="w-full appearance-none rounded-xl border-0 bg-black/30 py-3 pl-3 pr-10 text-sm text-white ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Selecciona doctor o servicio"
                  >
                    {!targets.length ? (
                      <option value="">
                        {loading
                          ? "Cargando opciones..."
                          : "No hay opciones disponibles"}
                      </option>
                    ) : (
                      targets.map((item) => (
                        <option key={item.uid} value={item.uid}>
                          {item.name} — {item.role}
                        </option>
                      ))
                    )}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-black/20 px-4 py-3 ring-1 ring-white/10">
                  <span className="text-sm text-white/70">Tu calificación:</span>
                  <RatingStars value={stars} onChange={setStars} size="lg" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full rounded-xl bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/35 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                  />
                </div>

                <div className="flex items-center text-xs text-white/50">
                  Si no escribes nombre, se enviará como paciente anónimo.
                </div>
              </div>

              <div className="mt-4 relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/40" />

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Escribe tu experiencia..."
                  className="w-full resize-none rounded-xl bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/35 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                />

                <div className="mt-2 text-right text-xs text-white/45">
                  {comment.length}/300
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmitReview}
                  disabled={
                    sending ||
                    loading ||
                    !selectedTarget ||
                    !stars ||
                    !comment.trim()
                  }
                  className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar reseña"}
                </button>
              </div>
            </div>
          </div>

          {!!feedback.message && (
            <div
              className={`border-t p-4 text-sm ${feedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-end justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-white">
              Calificaciones por doctor o área
            </h4>
            <p className="mt-1 text-sm text-white/70">
              Promedio, cantidad de reseñas aprobadas y satisfacción.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Cargando información...
          </div>
        ) : ranked.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/70">
              No hay opciones disponibles para calificar.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((item) => (
              <article
                key={item.uid}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10">
                    <img
                      src={item.photo || obtenerFotoFallback(item.name, item.tipo_objetivo)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = obtenerFotoFallback(item.name, item.tipo_objetivo);
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.name}
                      </p>

                      <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/60">
                        {item.tag}
                      </span>
                    </div>

                    <p className="truncate text-xs text-white/60">
                      {item.role}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <RatingStars value={item.promedio} readOnly size="sm" />
                      <span className="text-xs text-white/60">
                        {item.total
                          ? `${item.promedio.toFixed(1)}/5`
                          : "Sin calificaciones"}{" "}
                        · {item.total} reseña{item.total === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Satisfacción</span>
                    <span>
                      {item.total
                        ? `${Math.round((item.promedio / 5) * 100)}%`
                        : "—"}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/70"
                      style={{
                        width: `${item.total ? (item.promedio / 5) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-white">
              Comentarios y reseñas
            </h4>
            <p className="mt-1 text-sm text-white/70">
              Últimas experiencias aprobadas y publicadas.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/70">Cargando comentarios...</p>
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/70">
                Todavía no hay comentarios publicados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {recentReviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10">
                      <img
                        src={
                          review.targetPhoto ||
                          obtenerFotoFallback(
                            review.targetName,
                            review.targetTag === "Servicio" ? "servicio" : "profesional"
                          )
                        }
                        alt={review.targetName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = obtenerFotoFallback(
                            review.targetName,
                            review.targetTag === "Servicio" ? "servicio" : "profesional"
                          );
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {review.author}
                        </p>

                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/60">
                          {review.targetTag}
                        </span>

                        <span className="text-xs text-white/45">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-cyan-300">
                        {review.targetName}
                      </p>

                      <div className="mt-2">
                        <RatingStars value={review.rating} readOnly size="sm" />
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-white/80">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}