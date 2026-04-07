// src/presentacion/components/SchedulePicker.jsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DailyCalendar from "./DailyCalendar";

const schema = z.object({
  service: z.string().min(1, "Selecciona un servicio"),
  name: z.string().min(3, "Nombre muy corto"),
  phone: z
    .string()
    .min(10, "Teléfono inválido")
    .refine((value) => /^\d{10}$/.test(String(value || "").replace(/\D/g, "")), {
      message: "Ingresa 10 dígitos",
    }),
  date: z.string().optional(),
  time: z.string().optional(),
});

const RAW_API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_ROOT = /\/api$/i.test(RAW_API_BASE) ? RAW_API_BASE : `${RAW_API_BASE}/api`;

function buildApiUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${API_ROOT}/${cleanPath}`;
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

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 10);
}

function getTokenScore(a = "", b = "") {
  const left = normalizeText(a).split(" ").filter(Boolean);
  const right = new Set(normalizeText(b).split(" ").filter(Boolean));

  let score = 0;
  for (const token of left) {
    if (token.length >= 4 && right.has(token)) {
      score += 1;
    }
  }
  return score;
}

function serviceScoreForPerson(service, person) {
  const serviceText = `${service?.nombre || ""} ${service?.descripcion || ""}`;
  const personServices = Array.isArray(person?.services) ? person.services : [];
  const role = normalizeText(person?.role || "");

  let score = 0;

  for (const item of personServices) {
    score = Math.max(score, getTokenScore(item, serviceText));
  }

  const normalizedService = normalizeText(serviceText);

  if (role.includes("fisio")) {
    if (
      normalizedService.includes("fisioterapia") ||
      normalizedService.includes("terapia") ||
      normalizedService.includes("rehabilitacion") ||
      normalizedService.includes("funcional") ||
      normalizedService.includes("adulto mayor") ||
      normalizedService.includes("activacion") ||
      normalizedService.includes("acondicionamiento")
    ) {
      score += 2;
    }
  } else {
    if (
      normalizedService.includes("consulta") ||
      normalizedService.includes("seguimiento") ||
      normalizedService.includes("valoracion") ||
      normalizedService.includes("quirurgica")
    ) {
      score += 2;
    }
  }

  return score;
}

function resolveAgendaTipo(person, service) {
  const role = normalizeText(person?.role || "");
  const fullText = normalizeText(`${service?.nombre || ""} ${service?.descripcion || ""}`);

  const isPhysio = role.includes("fisio");

  if (!isPhysio) {
    return "general";
  }

  if (
    fullText.includes("adulto mayor") ||
    fullText.includes("activacion") ||
    fullText.includes("acondicionamiento")
  ) {
    return "acondicionamiento";
  }

  if (
    fullText.includes("fisioterapia") ||
    fullText.includes("funcional") ||
    fullText.includes("terapia") ||
    fullText.includes("rehabilitacion")
  ) {
    return "terapia";
  }

  return "terapia";
}

function getMinutesFromDuration(value) {
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

export default function SchedulePicker({ person, onPickedChange }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      service: "",
      name: "",
      phone: "",
      date: "",
      time: "",
    },
  });

  const [backendServices, setBackendServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const selectedServiceId = watch("service");
  const watchedDate = watch("date");
  const watchedTime = watch("time");

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        setServicesLoading(true);
        setServicesError("");

        const data = await fetchJson(buildApiUrl("servicios/"));

        if (!active) return;

        const list = Array.isArray(data) ? data : [];

        const ranked = list
          .map((service) => ({
            ...service,
            _score: serviceScoreForPerson(service, person),
            agenda_tipo: resolveAgendaTipo(person, service),
            minutes: getMinutesFromDuration(service?.duracion),
          }))
          .sort((a, b) => b._score - a._score || String(a.nombre).localeCompare(String(b.nombre)));

        const positive = ranked.filter((item) => item._score > 0);
        const finalList = positive.length > 0 ? positive : ranked;

        setBackendServices(finalList);
      } catch (error) {
        if (!active) return;
        setBackendServices([]);
        setServicesError(error.message || "No se pudieron cargar los servicios.");
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
  }, [person]);

  useEffect(() => {
    if (!selectedServiceId && backendServices.length > 0) {
      setValue("service", String(backendServices[0].id), { shouldValidate: true });
    }
  }, [backendServices, selectedServiceId, setValue]);

  const selectedService = useMemo(() => {
    return backendServices.find((item) => String(item.id) === String(selectedServiceId)) || null;
  }, [backendServices, selectedServiceId]);

  useEffect(() => {
    if (typeof onPickedChange !== "function") return;

    onPickedChange((current) => ({
      ...(current || {}),
      service: selectedService?.nombre || "",
      duration: selectedService ? `${selectedService.minutes} min` : "",
      agenda:
        selectedService?.agenda_tipo === "acondicionamiento"
          ? "Acondicionamiento"
          : selectedService?.agenda_tipo === "terapia"
            ? "Terapia"
            : selectedService?.agenda_tipo === "general"
              ? "General"
              : "",
      doctor: person?.name || "",
      date: watchedDate || "",
      time: watchedTime || "",
    }));
  }, [selectedService, person, watchedDate, watchedTime, onPickedChange]);

  const onPickSlot = ({ date, time }) => {
    setValue("date", date, { shouldValidate: true });
    setValue("time", time, { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    setSubmitMessage("");
    setSubmitError("");

    if (!values.date || !values.time) {
      alert("Selecciona un horario en el calendario.");
      return;
    }

    if (!selectedService) {
      alert("Selecciona un servicio válido.");
      return;
    }

    try {
      await fetchJson(buildApiUrl("public/citas/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: values.name.trim(),
          telefono: normalizePhone(values.phone),
          servicio_id: selectedService.id,
          fecha: values.date,
          hora_inicio: values.time,
          agenda_tipo: selectedService.agenda_tipo || "general",
          profesional_nombre: person?.name || "",
          profesional_slug: person?.slug || "",
          notas: "Cita registrada desde la página web de presentación.",
        }),
      });

      setSubmitMessage("Cita registrada correctamente.");
    } catch (error) {
      setSubmitError(error.message || "No se pudo registrar la cita.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Servicio</label>
        <select
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
          {...register("service")}
          disabled={servicesLoading || backendServices.length === 0}
        >
          <option value="">
            {servicesLoading ? "Cargando servicios..." : "— Selecciona —"}
          </option>

          {backendServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nombre}
            </option>
          ))}
        </select>

        {errors.service && (
          <p className="text-xs text-red-600 mt-1">{errors.service.message}</p>
        )}

        {servicesError && (
          <p className="text-xs text-red-600 mt-1">{servicesError}</p>
        )}
      </div>

      <DailyCalendar
        person={person}
        selectedService={selectedService}
        onPick={onPickSlot}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            placeholder="Tu nombre"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            placeholder="10 dígitos"
            maxLength={10}
            inputMode="numeric"
            pattern="\d{10}"
            title="Ingresa 10 dígitos"
            {...register("phone", {
              onChange: (event) => {
                event.target.value = normalizePhone(event.target.value);
              },
            })}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <input type="hidden" {...register("date")} />
      <input type="hidden" {...register("time")} />

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isSubmitting || servicesLoading || !selectedService}
      >
        {isSubmitting ? "Enviando…" : "Solicitar cita"}
      </button>

      <p className="text-xs text-slate-500">
        * Selecciona primero un horario en el calendario.
      </p>

      {submitMessage ? (
        <p className="text-xs text-emerald-600">{submitMessage}</p>
      ) : null}

      {submitError ? (
        <p className="text-xs text-red-600">{submitError}</p>
      ) : null}
    </form>
  );
}