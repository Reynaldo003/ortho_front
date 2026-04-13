// src/components/layout/sales/SalesView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { subscribeSalesRefresh, notifySalesRefresh } from "../../../utils/salesSync";
import {
  readSalesSidebarFilters,
  emitSalesFilters,
  clampRange,
  inRange,
  money,
  safeStr,
  formatLabelDate,
  groupPaymentsVisual,
  buildChartSeries,
  toDateKey,
  startOfWeekMonday,
  endOfWeekSunday,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "./salesUtils";
import {
  Card,
  Button,
  Badge,
  Stat,
  SectionHeader,
  SalesTable,
  CHART_COLORS,
} from "./SalesUiParts";
import { DeletePaymentModal, PaymentDetailModal } from "./SalesModals";

const API_BASE = "https://ortho-clinic-cordoba.cloud";

export function SalesView() {
  const sidebarDefaults = readSalesSidebarFilters();

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [professionals, setProfessionals] = useState([]);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    title: "",
    hint: "",
    ids: [],
    citaId: null,
  });

  const [mode, setMode] = useState(sidebarDefaults.mode || "mensual");
  const [preset, setPreset] = useState(sidebarDefaults.preset || "month");
  const [group, setGroup] = useState(sidebarDefaults.group || "month");
  const [fromKey, setFromKey] = useState(sidebarDefaults.fromKey);
  const [toKey, setToKey] = useState(sidebarDefaults.toKey);
  const [professionalId, setProfessionalId] = useState(sidebarDefaults.professionalId || "");
  const [appliedRange, setAppliedRange] = useState(() =>
    clampRange(sidebarDefaults.fromKey, sidebarDefaults.toKey)
  );

  useEffect(() => {
    function handleExternalFilters(e) {
      const next = e?.detail || readSalesSidebarFilters();

      setMode(next.mode || "mensual");
      setPreset(next.preset || "month");
      setGroup(next.group || "month");
      setFromKey(next.fromKey || "");
      setToKey(next.toKey || "");
      setProfessionalId(next.professionalId || "");
      setAppliedRange(clampRange(next.fromKey || "", next.toKey || ""));
    }

    const initial = readSalesSidebarFilters();
    window.dispatchEvent(new CustomEvent("sales:filters:sync", { detail: initial }));
    window.addEventListener("sales:filters:change", handleExternalFilters);

    return () => {
      window.removeEventListener("sales:filters:change", handleExternalFilters);
    };
  }, []);

  const syncSidebarFilters = (patch) => {
    const next = {
      mode,
      preset,
      group,
      fromKey,
      toKey,
      professionalId,
      ...patch,
    };
    emitSalesFilters(next);
  };

  const applyRange = (range) => {
    const clamped = clampRange(range.fromKey, range.toKey);
    setAppliedRange(clamped);
    syncSidebarFilters({
      fromKey: clamped.fromKey,
      toKey: clamped.toKey,
    });
  };

  const setPresetRange = (id) => {
    const today = new Date();
    let from = today;
    let to = today;
    let nextMode = mode;

    if (id === "day") {
      from = new Date(today);
      to = new Date(today);
      nextMode = "semanal";
    } else if (id === "week") {
      from = startOfWeekMonday(today);
      to = endOfWeekSunday(today);
      nextMode = "semanal";
    } else if (id === "month") {
      from = startOfMonth(today);
      to = endOfMonth(today);
      nextMode = "mensual";
    } else if (id === "year") {
      from = startOfYear(today);
      to = endOfYear(today);
      nextMode = "anual";
    }

    const f = toDateKey(from);
    const t = toDateKey(to);

    setMode(nextMode);
    setPreset(id);
    setFromKey(f);
    setToKey(t);
    setAppliedRange({ fromKey: f, toKey: t });

    syncSidebarFilters({
      mode: nextMode,
      preset: id,
      fromKey: f,
      toKey: t,
    });
  };

  const fetchStats = async (token, from, to, groupBy, profesional) => {
    const qp = new URLSearchParams();
    qp.set("from", from);
    qp.set("to", to);
    qp.set("group", groupBy);
    if (profesional) qp.set("profesional", profesional);

    const resp = await fetch(`${API_BASE}/api/dashboard-stats/?${qp.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`dashboard-stats error: ${resp.status} ${text}`);
    }

    return resp.json();
  };

  const loadAll = async (modeLoad = "initial") => {
    const token = localStorage.getItem("auth.access");
    if (!token) return;

    try {
      if (modeLoad === "initial") setLoading(true);
      else setApplying(true);

      const { fromKey: from, toKey: to } = appliedRange;

      const [statsData, paymentsResp, prosResp] = await Promise.all([
        fetchStats(token, from, to, group, professionalId),
        fetch(`${API_BASE}/api/pagos/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/profesionales/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsData);

      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json();
        setPayments(paymentsData || []);
      } else {
        console.error("No se pudo cargar /api/pagos/");
        setPayments([]);
      }

      if (prosResp.ok) {
        const pros = await prosResp.json();
        setProfessionals(pros || []);

        window.dispatchEvent(
          new CustomEvent("sales:sidebar:data", {
            detail: {
              professionals: (pros || []).map((p) => ({
                id: p.id,
                label: (p.first_name || p.last_name)
                  ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
                  : p.username,
              })),
            },
          })
        );
      } else {
        setProfessionals([]);
      }
    } catch (err) {
      console.error("Error cargando estadísticas o pagos:", err);
      setPayments([]);
      setProfessionals([]);
    } finally {
      setLoading(false);
      setApplying(false);
    }
  };

  const refreshAfterMutations = async () => loadAll("apply");

  useEffect(() => {
    const unsub = subscribeSalesRefresh(() => {
      loadAll("apply");
    });
    return unsub;
  }, []);

  useEffect(() => {
    loadAll("initial");
  }, []);

  useEffect(() => {
    loadAll("apply");
  }, [appliedRange.fromKey, appliedRange.toKey, group, professionalId]);

  const filteredPayments = useMemo(() => {
    const { fromKey: f, toKey: t } = appliedRange;
    return (payments || [])
      .filter((p) => inRange(p.fecha_cita, f, t))
      .filter((p) =>
        professionalId ? String(p.profesional_id) === String(professionalId) : true
      );
  }, [payments, appliedRange, professionalId]);

  const visualRows = useMemo(() => groupPaymentsVisual(filteredPayments), [filteredPayments]);

  const handleExportPayments = () => {
    if (!visualRows.length) return;

    const headers = [
      "Cita",
      "Fecha pago",
      "Paciente",
      "Profesional",
      "Servicio",
      "Métodos (desglose)",
      "Estado pago",
      "Pagado total",
      "Monto facturado",
      "Descuento (%)",
      "Restante",
      "IDs pagos",
    ];

    const rows = visualRows.map((r) => [
      r.cita,
      r.fecha_pago,
      r.paciente_nombre,
      r.profesional_nombre,
      r.servicio_nombre,
      r.methods.map((m) => `${m.metodo}: ${Number(m.monto).toFixed(2)}`).join(" | "),
      r.estado_pago,
      Number(r.total_pagado || 0).toFixed(2),
      Number(r.monto_facturado || 0).toFixed(2),
      Number(r.descuento_porcentaje || 0).toFixed(2),
      Number(r.restante_calc || 0).toFixed(2),
      r.paymentIds.join(";"),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const value = String(cell ?? "");
              return value.includes(",") ? `"${value}"` : value;
            })
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fisionerv-ventas.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTicketPdf = async (paymentId) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return;

    try {
      const resp = await fetch(`${API_BASE}/api/pagos/${paymentId}/ticket/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        alert("No se pudo generar el PDF del ticket.");
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_pago_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error de red generando el ticket.");
    }
  };

  const handleAskDelete = (row) => {
    const ids = row?.paymentIds || [];
    if (!ids.length) return;

    setDeleteModal({
      open: true,
      title: "Eliminar venta (cita pagada)",
      hint:
        ids.length > 1
          ? `Esta venta tiene ${ids.length} pagos. Se eliminará la CITA y todos los pagos.`
          : `Se eliminará la CITA pagada y su pago #${ids[0]}.`,
      ids,
      citaId: row?.cita,
    });
  };

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem("auth.access");
    const citaId = deleteModal.citaId;
    const ids = deleteModal.ids || [];

    if (!token || !citaId) {
      setDeleteModal((s) => ({ ...s, open: false }));
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/pagos/by-cita/${citaId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok && resp.status !== 204) {
        const err = await resp.text().catch(() => "");
        console.error("No se pudo eliminar venta por cita", citaId, resp.status, err);
        alert("No se pudo eliminar la venta (cita). Revisa consola.");
        return;
      }

      setDeleteModal((s) => ({ ...s, open: false, ids: [], citaId: null }));

      setPayments((prev) =>
        prev.filter(
          (p) =>
            String(p.cita) !== String(citaId) &&
            !ids.map(String).includes(String(p.id))
        )
      );

      await refreshAfterMutations();
      notifySalesRefresh();

      try {
        window.dispatchEvent(new Event("fisionerv:agenda-refresh"));
      } catch {
        // ignore
      }
    } catch (e) {
      console.error(e);
      alert("Error de red eliminando la venta.");
    }
  };

  const kpis = stats?.kpis || {};
  const totalAsistencias = Number(kpis.total_asistencias || 0);
  const totalCobrado = Number(kpis.total_cobrado || 0);
  const totalPagos = Number(kpis.total_pagos || 0);
  const pacientesNuevos = Number(kpis.pacientes_nuevos || 0);

  const paymentPie = (stats?.payments_by_method || []).map((m) => ({
    name: safeStr(m.metodo_pago, "Sin método"),
    value: Number(m.total || 0),
  }));

  const serviceBarData = (stats?.revenue_by_service || []).map((s, index) => ({
    key: safeStr(s.cita__servicio__nombre, `Servicio ${index + 1}`),
    ingresos: Number(s.total || 0),
  }));

  const patientStatusMap = (stats?.patient_status_totals || []).reduce((acc, x) => {
    acc[x.estado_tratamiento] = Number(x.count || 0);
    return acc;
  }, {});

  const patientPie = [
    { name: "En tratamiento", value: patientStatusMap.en_tratamiento || 0 },
    { name: "Dado de alta", value: patientStatusMap.alta || 0 },
  ];

  useMemo(() => buildChartSeries(stats), [stats]);

  if (loading || !stats) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando estadísticas de ventas...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-50">
      <div className="mx-auto max-w-[1700px] space-y-5 p-4 sm:p-6">
        <SectionHeader
          title="Panel de ingresos"
          subtitle="Analisis de rendimiento de la clinica."
          right={
            <>
              <Button
                variant={mode === "semanal" ? "primary" : "soft"}
                onClick={() => setPresetRange("week")}
              >
                Semanal
              </Button>
              <Button
                variant={mode === "mensual" ? "primary" : "soft"}
                onClick={() => setPresetRange("month")}
              >
                Mensual
              </Button>
              <Button
                variant={mode === "anual" ? "primary" : "soft"}
                onClick={() => setPresetRange("year")}
              >
                Anual
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat
            title="Ingresos cobrados"
            value={money(totalCobrado)}
            hint={`Rango: ${appliedRange.fromKey} → ${appliedRange.toKey}`}
          />
          <Stat
            title="Pagos registrados"
            value={totalPagos.toLocaleString("es-MX")}
            hint="Número de pagos registrados en el rango."
          />
          <Stat
            title="Asistencias"
            value={totalAsistencias.toLocaleString("es-MX")}
            hint="Citas completadas dentro del periodo."
          />
          <Stat
            title="Pacientes nuevos"
            value={pacientesNuevos.toLocaleString("es-MX")}
            hint="Altas detectadas por fecha de registro."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4 lg:col-span-2">
            <div className="text-sm font-extrabold text-slate-900">Ingresos por servicio</div>
            <div className="mt-1 text-xs text-slate-500">
              Distribución del dinero cobrado según el servicio.
            </div>
            <div className="mt-4 h-[280px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceBarData}>
                  <XAxis dataKey="key" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar dataKey="ingresos" fill="#3dc2d5" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-extrabold text-slate-900">Ingresos por método</div>
            <div className="mt-1 text-xs text-slate-500">
              Mix de cobro según el método de pago usado.
            </div>
            <div className="mt-4 h-[280px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Tooltip formatter={(value) => money(value)} />
                  <Pie data={paymentPie} dataKey="value" nameKey="name" outerRadius={100}>
                    {paymentPie.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-extrabold text-slate-900">Pacientes</div>
            <div className="mt-1 text-xs text-slate-500">
              Estado general del paciente dentro del panel.
            </div>
            <div className="mt-4 h-[240px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Tooltip />
                  <Pie data={patientPie} dataKey="value" nameKey="name" outerRadius={90}>
                    <Cell fill="#6cc067" />
                    <Cell fill="#f79034" />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="success">En tratamiento: {patientPie[0].value}</Badge>
              <Badge tone="warn">Alta: {patientPie[1].value}</Badge>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tabla de control de ventas</h3>
              <p className="text-sm text-slate-500">
                Mostrando pagos desde {appliedRange.fromKey} hasta {appliedRange.toKey}.
              </p>
            </div>

            <Button onClick={handleExportPayments} variant="outline">
              Exportar a Excel
            </Button>
          </div>

          <div className="mt-4">
            <SalesTable
              rows={visualRows}
              onEdit={(rep) => setSelectedPayment(rep)}
              onTicket={handleTicketPdf}
              onDelete={handleAskDelete}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold">Profesional:</span>{" "}
              {professionalId
                ? professionals.find((p) => String(p.id) === String(professionalId))
                  ? ((professionals.find((p) => String(p.id) === String(professionalId)).first_name || professionals.find((p) => String(p.id) === String(professionalId)).last_name)
                    ? `${professionals.find((p) => String(p.id) === String(professionalId)).first_name || ""} ${professionals.find((p) => String(p.id) === String(professionalId)).last_name || ""}`.trim()
                    : professionals.find((p) => String(p.id) === String(professionalId)).username)
                  : "Todos"
                : "Todos"}
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold">Rango aplicado:</span>{" "}
              {formatLabelDate(appliedRange.fromKey)} → {formatLabelDate(appliedRange.toKey)}
            </div>
          </div>
        </Card>
      </div>

      {selectedPayment ? (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdated={(updated) => {
            setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setSelectedPayment(null);
          }}
        />
      ) : null}

      <DeletePaymentModal
        open={deleteModal.open}
        title={deleteModal.title}
        hint={deleteModal.hint}
        onClose={() => setDeleteModal((s) => ({ ...s, open: false }))}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}