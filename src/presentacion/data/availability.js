// src/data/availability.js
import { addDays, addMinutes, isAfter, startOfDay } from "date-fns";

/**
 * Reglas de horario público.
 *
 * Ventanas solicitadas:
 * - Terapia: 08:00-13:00 y 15:00-19:00
 * - Acondicionamiento / activación física: 09:00-13:00 y 15:00-18:00
 * - Dr. Miguel Puig: 10:00-14:00 y 16:00-19:00
 * - Dr. Martín Buganza: 13:00-15:00 y 17:00-19:00
 */

const DEFAULT_STEP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 60;

const HORARIOS_POR_AGENDA = {
  terapia: [
    ["08:00", "13:00"],
    ["15:00", "19:00"],
  ],
  acondicionamiento: [
    ["09:00", "13:00"],
    ["15:00", "18:00"],
  ],
  general: [["09:00", "20:00"]],
};

const HORARIOS_POR_PROFESIONAL = [
  {
    tokens: ["miguel", "puig"],
    ventanas: [
      ["10:00", "14:00"],
      ["16:00", "19:00"],
    ],
  },
  {
    tokens: ["martin", "buganza"],
    ventanas: [
      ["13:00", "15:00"],
      ["17:00", "19:00"],
    ],
  },
];

export function buildDefaultAvailability(person, options = {}) {
  const agendaTipo = normalizarAgendaTipo(
    options.agendaTipo || options.agenda_tipo || person?.agenda_tipo,
  );

  const durationMinutes = Number(
    options.durationMinutes ||
      options.minutes ||
      person?.minutes ||
      DEFAULT_DURATION_MINUTES,
  );

  const stepMinutes = Number(options.stepMinutes || DEFAULT_STEP_MINUTES);
  const totalDays = Number(options.totalDays || 14);

  const today = startOfDay(new Date());
  const days = Array.from({ length: totalDays }, (_, index) =>
    addDays(today, index),
  );

  const windows = resolveWindows(person, agendaTipo);
  const out = {};

  for (const dayDate of days) {
    const slots = [];
    const now = new Date();
    const isToday = dayDate.getTime() === today.getTime();

    for (const [windowStart, windowEnd] of windows) {
      const start = dateWithTime(dayDate, windowStart);
      const end = dateWithTime(dayDate, windowEnd);

      let cursor = new Date(start);

      while (isAfter(end, cursor)) {
        const slotEnd = addMinutes(cursor, durationMinutes);

        const isInsideWindow = !isAfter(slotEnd, end);
        const isFuture = !isToday || isAfter(cursor, now);

        if (isInsideWindow && isFuture) {
          slots.push(toHHMM(cursor));
        }

        cursor = addMinutes(cursor, stepMinutes);
      }
    }

    out[toISODate(dayDate)] = unique(slots);
  }

  return out;
}

export function getAvailabilityWindows(person, agendaTipo = "general") {
  return resolveWindows(person, normalizarAgendaTipo(agendaTipo));
}

function resolveWindows(person, agendaTipo) {
  const professionalText = normalizeText(
    `${person?.name || ""} ${person?.slug || ""} ${person?.id || ""}`,
  );

  const customProfessional = HORARIOS_POR_PROFESIONAL.find((item) => {
    return item.tokens.every((token) => professionalText.includes(token));
  });

  if (customProfessional) {
    return customProfessional.ventanas;
  }

  return HORARIOS_POR_AGENDA[agendaTipo] || HORARIOS_POR_AGENDA.general;
}

function normalizarAgendaTipo(value) {
  const text = normalizeText(value);

  if (
    text.includes("terapia") ||
    text.includes("fisio") ||
    text.includes("rehabilitacion")
  ) {
    return "terapia";
  }

  if (
    text.includes("acondicionamiento") ||
    text.includes("activacion") ||
    text.includes("adulto")
  ) {
    return "acondicionamiento";
  }

  return "general";
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

function dateWithTime(dayDate, time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  const date = new Date(dayDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toHHMM(date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function unique(values) {
  return Array.from(new Set(values));
}
