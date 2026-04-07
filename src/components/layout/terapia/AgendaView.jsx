// src/components/layout/terapia/AgendaView.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  DollarSign,
  Plus,
  Ban,
  Table2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(Boolean(m.matches));
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const deltaToMonday = (jsDay + 6) % 7;
  d.setDate(d.getDate() - deltaToMonday);
  return d;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLongDate(date) {
  return date
    .toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function safeMoney(n) {
  const x = Number(n || 0);
  return x.toFixed(2);
}

function weekdayShortEs(dateObj) {
  const map = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return map[dateObj.getDay()] || "";
}

function toMinutes(time) {
  if (!time) return 0;
  const hh = parseInt(String(time).slice(0, 2), 10) || 0;
  const mm = parseInt(String(time).slice(3, 5), 10) || 0;
  return hh * 60 + mm;
}

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr) return "08:00";
  const [h = "0", m = "0"] = String(timeStr).split(":");
  let total = Number(h) * 60 + Number(m) + Number(minutesToAdd || 0);
  if (total < 0) total = 0;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function overlapsMinutes(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function rectFromPoint(x, y) {
  return {
    left: x,
    top: y,
    right: x,
    bottom: y,
    width: 0,
    height: 0,
  };
}

function rectFromElement(el) {
  if (!el?.getBoundingClientRect) return null;
  return el.getBoundingClientRect();
}

function isBlockItem(a) {
  if (!a) return false;

  const t = String(a.type || a.kind || a.__type || a.tipo || "").toLowerCase();

  if (t.includes("bloque")) return true;
  if (t === "block" || t === "blocked") return true;
  if (a.isBlock === true || a.isBlocked === true || a.blocked === true) return true;
  if (String(a._type || "").toLowerCase().includes("bloque")) return true;

  const hasMotivo = typeof a.motivo === "string" && a.motivo.trim().length > 0;
  const hasPaciente = String(a.patient || "").trim().length > 0;
  const hasServicio = String(a.service || "").trim().length > 0;

  if (hasMotivo && !hasPaciente && !hasServicio) return true;

  return false;
}

function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "").trim();
  if (clean.length !== 6) return null;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}

function getReadableTextColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#0f172a";

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.65 ? "#0f172a" : "#ffffff";
}

