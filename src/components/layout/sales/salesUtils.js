// src/components/layout/sales/salesUtils.js
export const SALES_SIDEBAR_STORAGE_KEY = "sales_sidebar_filters_v1";

export function defaultSalesSidebarFilters() {
  const now = new Date();
  const from = toDateKey(startOfMonth(now));
  const to = toDateKey(endOfMonth(now));

  return {
    mode: "mensual",
    preset: "month",
    group: "month",
    fromKey: from,
    toKey: to,
    professionalId: "",
  };
}

export function readSalesSidebarFilters() {
  try {
    const raw = localStorage.getItem(SALES_SIDEBAR_STORAGE_KEY);
    if (!raw) return defaultSalesSidebarFilters();
    return { ...defaultSalesSidebarFilters(), ...JSON.parse(raw) };
  } catch {
    return defaultSalesSidebarFilters();
  }
}

export function emitSalesFilters(next) {
  try {
    localStorage.setItem(SALES_SIDEBAR_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent("sales:filters:change", { detail: next }),
  );
  window.dispatchEvent(new CustomEvent("sales:filters:sync", { detail: next }));
}

export function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const deltaToMonday = (jsDay + 6) % 7;
  d.setDate(d.getDate() - deltaToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeekSunday(date) {
  const monday = startOfWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfYear(date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfYear(date) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function clampRange(fromKey, toKey) {
  if (!fromKey || !toKey) return { fromKey, toKey };
  if (fromKey <= toKey) return { fromKey, toKey };
  return { fromKey: toKey, toKey: fromKey };
}

export function inRange(dateKey, fromKey, toKey) {
  if (!dateKey) return false;
  if (!fromKey || !toKey) return true;
  return dateKey >= fromKey && dateKey <= toKey;
}

export function money(n) {
  const v = Number(n || 0);
  return `$ ${v.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function safeStr(x, fallback = "") {
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

export function formatLabelDate(key) {
  if (!key) return "-";
  const d = new Date(`${key}T00:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function groupPaymentsVisual(payments) {
  const map = new Map();

  for (const p of payments || []) {
    const citaId = p.cita;
    const key = String(citaId ?? p.id);

    if (!map.has(key)) {
      map.set(key, {
        key,
        cita: citaId,
        paciente_nombre: p.paciente_nombre,
        servicio_nombre: p.servicio_nombre,
        profesional_nombre: p.profesional_nombre,
        profesional_id: p.profesional_id,
        fecha_cita: p.fecha_cita,
        monto_facturado: Number(p.monto_facturado || 0),
        descuento_porcentaje: Number(p.descuento_porcentaje || 0),
        pagos: [],
      });
    }

    const g = map.get(key);
    g.monto_facturado = Math.max(
      g.monto_facturado,
      Number(p.monto_facturado || 0),
    );
    g.descuento_porcentaje = Math.max(
      g.descuento_porcentaje,
      Number(p.descuento_porcentaje || 0),
    );

    g.pagos.push({
      id: p.id,
      fecha_pago: p.fecha_pago,
      metodo_pago: p.metodo_pago,
      anticipo: Number(p.anticipo || 0),
      comprobante: p.comprobante || "",
      restante_raw: Number(p.restante || 0),
      _raw: p,
    });
  }

  const out = Array.from(map.values()).map((g) => {
    g.pagos.sort((a, b) => {
      const da = String(a.fecha_pago || "");
      const db = String(b.fecha_pago || "");
      if (da === db) return Number(b.id) - Number(a.id);
      return db.localeCompare(da);
    });

    const totalPagado = g.pagos.reduce(
      (acc, x) => acc + Number(x.anticipo || 0),
      0,
    );
    const descPct = Number(g.descuento_porcentaje || 0);
    const totalConDesc = Math.max(
      g.monto_facturado - (g.monto_facturado * descPct) / 100,
      0,
    );
    const restanteCalc = Math.max(totalConDesc - totalPagado, 0);
    const fechaPago = g.pagos[0]?.fecha_pago || "";

    const methodMap = new Map();
    for (const x of g.pagos) {
      const m = safeStr(x.metodo_pago, "sin método");
      methodMap.set(m, (methodMap.get(m) || 0) + Number(x.anticipo || 0));
    }

    const methods = Array.from(methodMap.entries()).map(([metodo, monto]) => ({
      metodo,
      monto,
    }));

    return {
      ...g,
      fecha_pago: fechaPago,
      total_pagado: totalPagado,
      total_con_desc: totalConDesc,
      restante_calc: restanteCalc,
      estado_pago: restanteCalc <= 0 ? "Pagado" : "Parcial",
      methods,
      paymentIds: g.pagos.map((x) => x.id),
      representativePayment: g.pagos[0]?._raw || null,
    };
  });

  out.sort((a, b) =>
    String(b.fecha_pago || "").localeCompare(String(a.fecha_pago || "")),
  );
  return out;
}

export function buildChartSeries(stats) {
  const rows = stats?.series || stats?.timeline || stats?.chart || [];
  if (Array.isArray(rows) && rows.length) {
    return rows.map((x, index) => ({
      key: safeStr(
        x.label || x.periodo || x.key || `P${index + 1}`,
        `P${index + 1}`,
      ),
      ingresos: Number(x.total_cobrado || x.ingresos || 0),
      pacientes: Number(x.pacientes || x.total_pacientes || x.asistencias || 0),
      canceladas: Number(x.canceladas || 0),
    }));
  }

  return (stats?.revenue_by_service || []).map((x, index) => ({
    key: safeStr(x.cita__servicio__nombre, `Servicio ${index + 1}`),
    ingresos: Number(x.total || 0),
    pacientes: 0,
    canceladas: 0,
  }));
}
