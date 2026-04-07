// src/data/availability.js
import {
  addDays,
  addMinutes,
  isAfter,
  startOfDay,
} from "date-fns";

/**
 * Genera intervalos de horas entre 09:00 y 20:00
 * - Médicos (role contiene “médico” u “ortop”): cada 30 min
 * - Fisios (role contiene “fisio”): cada 60 min
 * - Para las próximas 2 semanas a partir de hoy (incluye hoy)
 *
 * Devuelve un objeto:
 * {
 *   [yyyy-mm-dd]: ["09:00", "09:30", ...], // según rol
 *   ...
 * }
 */
export function buildDefaultAvailability(person) {
  const role = (person?.role || "").toLowerCase();
  const isPhysio = role.includes("fisio");
  const step = isPhysio ? 60 : 30;

  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const out = {};
  for (const dayDate of days) {
    const start = new Date(dayDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(dayDate);
    end.setHours(20, 0, 0, 0);

    const slots = [];
    let cursor = start;
    const now = new Date();
    while (!isAfter(cursor, end)) {
      // el “hoy” excluye horas pasadas
      if (dayDate.getTime() !== today.getTime() || isAfter(cursor, now)) {
        slots.push(toHHMM(cursor));
      }
      cursor = addMinutes(cursor, step);
    }
    out[toISODate(dayDate)] = slots.filter((t) => t <= "20:00");
  }
  return out;
}

// Helpers
function toISODate(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHHMM(d) {
  const h = `${d.getHours()}`.padStart(2, "0");
  const m = `${d.getMinutes()}`.padStart(2, "0");
  return `${h}:${m}`;
}