function buildProfessionalPalette(colorHex) {
  const safe = colorHex || "#06b6d4";
  const rgb = hexToRgb(safe) || { r: 6, g: 182, b: 212 };

  return {
    dotStyle: { backgroundColor: safe },
    cardStyle: {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`,
      borderColor: safe,
      color: "#0f172a",
    },
    textColor: getReadableTextColor(safe),
  };
}

function getAppointmentPalette(appt, professionalsMap) {
  if (isBlockItem(appt)) {
    return {
      dotStyle: { backgroundColor: "#8b5cf6" },
      cardStyle: {
        backgroundColor: "rgba(139, 92, 246, 0.16)",
        borderColor: "#8b5cf6",
        color: "#4c1d95",
      },
      textColor: "#4c1d95",
    };
  }

  const prof = professionalsMap.get(Number(appt.professionalId));
  const colorHex = prof?.color_agenda || "#06b6d4";
  return buildProfessionalPalette(colorHex);
}

function HoverCard({ open, anchorRect, children }) {
  if (!open || !anchorRect) return null;

  const top = anchorRect.top - 8;
  const left = anchorRect.left + anchorRect.width + 10;

  const content = (
    <div className="fixed z-[80]" style={{ top, left, maxWidth: 300 }}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-3">
        {children}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}

function MenuPopover({ open, anchorRect, preferUp = false, onClose, children }) {
  const menuRef = useRef(null);
  const [autoUp, setAutoUp] = useState(Boolean(preferUp));
  const [clampedLeft, setClampedLeft] = useState(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();

    const onPointerDown = (e) => {
      const el = document.querySelector("[data-slot-menu='1']");
      if (el && el.contains(e.target)) return;
      onClose?.();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  useEffect(() => setAutoUp(Boolean(preferUp)), [preferUp]);

  useEffect(() => {
    if (!open || !anchorRect) return;

    const raf = requestAnimationFrame(() => {
      const el = menuRef.current;
      if (!el) return;

      const menuH = el.offsetHeight || 0;
      const menuW = el.offsetWidth || 0;

      const margin = 10;
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      const shouldGoUp = menuH + margin > spaceBelow && spaceAbove >= menuH + margin;
      setAutoUp(shouldGoUp);

      const rawLeft = anchorRect.left;
      const maxLeft = window.innerWidth - menuW - margin;
      const minLeft = margin;
      setClampedLeft(Math.min(Math.max(rawLeft, minLeft), maxLeft));
    });

    return () => cancelAnimationFrame(raf);
  }, [open, anchorRect]);

  if (!open || !anchorRect) return null;

  const left = clampedLeft != null ? clampedLeft : anchorRect.left;
  const downTop = anchorRect.top + anchorRect.height + 6;
  const upTop = anchorRect.top - 6;

  const content = (
    <div
      className="fixed z-[90]"
      style={{
        left,
        top: autoUp ? upTop : downTop,
        transform: autoUp ? "translateY(-100%)" : "none",
      }}
    >
      <div
        ref={menuRef}
        data-slot-menu="1"
        className="rounded-xl border border-slate-200 bg-white shadow-xl p-2 min-w-[220px]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}

function AgendaSummaryCards({ appointments }) {
  const realAppointments = (appointments || []).filter((x) => !isBlockItem(x));

  const totalRecaudado = realAppointments.reduce((acc, item) => {
    const price = Number(item.price || 0);
    const paid = Boolean(item.paid);
    return acc + (paid ? price : 0);
  }, 0);

  const completadas = realAppointments.filter((x) => x.status === "completado").length;
  const confirmadas = realAppointments.filter((x) => x.status === "confirmado").length;
  const reservadas = realAppointments.filter((x) => x.status === "reservado").length;
  const noAsistio = realAppointments.filter((x) => x.status === "cancelado").length;

  const cards = [
    { label: "Total citas", value: realAppointments.length },
    { label: "Confirmadas", value: confirmadas },
    { label: "Asistieron", value: completadas },
    { label: "No asistieron", value: noAsistio },
    { label: "Reservadas", value: reservadas },
    { label: "Recaudado", value: `$${safeMoney(totalRecaudado)}` },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 px-3 sm:px-6 py-3 border-b border-slate-200 bg-white">
      {cards.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="text-[11px] text-slate-500">{item.label}</div>
          <div className="mt-1 text-sm font-bold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function TableView({ appointments, weekDays, professionalsMap }) {
  const realAppointments = (appointments || []).filter((x) => !isBlockItem(x));

  const rows = [...realAppointments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time !== b.time) return String(a.time || "").localeCompare(String(b.time || ""));
    return String(a.professional || "").localeCompare(String(b.professional || ""));
  });

  const resumenByDoctor = Object.values(
    rows.reduce((acc, item) => {
      const key = item.professionalId || item.professional || "sin-profesional";
      if (!acc[key]) {
        acc[key] = {
          professionalId: item.professionalId,
          professional: item.professional || "Sin profesional",
          totalCitas: 0,
          confirmadas: 0,
          asistio: 0,
          noAsistio: 0,
          reservado: 0,
          recaudado: 0,
        };
      }

      acc[key].totalCitas += 1;
      if (item.status === "confirmado") acc[key].confirmadas += 1;
      if (item.status === "completado") acc[key].asistio += 1;
      if (item.status === "cancelado") acc[key].noAsistio += 1;
      if (item.status === "reservado") acc[key].reservado += 1;
      if (item.paid) acc[key].recaudado += Number(item.price || 0);

      return acc;
    }, {})
  ).sort((a, b) => a.professional.localeCompare(b.professional));

  const weekKeys = new Set((weekDays || []).map((d) => dateKey(d)));
  const rowsThisWeek = rows.filter((x) => weekKeys.has(x.date));

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-800">Bitácora por doctor</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Citas</th>
                <th className="px-4 py-3">Reservadas</th>
                <th className="px-4 py-3">Confirmadas</th>
                <th className="px-4 py-3">Asistió</th>
                <th className="px-4 py-3">No asistió</th>
                <th className="px-4 py-3">Recaudado</th>
              </tr>
            </thead>
            <tbody>
              {resumenByDoctor.map((item) => {
                const prof = professionalsMap.get(Number(item.professionalId));
                return (
                  <tr key={String(item.professionalId || item.professional)} className="border-t border-slate-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: prof?.color_agenda || "#06b6d4" }} />
                        <span className="font-medium text-slate-800">{item.professional}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.totalCitas}</td>
                    <td className="px-4 py-3">{item.reservado}</td>
                    <td className="px-4 py-3">{item.confirmadas}</td>
                    <td className="px-4 py-3">{item.asistio}</td>
                    <td className="px-4 py-3">{item.noAsistio}</td>
                    <td className="px-4 py-3 font-semibold">${safeMoney(item.recaudado)}</td>
                  </tr>
                );
              })}

              {resumenByDoctor.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay información para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-800">Detalle semanal</div>
          <div className="text-xs text-slate-500">Solo se listan las citas de la semana visible.</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {rowsThisWeek.map((item) => {
                const prof = professionalsMap.get(Number(item.professionalId));
                return (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">
                      {String(item.time || "").slice(0, 5)} - {String(item.endTime || "").slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">{item.patient}</td>
                    <td className="px-4 py-3">{item.service}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: prof?.color_agenda || "#06b6d4" }} />
                        {item.professional}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.status}</td>
                    <td className="px-4 py-3">${safeMoney(item.price)}</td>
                  </tr>
                );
              })}

              {rowsThisWeek.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay citas en la semana seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AgendaView({
  appointments,
  professionals,
  role,
  myUserId,
  agendaTipo = "terapia",
  tituloAgenda = "Terapia",
  onNewReservation,
  onOpenAppointment,
  onMoveAppointment,
  onOpenBlockModal,
  onDeleteBlock,
  currentDate,
  onChangeDate,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [viewMode, setViewMode] = useState("week");
  const [displayMode, setDisplayMode] = useState("calendar");
  const [activeApptId, setActiveApptId] = useState(null);
  const [hoverAppt, setHoverAppt] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const [slotMenu, setSlotMenu] = useState(null);
  const [includeSunday, setIncludeSunday] = useState(false);

  const isProfessional =
    role === "fisioterapeuta" ||
    role === "aux_fisioterapia" ||
    role === "auxiliar_fisioterapia" ||
    role === "subfisioterapeuta" ||
    role === "sub_fisioterapeuta";

  const canSeeAll =
    role === "admin" ||
    role === "recepcion" ||
    role === "recepcionista";

  const [now, setNow] = useState(() => new Date());
  const todayIso = useMemo(() => dateKey(new Date()), []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode("day");
  }, [isMobile]);

  const HOURS = useMemo(
    () => ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
    []
  );

  const DAY_START_MIN = toMinutes(HOURS[0]);
  const DAY_END_MIN = toMinutes(HOURS[HOURS.length - 1]) + 60;
  const HOUR_ROW_HEIGHT = 64;
  const GRID_TOTAL_HEIGHT = HOURS.length * HOUR_ROW_HEIGHT;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = ((nowMinutes - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
  const showNowLine = nowMinutes >= DAY_START_MIN && nowMinutes <= DAY_END_MIN;
  const nowLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const professionalsMap = useMemo(() => {
    const map = new Map();
    (professionals || []).forEach((p) => map.set(Number(p.id), p));
    return map;
  }, [professionals]);

  const safeCurrentDate = currentDate instanceof Date ? currentDate : new Date();
  const monday = startOfWeekMonday(safeCurrentDate);

  const weekDays = useMemo(
    () =>
      Array.from({ length: includeSunday ? 7 : 6 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      }),
    [monday, includeSunday]
  );

  const visibleAppointments = useMemo(() => {
    let list = [...(appointments || [])].filter((item) => (item.agendaTipo || item.agenda_tipo || "general") === agendaTipo);

    if (!canSeeAll && isProfessional && myUserId) {
      list = list.filter((item) => Number(item.professionalId) === Number(myUserId));
    }

    return list.map((item) => {
      const palette = getAppointmentPalette(item, professionalsMap);
      return {
        ...item,
        __cardStyle: palette.cardStyle,
        __dotStyle: palette.dotStyle,
        __textColor: palette.textColor,
      };
    });
  }, [appointments, professionalsMap, agendaTipo, canSeeAll, isProfessional, myUserId]);

  const activeAppt = useMemo(
    () => (visibleAppointments || []).find((a) => a.id === activeApptId) || null,
    [visibleAppointments, activeApptId]
  );

  let headerMainLabel = "";
  if (viewMode === "day") {
    headerMainLabel = formatLongDate(safeCurrentDate);
  } else {
    const end = new Date(monday);
    end.setDate(monday.getDate() + (includeSunday ? 6 : 5));
    headerMainLabel = `${formatLongDate(monday)} – ${formatLongDate(end)}`;
  }

  const groupedByDay = useMemo(() => {
    return weekDays.map((day) => {
      const key = dateKey(day);
      const items = (visibleAppointments || [])
        .filter((appt) => appt.date === key)
        .sort((a, b) => {
          if (String(a.time || "") !== String(b.time || "")) {
            return String(a.time || "").localeCompare(String(b.time || ""));
          }
          return String(a.professional || "").localeCompare(String(b.professional || ""));
        });

      return {
        key,
        label: `${weekdayShortEs(day)} ${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
        items,
      };
    });
  }, [weekDays, visibleAppointments]);

  const weekHasToday = useMemo(() => weekDays.some((d) => dateKey(d) === todayIso), [weekDays, todayIso]);
  const keyDate = dateKey(safeCurrentDate);

  const blockedSlots = useMemo(() => {
    const set = new Set();
    const list = visibleAppointments || [];
    const byDayPro = new Map();

    for (const a of list) {
      const k = `${a.date}|${a.professionalId}`;
      if (!byDayPro.has(k)) byDayPro.set(k, []);
      byDayPro.get(k).push(a);
    }

    for (const [k, arr] of byDayPro.entries()) {
      const blocks = (arr || []).filter(isBlockItem);
      if (!blocks.length) continue;

      const [dateIso, proId] = k.split("|");

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const covered = blocks.some((b) => {
          const s = toMinutes(b.time);
          const e = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        });

        if (covered) set.add(`${dateIso}|${Number(proId)}|${hour}`);
      }
    }

    return set;
  }, [visibleAppointments, HOURS]);

  const findBlockForSlot = useCallback(
    ({ dateIso, professionalId, hour }) => {
      const hourStart = toMinutes(hour);
      const hourEnd = hourStart + 60;

      return (
        (visibleAppointments || []).find((a) => {
          if (!isBlockItem(a)) return false;
          if (a.date !== dateIso) return false;
          if (Number(a.professionalId) !== Number(professionalId)) return false;

          const s = toMinutes(a.time);
          const e = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        }) || null
      );
    },
    [visibleAppointments]
  );

  const handlePrev = () => {
    const next = new Date(safeCurrentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else next.setDate(next.getDate() - 7);
    onChangeDate?.(next);
  };

  const handleNext = () => {
    const next = new Date(safeCurrentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else next.setDate(next.getDate() + 7);
    onChangeDate?.(next);
  };

  const handleDragStart = (event) => {
    setActiveApptId(event?.active?.id ?? null);
  };

  const handleDragEnd = (event) => {
    const activeId = event?.active?.id;
    const overId = event?.over?.id;
    setActiveApptId(null);

    if (!activeId || !overId) return;

    const appt = (visibleAppointments || []).find((a) => a.id === activeId);
    if (!appt || isBlockItem(appt)) return;

    const parts = String(overId).split(":");
    if (parts[0] !== "slot") return;

    const newDate = parts[1];
    const newProfessionalId = Number(parts[2]);
    const newTime = `${parts[3]}:${parts[4]}`;
    const hour = `${parts[3]}:00`;

    const mapKey = `${newDate}|${newProfessionalId}|${hour}`;
    if (blockedSlots.has(mapKey)) {
      alert("No puedes mover una cita a un horario bloqueado.");
      return;
    }

    const oldStart = toMinutes(appt.time);
    const oldEnd = toMinutes(appt.endTime || addMinutesToTime(appt.time, 60));
    const durMin = Math.max(60, oldEnd - oldStart);

    const patch = {
      id: appt.id,
      date: newDate,
      time: newTime,
      endTime: addMinutesToTime(newTime, durMin),
      professionalId: newProfessionalId,
      agenda_tipo: agendaTipo,
    };

    onMoveAppointment?.(appt, patch);
  };

  function DroppableHourSlot({ id, disabled = false, children, onClick }) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled });

    return (
      <div
        ref={setNodeRef}
        onClick={onClick}
        className={[
          "relative w-full h-full transition",
          !disabled && isOver ? "ring-2 ring-cyan-300" : "",
          disabled ? "cursor-not-allowed" : "",
        ].join(" ")}
      >
        {children}
      </div>
    );
  }

  function PaidMark() {
    return (
      <span className="absolute left-0 top-0 bottom-0 w-3 bg-emerald-500 rounded-l-md flex items-center justify-center">
        <DollarSign className="h-3 w-3 text-white" />
      </span>
    );
  }

  function AppointmentBlock({ appt, layout, onClick }) {
    const isBlock = isBlockItem(appt);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: appt.id,
      disabled: isBlock,
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.35 : 1,
      cursor: isBlock ? "pointer" : "grab",
      top: layout.top,
      height: layout.height,
      left: layout.left,
      width: layout.width,
      zIndex: isDragging ? 20 : 10,
      backgroundColor: appt.__cardStyle?.backgroundColor,
      borderColor: appt.__cardStyle?.borderColor,
      color: appt.__cardStyle?.color || "#0f172a",
    };

    return (
      <button
        ref={setNodeRef}
        type="button"
        data-appt="1"
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setHoverAppt(null);
          setHoverRect(null);

          if (isBlock) {
            const rect = rectFromElement(e.currentTarget) || rectFromPoint(e.clientX, e.clientY);
            setSlotMenu({
              date: appt.date,
              hour: String(appt.time || "08:00").slice(0, 5),
              professionalId: appt.professionalId,
              hasBlock: true,
              blockItem: appt,
              preferUp: false,
              anchorRect: rect,
            });
            return;
          }

          onClick?.();
        }}
        onMouseEnter={(e) => {
          if (isMobile) return;
          const rect = rectFromElement(e.currentTarget) || rectFromPoint(e.clientX, e.clientY);
          setHoverRect(rect);
          setHoverAppt(appt);
        }}
        onMouseLeave={() => {
          if (isMobile) return;
          setHoverAppt(null);
          setHoverRect(null);
        }}
        className="absolute text-left rounded-md border shadow-sm hover:shadow-md transition overflow-hidden px-2 py-2 text-[11px]"
        {...(!isBlock ? listeners : {})}
        {...(!isBlock ? attributes : {})}
      >
        {appt.paid && !isBlock && <PaidMark />}

        <div className="pl-2 min-w-0">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={appt.__dotStyle} />
            <div className="font-semibold truncate">
              {isBlock ? "Horario bloqueado" : appt.patient || "Paciente"}
            </div>
          </div>

          <div className="text-[10px] opacity-90 truncate mt-1">
            {isBlock ? appt.motivo || "No disponible" : appt.service || "Servicio"}
          </div>

          {!isBlock && (
            <div className="text-[10px] opacity-80 truncate">
              {appt.professional || "Sin profesional"}
            </div>
          )}

          <div className="text-[10px] opacity-80 mt-1">
            {String(appt.time || "").slice(0, 5)}
            {appt.endTime ? ` – ${String(appt.endTime).slice(0, 5)}` : ""}
          </div>
        </div>
      </button>
    );
  }

  const openSlotMenu = useCallback(
    (e, { date, hour, professionalId, hasBlock }) => {
      const clickedAppt = e.target.closest?.("[data-appt='1']");
      if (clickedAppt) return;

      const rect = rectFromPoint(e.clientX, e.clientY);
      const blockItem = hasBlock ? findBlockForSlot({ dateIso: date, professionalId, hour }) : null;

      setSlotMenu({
        date,
        hour,
        professionalId,
        hasBlock: Boolean(hasBlock),
        blockItem,
        preferUp: false,
        anchorRect: rect,
      });
    },
    [findBlockForSlot]
  );

  function computeLayoutsForDay(items) {
    const appts = (items || [])
      .filter((a) => !isBlockItem(a))
      .map((a) => {
        const s = clamp(toMinutes(a.time), DAY_START_MIN, DAY_END_MIN);
        const eRaw = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
        const e = clamp(Math.max(eRaw, s + 60), DAY_START_MIN, DAY_END_MIN);
        return { ...a, __s: s, __e: e };
      })
      .sort((a, b) => a.__s - b.__s || (b.__e - b.__s) - (a.__e - a.__s));

    if (!appts.length) return new Map();

    const active = [];
    const usedCols = new Set();
    const colById = new Map();

    function releaseEnded(start) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].end <= start) {
          usedCols.delete(active[i].col);
          active.splice(i, 1);
        }
      }
    }

    function lowestFreeCol() {
      let c = 0;
      while (usedCols.has(c)) c++;
      return c;
    }

    for (const a of appts) {
      releaseEnded(a.__s);
      const col = lowestFreeCol();
      usedCols.add(col);
      active.push({ end: a.__e, col, id: a.id });
      colById.set(a.id, col);
    }

    const adj = new Map(appts.map((a) => [a.id, new Set()]));
    for (let i = 0; i < appts.length; i++) {
      for (let j = i + 1; j < appts.length; j++) {
        const A = appts[i];
        const B = appts[j];
        if (overlapsMinutes(A.__s, A.__e, B.__s, B.__e)) {
          adj.get(A.id).add(B.id);
          adj.get(B.id).add(A.id);
        }
      }
    }

    const visited = new Set();
    const groupMaxCols = new Map();

    for (const a of appts) {
      if (visited.has(a.id)) continue;

      const stack = [a.id];
      const comp = [];
      visited.add(a.id);

      while (stack.length) {
        const cur = stack.pop();
        comp.push(cur);
        for (const nb of adj.get(cur) || []) {
          if (!visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }

      let maxCol = 0;
      for (const id of comp) {
        const c = colById.get(id) ?? 0;
        maxCol = Math.max(maxCol, c);
      }
      const maxCols = maxCol + 1;
      for (const id of comp) groupMaxCols.set(id, maxCols);
    }

    const layouts = new Map();
    for (const a of appts) {
      const col = colById.get(a.id) ?? 0;
      const maxCols = groupMaxCols.get(a.id) ?? 1;

      const topPx = ((a.__s - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
      const heightPx = ((a.__e - a.__s) / 60) * HOUR_ROW_HEIGHT;

      const widthPct = 100 / maxCols;
      const leftPct = col * widthPct;

      const padding = 2;
      layouts.set(a.id, {
        top: topPx,
        height: Math.max(28, heightPx),
        left: `calc(${leftPct}% + ${padding}px)`,
        width: `calc(${widthPct}% - ${padding * 2}px)`,
      });
    }

    return layouts;
  }

  function computeBlockLayoutsForDay(items) {
    const blocks = (items || [])
      .filter(isBlockItem)
      .map((b) => {
        const s = clamp(toMinutes(b.time), DAY_START_MIN, DAY_END_MIN);
        const eRaw = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
        const e = clamp(Math.max(eRaw, s + 60), DAY_START_MIN, DAY_END_MIN);
        return { ...b, __s: s, __e: e };
      })
      .sort((a, b) => a.__s - b.__s);

    const layouts = new Map();
    for (const b of blocks) {
      const topPx = ((b.__s - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
      const heightPx = ((b.__e - b.__s) / 60) * HOUR_ROW_HEIGHT;
      layouts.set(b.id, {
        top: topPx,
        height: Math.max(28, heightPx),
        left: `0px`,
        width: `100%`,
      });
    }
    return layouts;
  }

  function DayColumn({ dateIso, professionalId }) {
    const dayItems = useMemo(() => {
      return (visibleAppointments || []).filter(
        (a) => a.date === dateIso && Number(a.professionalId) === Number(professionalId)
      );
    }, [dateIso, professionalId]);

    const blockLayouts = useMemo(() => computeBlockLayoutsForDay(dayItems), [dayItems]);
    const apptLayouts = useMemo(() => computeLayoutsForDay(dayItems), [dayItems]);

    const blockedByHour = useMemo(() => {
      const m = new Map();
      const blocks = (dayItems || []).filter(isBlockItem);

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const blk = blocks.find((b) => {
          const s = toMinutes(b.time);
          const e = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        });

        m.set(hour, blk || null);
      }
      return m;
    }, [dayItems]);

    const appointmentsByHour = useMemo(() => {
      const m = new Map();
      const appts = (dayItems || []).filter((a) => !isBlockItem(a));

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const overlapping = appts.filter((a) => {
          const s = toMinutes(a.time);
          const e = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        });

        m.set(hour, overlapping);
      }

      return m;
    }, [dayItems]);

    return (
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none">
          {showNowLine && dateIso === todayIso && (
            <div
              className="absolute left-0 right-0 z-[6] pointer-events-none"
              style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) }}
            >
              <div className="h-[2px] bg-rose-500/90 w-full" />
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </div>
          )}

          {HOURS.map((_, idx) => (
            <div
              key={idx}
              style={{ height: HOUR_ROW_HEIGHT }}
              className="border-b border-slate-300 border-dashed"
            />
          ))}
        </div>

        <div className="relative" style={{ height: GRID_TOTAL_HEIGHT }}>
          {HOURS.map((hour, idx) => {
            const y = idx * HOUR_ROW_HEIGHT;
            const slotId = `slot:${dateIso}:${professionalId}:${hour.slice(0, 2)}:00`;
            const blockItem = blockedByHour.get(hour);
            const hasBlock = Boolean(blockItem);
            const hasAppointments = (appointmentsByHour.get(hour) || []).length > 0;

            return (
              <div
                key={slotId}
                className="absolute left-0 right-0 px-1"
                style={{ top: y, height: HOUR_ROW_HEIGHT }}
              >
                <DroppableHourSlot
                  id={slotId}
                  disabled={hasBlock}
                  onClick={(e) => openSlotMenu(e, { date: dateIso, hour, professionalId, hasBlock })}
                >
                  <div className="group w-[98%] h-[98%] rounded-lg bg-white/70 p-1">
                    {!hasBlock && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = rectFromElement(e.currentTarget) || rectFromPoint(e.clientX, e.clientY);
                          setSlotMenu({
                            date: dateIso,
                            hour,
                            professionalId,
                            hasBlock: false,
                            preferUp: false,
                            anchorRect: rect,
                          });
                        }}
                        className={[
                          "absolute right-2 top-2 h-8 w-8 rounded-md border border-slate-200 bg-white shadow-sm flex items-center justify-center transition hover:bg-slate-50",
                          hasAppointments ? "z-[30]" : "z-[5]",
                          "opacity-0 group-hover:opacity-100",
                        ].join(" ")}
                        aria-label="Opciones de hora"
                        title="Opciones"
                      >
                        <Plus className="h-4 w-4 text-slate-600" />
                      </button>
                    )}
                  </div>
                </DroppableHourSlot>
              </div>
            );
          })}

          {(dayItems || [])
            .filter(isBlockItem)
            .map((b) => {
              const layout = blockLayouts.get(b.id);
              if (!layout) return null;
              return (
                <AppointmentBlock
                  key={b.id}
                  appt={b}
                  layout={layout}
                  onClick={() => onOpenAppointment?.(b)}
                />
              );
            })}

          {(dayItems || [])
            .filter((a) => !isBlockItem(a))
            .map((a) => {
              const layout = apptLayouts.get(a.id);
              if (!layout) return null;
              return (
                <AppointmentBlock
                  key={a.id}
                  appt={a}
                  layout={layout}
                  onClick={() => onOpenAppointment?.(a)}
                />
              );
            })}
        </div>
      </div>
    );
  }

  const allowedProfessionals = useMemo(() => {
    if (isProfessional && myUserId) {
      return (professionals || []).filter((p) => Number(p.id) === Number(myUserId));
    }

    if (canSeeAll) {
      return professionals || [];
    }

    return professionals || [];
  }, [professionals, isProfessional, myUserId, canSeeAll]);

  const professionalsInView = useMemo(() => {
    if (allowedProfessionals.length > 0) return allowedProfessionals;

    const ids = new Set(
      (visibleAppointments || [])
        .map((x) => Number(x.professionalId))
        .filter((v) => Number.isFinite(v))
    );

    return (professionals || []).filter((p) => ids.has(Number(p.id)));
  }, [allowedProfessionals, visibleAppointments, professionals]);

  const oneDayProfessionals = professionalsInView.length
    ? professionalsInView
    : isProfessional && myUserId
      ? (professionals || []).filter((p) => Number(p.id) === Number(myUserId))
      : professionals || [];
  return (
    <>
      <div className="flex flex-col w-full h-full min-h-0 overflow-hidden mb-10">
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="h-auto px-3 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 sticky top-0 z-[30]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-500">{tituloAgenda}</span>
                  <span className="text-sm font-semibold text-slate-800 truncate">{headerMainLabel}</span>
                  <span className="text-[11px] text-slate-500 truncate">
                    Agenda compartida por fisioterapeuta
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={`text-xs px-3 py-1 rounded-md border ${displayMode === "calendar"
                    ? "bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold"
                    : "bg-white text-slate-700 border-slate-300"
                    }`}
                  onClick={() => setDisplayMode("calendar")}
                >
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  Agenda
                </button>

                <button
                  className={`text-xs px-3 py-1 rounded-md border ${displayMode === "table"
                    ? "bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold"
                    : "bg-white text-slate-700 border-slate-300"
                    }`}
                  onClick={() => setDisplayMode("table")}
                >
                  <Table2 className="h-4 w-4 inline mr-1" />
                  Bitácora
                </button>

                <button
                  className={`text-xs px-3 py-1 rounded-md border ${viewMode === "day"
                    ? "bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold"
                    : "bg-white text-slate-700 border-slate-300"
                    }`}
                  onClick={() => setViewMode("day")}
                >
                  Día
                </button>

                {!isMobile && (
                  <button
                    className={`text-xs px-3 py-1 rounded-md border ${viewMode === "week"
                      ? "bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold"
                      : "bg-white text-slate-700 border-slate-300"
                      }`}
                    onClick={() => setViewMode("week")}
                  >
                    Semana
                  </button>
                )}

                {!isMobile && (
                  <button
                    className={[
                      "text-xs px-3 py-1 rounded-md border",
                      includeSunday
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white hover:bg-slate-50 text-slate-600 border-slate-300",
                    ].join(" ")}
                    onClick={() => setIncludeSunday((v) => !v)}
                  >
                    Domingo
                  </button>
                )}

                <button
                  className="text-xs px-3 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600"
                  onClick={() => {
                    const defaultProfessionalId =
                      oneDayProfessionals[0]?.id || myUserId || null;

                    onOpenBlockModal?.({
                      date: dateKey(safeCurrentDate),
                      startTime: "08:00",
                      endTime: "09:00",
                      professionalId: defaultProfessionalId,
                    });
                  }}
                >
                  Bloquear rango
                </button>

                <button
                  onClick={() => {
                    const defaultProfessionalId =
                      oneDayProfessionals[0]?.id || myUserId || null;

                    onNewReservation?.({
                      date: dateKey(safeCurrentDate),
                      professionalId: defaultProfessionalId,
                      agenda_tipo: agendaTipo,
                    });
                  }}
                  className="inline-flex h-9 items-center rounded-md bg-cyan-500 text-white px-3 text-xs font-semibold shadow-sm hover:bg-cyan-600 transition"
                >
                  + Nueva cita
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {(oneDayProfessionals || []).map((pro) => {
                const label =
                  `${pro.first_name || ""} ${pro.last_name || ""}`.trim() || pro.username || `Profesional ${pro.id}`;

                return (
                  <div key={pro.id} className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: pro.color_agenda || "#06b6d4" }} />
                    {label}
                  </div>
                );
              })}

              <div className="inline-flex items-center gap-2 text-xs text-slate-700">
                <span className="h-3 w-3 rounded-full bg-violet-500" />
                Horario bloqueado
              </div>
            </div>
          </div>

          <AgendaSummaryCards appointments={visibleAppointments} />

          <div className="flex-1 overflow-auto bg-white min-h-0">
            {displayMode === "table" ? (
              <TableView appointments={visibleAppointments} weekDays={weekDays} professionalsMap={professionalsMap} />
            ) : (
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className={isMobile ? "min-w-0" : "min-w-[1200px]"}>
                  {viewMode === "day" && (
                    <>
                      <div
                        className="grid border-b border-slate-200 bg-slate-50 text-xs text-slate-500"
                        style={{
                          gridTemplateColumns: `64px repeat(${oneDayProfessionals.length || 1}, minmax(220px, 1fr))`,
                        }}
                      >
                        <div className="p-2 text-right pr-3">Hora</div>

                        {(oneDayProfessionals || []).map((pro) => {
                          const label =
                            `${pro.first_name || ""} ${pro.last_name || ""}`.trim() || pro.username;
                          return (
                            <div key={pro.id} className="p-2 font-medium">
                              {label}
                            </div>
                          );
                        })}
                      </div>

                      <div
                        className="grid text-xs"
                        style={{
                          gridTemplateColumns: `64px repeat(${oneDayProfessionals.length || 1}, minmax(220px, 1fr))`,
                        }}
                      >
                        <div
                          className="border-r border-slate-200 bg-slate-50 text-right pr-3 relative"
                          style={{ height: GRID_TOTAL_HEIGHT }}
                        >
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              style={{ height: HOUR_ROW_HEIGHT }}
                              className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                            >
                              {hour}
                            </div>
                          ))}

                          {showNowLine && keyDate === todayIso && (
                            <div
                              className="absolute right-2 z-[10] pointer-events-none"
                              style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) - 8 }}
                            >
                              <div className="px-2 py-1 rounded-full bg-rose-500 text-white text-[10px] shadow">
                                {nowLabel}
                              </div>
                            </div>
                          )}
                        </div>

                        {(oneDayProfessionals || []).map((pro) => (
                          <div key={pro.id} className="border-r border-slate-100 relative">
                            <DayColumn dateIso={keyDate} professionalId={pro.id} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {viewMode === "week" && !isMobile && (
                    <>
                      {groupedByDay.map((day) => (
                        <div key={day.key} className="mb-8">
                          <div className="sticky top-0 z-10 px-4 py-3 bg-slate-100 border-y border-slate-200 text-sm font-semibold text-slate-800">
                            {day.label}
                          </div>

                          <div
                            className="grid text-xs"
                            style={{
                              gridTemplateColumns: `64px repeat(${oneDayProfessionals.length || 1}, minmax(220px, 1fr))`,
                            }}
                          >
                            <div
                              className="border-r border-slate-200 bg-slate-50 text-right pr-3 relative"
                              style={{ height: GRID_TOTAL_HEIGHT }}
                            >
                              {HOURS.map((hour) => (
                                <div
                                  key={hour}
                                  style={{ height: HOUR_ROW_HEIGHT }}
                                  className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                                >
                                  {hour}
                                </div>
                              ))}

                              {showNowLine && day.key === todayIso && weekHasToday && (
                                <div
                                  className="absolute right-2 z-[10] pointer-events-none"
                                  style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) - 8 }}
                                >
                                  <div className="px-2 py-1 rounded-full bg-rose-500 text-white text-[10px] shadow">
                                    {nowLabel}
                                  </div>
                                </div>
                              )}
                            </div>

                            {(oneDayProfessionals || []).map((pro) => (
                              <div key={`${day.key}-${pro.id}`} className="border-r border-slate-100 relative">
                                <div className="p-2 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                                  {`${pro.first_name || ""} ${pro.last_name || ""}`.trim() || pro.username}
                                </div>
                                <DayColumn dateIso={day.key} professionalId={pro.id} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {typeof document !== "undefined"
                  ? createPortal(
                    <DragOverlay>
                      {activeAppt ? (
                        <div
                          className="rounded-md border text-[11px] px-2 py-1 shadow-md"
                          style={{
                            backgroundColor: activeAppt.__cardStyle?.backgroundColor,
                            borderColor: activeAppt.__cardStyle?.borderColor,
                            color: activeAppt.__cardStyle?.color || "#0f172a",
                          }}
                        >
                          <div className="font-semibold truncate">
                            {isBlockItem(activeAppt) ? "Horario bloqueado" : activeAppt.patient}
                          </div>
                          <div className="text-[10px] opacity-80">
                            {isBlockItem(activeAppt) ? activeAppt.motivo || "No disponible" : activeAppt.service}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>,
                    document.body
                  )
                  : null}
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {!isMobile && (
        <HoverCard open={Boolean(hoverAppt)} anchorRect={hoverRect}>
          {hoverAppt && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                {isBlockItem(hoverAppt) ? "Horario bloqueado" : hoverAppt.patient}
              </div>

              {!isBlockItem(hoverAppt) && (
                <>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Doctor:</span> {hoverAppt.professional}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Servicio:</span> {hoverAppt.service}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Costo:</span> ${safeMoney(hoverAppt.price)}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Estado:</span> {hoverAppt.status}
                  </div>
                </>
              )}

              <div className="text-[11px] text-slate-600">
                <span className="font-semibold">Horario:</span> {String(hoverAppt.time || "").slice(0, 5)}
                {hoverAppt.endTime ? ` – ${String(hoverAppt.endTime).slice(0, 5)}` : ""}
              </div>

              {isBlockItem(hoverAppt) && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">Motivo:</span> {hoverAppt.motivo || "No disponible"}
                </div>
              )}
            </div>
          )}
        </HoverCard>
      )}

      <MenuPopover
        open={Boolean(slotMenu)}
        anchorRect={slotMenu?.anchorRect}
        preferUp={Boolean(slotMenu?.preferUp)}
        onClose={() => setSlotMenu(null)}
      >
        <div className="px-2 py-1">
          <div className="text-[11px] font-semibold text-slate-700">
            {slotMenu?.hour} · {slotMenu?.date}
          </div>
          <div className="text-[10px] text-slate-500">
            {slotMenu?.hasBlock ? "Este horario está bloqueado" : "Elige una acción"}
          </div>
        </div>

        <div className="mt-2 grid gap-2">
          {!slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;

                onNewReservation?.({
                  date: s.date,
                  time: s.hour,
                  professionalId: s.professionalId,
                  agenda_tipo: agendaTipo,
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700"
            >
              <Plus className="h-4 w-4" />
              Agendar cita nueva
            </button>
          )}

          {slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const b = slotMenu?.blockItem;
                setSlotMenu(null);
                if (!b) return;
                onDeleteBlock?.(b);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 text-sm text-rose-700"
            >
              Eliminar bloqueo
            </button>
          )}

          {!slotMenu?.hasBlock ? (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;
                onOpenBlockModal?.({
                  date: s.date,
                  startTime: s.hour,
                  professionalId: s.professionalId,
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700"
            >
              <Ban className="h-4 w-4" />
              Bloquear horario
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
            >
              <Ban className="h-4 w-4" />
              Horario ya bloqueado
            </button>
          )}
        </div>
      </MenuPopover>
    </>
  );
}