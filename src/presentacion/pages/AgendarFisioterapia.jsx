// src/presentacion/pages/AgendaFisioterapia.jsx
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CalendarDays,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const RAW_API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_ROOT = /\/api$/i.test(RAW_API_BASE) ? RAW_API_BASE : `${RAW_API_BASE}/api`;
const FERNANDO_NAME = "Lic. José Fernando Porras Pulido";

function buildApiUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${API_ROOT}/${cleanPath}`;
}

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDatePretty(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimePretty(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad2(h12)}:${pad2(m)} ${ampm}`;
}

function buildNextDays(n = 14) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(formatDateISO(d));
  }

  return out;
}

function buildSlots({ startHour = 8, endHour = 20, stepMin = 30 }) {
  const out = [];

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      out.push(`${pad2(h)}:${pad2(m)}`);
    }
  }

  return out;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
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

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "").slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function durationToMinutes(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);

  if (match) {
    return Number(match[1]) * 60 + Number(match[2]);
  }

  return 60;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.non_field_errors?.[0] ||
      "Ocurrió un error al conectar con el servidor."
    );
  }

  return data;
}

export default function AgendaFisioterapia() {
  const q = useQuery();
  const tipo = q.get("tipo");

  const title =
    tipo === "adulto-mayor"
      ? "Agenda: Activación física (adulto mayor)"
      : tipo === "funcional"
        ? "Agenda: Fisioterapia general y funcional"
        : "Agenda: Fisioterapia";

  const desc =
    tipo === "adulto-mayor"
      ? "Movilidad, equilibrio, fuerza suave, acondicionamiento físico y prevención de caídas."
      : tipo === "funcional"
        ? "Rehabilitación, terapia manual, readaptación, electroterapia y recuperación funcional."
        : "Agenda general de fisioterapia.";

  const expectedAgendaTipo = tipo === "adulto-mayor" ? "acondicionamiento" : "terapia";
  const dateOptions = useMemo(() => buildNextDays(14), []);
  const allSlots = useMemo(() => buildSlots({ startHour: 8, endHour: 20, stepMin: 30 }), []);

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [serviceId, setServiceId] = useState("");
  const [dateISO, setDateISO] = useState(dateOptions[0] || "");
  const [timeHHMM, setTimeHHMM] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busyRanges, setBusyRanges] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        setServicesLoading(true);
        setError(null);

        const data = await fetchJson(buildApiUrl("servicios/"));
        if (!active) return;

        const all = Array.isArray(data) ? data : [];

        const filtered = all
          .map((service) => ({
            ...service,
            minutes: durationToMinutes(service?.duracion),
          }))
          .filter((service) => {
            const text = normalizeText(`${service?.nombre || ""} ${service?.descripcion || ""}`);

            if (expectedAgendaTipo === "acondicionamiento") {
              return (
                text.includes("adulto mayor") ||
                text.includes("activacion") ||
                text.includes("acondicionamiento")
              );
            }

            return (
              text.includes("fisioterapia") ||
              text.includes("funcional") ||
              text.includes("terapia") ||
              text.includes("rehabilitacion")
            );
          });

        const finalList = filtered.length > 0 ? filtered : all.map((service) => ({
          ...service,
          minutes: durationToMinutes(service?.duracion),
        }));

        setServices(finalList);
      } catch (err) {
        if (!active) return;
        setServices([]);
        setError(err.message || "No se pudieron cargar los servicios.");
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, [expectedAgendaTipo]);

  useEffect(() => {
    if (!serviceId && services.length > 0) {
      setServiceId(String(services[0].id));
    }
  }, [services, serviceId]);

  const selectedService = useMemo(() => {
    return services.find((service) => String(service.id) === String(serviceId)) || null;
  }, [services, serviceId]);

  useEffect(() => {
    if (!dateISO) return;

    let active = true;

    async function loadAgenda() {
      try {
        setLoadingAgenda(true);
        setError(null);

        const params = new URLSearchParams({
          fecha: dateISO,
          agenda_tipo: expectedAgendaTipo,
          profesional_nombre: FERNANDO_NAME,
        });

        const data = await fetchJson(buildApiUrl(`public/agenda/?${params.toString()}`));

        if (!active) return;
        setBusyRanges(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setBusyRanges([]);
        setError(err.message || "No se pudo cargar la agenda.");
      } finally {
        if (active) {
          setLoadingAgenda(false);
        }
      }
    }

    loadAgenda();

    return () => {
      active = false;
    };
  }, [dateISO, expectedAgendaTipo]);

  const availableSlots = useMemo(() => {
    const minutes = selectedService?.minutes || 60;

    return allSlots.filter((slot) => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + minutes;

      if (slotEnd > 20 * 60) {
        return false;
      }

      return !busyRanges.some((item) => {
        const busyStart = timeToMinutes(item?.hora_inicio);
        const busyEnd = timeToMinutes(item?.hora_termina);
        return overlaps(slotStart, slotEnd, busyStart, busyEnd);
      });
    });
  }, [allSlots, selectedService, busyRanges]);

  useEffect(() => {
    if (!availableSlots.length) {
      setTimeHHMM("");
      return;
    }

    if (!availableSlots.includes(timeHHMM)) {
      setTimeHHMM(availableSlots[0]);
    }
  }, [availableSlots, timeHHMM]);

  const step1Ok = Boolean(serviceId && dateISO && timeHHMM);
  const step2Ok = Boolean(fullName.trim() && normalizePhone(phone).length === 10);
  const activeStep = sent ? 3 : step1Ok ? (step2Ok ? 3 : 2) : 1;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSent(false);

    const cleanPhone = normalizePhone(phone);

    if (!selectedService) return setError("Selecciona un servicio.");
    if (!dateISO) return setError("Selecciona una fecha.");
    if (!timeHHMM) return setError("Selecciona un horario.");
    if (!fullName.trim()) return setError("Escribe tu nombre completo.");
    if (cleanPhone.length !== 10) return setError("El teléfono debe tener 10 dígitos.");

    try {
      await fetchJson(buildApiUrl("public/citas/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: fullName.trim(),
          telefono: cleanPhone,
          servicio_id: selectedService.id,
          fecha: dateISO,
          hora_inicio: timeHHMM,
          agenda_tipo: expectedAgendaTipo,
          profesional_nombre: FERNANDO_NAME,
          notas: "Cita registrada desde AgendaFisioterapia pública.",
        }),
      });

      setSent(true);
      setFullName("");
      setPhone("");

      const params = new URLSearchParams({
        fecha: dateISO,
        agenda_tipo: expectedAgendaTipo,
        profesional_nombre: FERNANDO_NAME,
      });

      const refreshed = await fetchJson(buildApiUrl(`public/agenda/?${params.toString()}`));
      setBusyRanges(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setError(err.message || "No se pudo registrar la cita.");
    }
  }

  const prettyDate = dateISO ? formatDatePretty(dateISO) : "—";
  const prettyTime = timeHHMM ? formatTimePretty(timeHHMM) : "—";

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

        <div className="mt-6 rounded-3xl bg-slate-900/70 p-6 ring-1 ring-white/10 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-slate-300">{desc}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-400/30">
            <p className="text-sm text-amber-100">
              <span className="font-semibold">Requisito:</span> Para iniciar terapia es necesario haber
              pasado primero por una{" "}
              <span className="font-semibold">valoración médica de Ortopedia/Traumatología</span>{" "}
              (interna o externa).
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              Esta agenda ya consulta la disponibilidad real del sistema.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <p className="text-sm font-semibold">Datos de la cita</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-sky-400" />
                      Servicio
                    </span>
                    <select
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      disabled={servicesLoading || services.length === 0}
                      className="w-full rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    >
                      <option value="">
                        {servicesLoading ? "Cargando servicios..." : "— Selecciona —"}
                      </option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <CalendarDays className="h-4 w-4 text-sky-400" />
                      Fecha
                    </span>
                    <select
                      value={dateISO}
                      onChange={(e) => setDateISO(e.target.value)}
                      className="w-full rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    >
                      {dateOptions.map((d) => (
                        <option key={d} value={d}>
                          {formatDatePretty(d)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <Clock className="h-4 w-4 text-sky-400" />
                      Horario disponible
                    </span>
                    <select
                      value={timeHHMM}
                      onChange={(e) => setTimeHHMM(e.target.value)}
                      disabled={loadingAgenda}
                      className="w-full rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
                    >
                      {loadingAgenda ? (
                        <option value="">Cargando horarios...</option>
                      ) : availableSlots.length === 0 ? (
                        <option value="">Sin horarios disponibles</option>
                      ) : (
                        availableSlots.map((t) => (
                          <option key={t} value={t}>
                            {formatTimePretty(t)}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </div>

                <div className="my-5 h-px w-full bg-white/10" />

                <div className="mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-sky-400" />
                  <p className="text-sm font-semibold">Tus datos</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <User className="h-4 w-4 text-sky-400" />
                      Nombre completo
                    </span>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <Phone className="h-4 w-4 text-sky-400" />
                      Teléfono
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(normalizePhone(e.target.value))}
                      placeholder="10 dígitos"
                      inputMode="numeric"
                      className="w-full rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    />
                  </label>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
                    {error}
                  </div>
                )}

                {sent && (
                  <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Cita registrada correctamente en la agenda administrativa.</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingAgenda || !selectedService || availableSlots.length === 0}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-400 disabled:opacity-50"
                >
                  Solicitar cita
                </button>
              </form>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/10">
                <p className="text-sm font-semibold">Resumen de tu cita</p>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Servicio</p>
                    <p className="mt-1 font-semibold text-white">
                      {selectedService?.nombre || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/10">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Fecha</p>
                      <p className="mt-1 font-semibold text-white">{prettyDate}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/10">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Hora</p>
                      <p className="mt-1 font-semibold text-white">{prettyTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/10">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Nombre</p>
                      <p className="mt-1 font-semibold text-white">{fullName.trim() || "—"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/10">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Teléfono</p>
                      <p className="mt-1 font-semibold text-white">
                        {normalizePhone(phone) || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/10">
                <p className="text-sm font-semibold">¿Qué sigue?</p>
                <ol className="mt-2 space-y-2 text-sm text-slate-300">
                  <li>1) Selecciona servicio, fecha y horario.</li>
                  <li>2) Escribe tu nombre y teléfono.</li>
                  <li>3) Pulsa <span className="font-semibold text-white">Solicitar cita</span>.</li>
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}