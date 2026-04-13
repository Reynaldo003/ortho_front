import { useEffect, useMemo, useState } from "react";

const RAW_API_BASE = "https://ortho-clinic-cordoba.cloud";

const API_ROOT = RAW_API_BASE
  ? /\/api$/i.test(RAW_API_BASE)
    ? RAW_API_BASE
    : `${RAW_API_BASE}/api`
  : "/api";

function buildApiUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${API_ROOT}/${cleanPath}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function getTodayISO() {
  return formatDateISO(new Date());
}

function formatDateLabel(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeLabel(time) {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "p.m." : "a.m.";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad2(h12)}:${pad2(minutes)} ${suffix}`;
}

function buildNextDays(total = 14) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < total; index += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + index);
    days.push(formatDateISO(current));
  }

  return days;
}

function buildSlots() {
  const slots = [];

  for (let hour = 9; hour < 20; hour += 1) {
    slots.push(`${pad2(hour)}:00`);
    slots.push(`${pad2(hour)}:30`);
  }

  return slots;
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "")
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function fetchJson(url) {
  return fetch(url, {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { detail: text } : null;
    }

    if (!response.ok) {
      throw new Error(data?.detail || "No se pudo cargar la agenda.");
    }

    return data;
  });
}

export default function DailyCalendar({ person, selectedService, onPick }) {
  const days = useMemo(() => buildNextDays(14), []);
  const slots = useMemo(() => buildSlots(), []);

  const [selectedDate, setSelectedDate] = useState(days[0] || "");
  const [selectedTime, setSelectedTime] = useState("");
  const [busyRanges, setBusyRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());

  const durationMinutes = useMemo(() => {
    return Number(selectedService?.minutes || 60);
  }, [selectedService]);

  const agendaTipo = useMemo(() => {
    return selectedService?.agenda_tipo || "general";
  }, [selectedService]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedDate || !person?.name) return;

    let active = true;

    async function loadAgenda() {
      try {
        setLoading(true);
        setCalendarError("");

        const params = new URLSearchParams({
          fecha: selectedDate,
          agenda_tipo: agendaTipo,
          profesional_nombre: person.name,
          profesional_slug: person?.slug || "",
        });

        const data = await fetchJson(
          buildApiUrl(`public/agenda/?${params.toString()}`)
        );

        if (!active) return;
        setBusyRanges(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;
        setBusyRanges([]);
        setCalendarError(error.message || "No se pudo cargar la agenda.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAgenda();

    return () => {
      active = false;
    };
  }, [selectedDate, agendaTipo, person]);

  const availableSlots = useMemo(() => {
    const isToday = selectedDate === getTodayISO();

    return slots.filter((slot) => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + durationMinutes;

      if (slotEnd > 20 * 60) {
        return false;
      }

      if (isToday && slotStart <= currentMinutes) {
        return false;
      }

      const isBusy = busyRanges.some((item) => {
        const busyStart = timeToMinutes(item?.hora_inicio);
        const busyEnd = timeToMinutes(item?.hora_termina);
        return overlaps(slotStart, slotEnd, busyStart, busyEnd);
      });

      return !isBusy;
    });
  }, [slots, busyRanges, durationMinutes, selectedDate, currentMinutes]);

  useEffect(() => {
    if (!availableSlots.length) {
      setSelectedTime("");
      return;
    }

    if (!availableSlots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [availableSlots, selectedTime]);

  const handlePick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onPick?.({ date, time });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Fecha</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const active = day === selectedDate;

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDate(day);
                  setSelectedTime("");
                  onPick?.({ date: day, time: "" });
                }}
                className={[
                  "rounded-xl border p-2 text-sm transition",
                  active
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200",
                ].join(" ")}
              >
                {formatDateLabel(day)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Horario disponible</label>

        <div className="mt-2 rounded-2xl border border-slate-300 bg-white p-3 dark:bg-slate-950 dark:border-slate-800">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando horarios...</p>
          ) : calendarError ? (
            <p className="text-sm text-red-600">{calendarError}</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay horarios disponibles para ese día.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {availableSlots.map((time) => {
                const active = time === selectedTime;

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handlePick(selectedDate, time)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm transition",
                      active
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {formatTimeLabel(time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}