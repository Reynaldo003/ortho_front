import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Package, AlertTriangle, Pill } from "lucide-react";
import { SupplyForm } from "./SupplyForm";

const API_BASE = "https://ortho-clinic-cordoba.cloud";

function getAuthToken() {
  // ✅ prioridad al esquema que usa tu login actual
  const access = localStorage.getItem("auth.access");
  if (access && access !== "undefined" && access !== "null") {
    return access;
  }

  // ✅ compatibilidad secundaria por si en otra parte del proyecto existe { token }
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
      if (parsed?.access) return parsed.access;
    }
  } catch { }

  return "";
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = "Ocurrió un error.";
    try {
      const data = await res.json();

      if (typeof data?.detail === "string") {
        detail = data.detail;
      } else if (Array.isArray(data?.detail)) {
        detail = data.detail.join(" ");
      } else if (data && typeof data === "object") {
        const flat = Object.entries(data)
          .flatMap(([key, value]) => {
            if (Array.isArray(value)) return value.map((v) => `${key}: ${v}`);
            if (typeof value === "string") return [`${key}: ${value}`];
            return [];
          })
          .join(" ");
        if (flat) detail = flat;
      }
    } catch { }

    if (res.status === 401) {
      detail = "Tu sesión no es válida o expiró. Cierra sesión e inicia sesión otra vez.";
    }

    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function InsumosView() {
  const [supplies, setSupplies] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    lowCount: 0,
    meds: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const [kardexOpen, setKardexOpen] = useState(false);
  const [kardexItem, setKardexItem] = useState(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [cat, setCat] = useState("ALL");

  async function loadStats() {
    try {
      const data = await apiFetch("/api/insumos/stats/");
      setStats({
        total: Number(data?.total || 0),
        lowCount: Number(data?.lowCount || 0),
        meds: Number(data?.meds || 0),
      });
    } catch (err) {
      console.error("[INSUMOS][STATS]", err);
      throw err;
    }
  }

  async function loadSupplies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (q.trim()) params.set("q", q.trim());
      if (status !== "ALL") params.set("status", status);
      if (cat !== "ALL") params.set("categoria", cat);

      const qs = params.toString();
      const data = await apiFetch(`/api/insumos/${qs ? `?${qs}` : ""}`);
      setSupplies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[INSUMOS][LIST]", err);
      setSupplies([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadSupplies(), loadStats()]);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await Promise.all([loadSupplies(), loadStats()]);
      } catch (err) {
        if (!cancelled) {
          alert(err.message || "No se pudieron cargar los insumos.");
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        await loadSupplies();
      } catch (err) {
        alert(err.message || "No se pudieron cargar los insumos.");
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, status, cat]);

  const categories = useMemo(() => {
    const set = new Set(
      supplies.map((s) => String(s.categoria || "Insumo").trim()).filter(Boolean)
    );
    return ["ALL", ...Array.from(set)];
  }, [supplies]);

  async function removeSupply(r) {
    const ok = window.confirm(`¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    try {
      await apiFetch(`/api/insumos/${r.id}/`, {
        method: "DELETE",
      });
      await refreshAll();
    } catch (err) {
      alert(err.message || "No se pudo eliminar el insumo.");
    }
  }

  async function inc(r, delta) {
    try {
      setSaving(true);

      const updated = await apiFetch(`/api/insumos/${r.id}/inc/`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      });

      setSupplies((prev) => prev.map((x) => (x.id === r.id ? updated : x)));

      if (kardexItem?.id === r.id) {
        setKardexItem(updated);
      }

      await loadStats();
    } catch (err) {
      alert(err.message || "No se pudo actualizar la cantidad.");
    } finally {
      setSaving(false);
    }
  }

  async function openKardex(r) {
    try {
      const fresh = await apiFetch(`/api/insumos/${r.id}/`);
      setKardexItem(fresh);
      setKardexOpen(true);
    } catch (err) {
      alert(err.message || "No se pudo abrir el kardex.");
    }
  }

  async function addMovement({ tipo, cantidad, motivo }) {
    if (!kardexItem) return;

    try {
      setSaving(true);

      const resp = await apiFetch(`/api/insumos/${kardexItem.id}/movimiento/`, {
        method: "POST",
        body: JSON.stringify({
          tipo,
          cantidad,
          motivo,
        }),
      });

      const updated = resp?.insumo;
      if (!updated) {
        await refreshAll();
        return;
      }

      setSupplies((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );
      setKardexItem(updated);

      await loadStats();
    } catch (err) {
      alert(err.message || "No se pudo guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(payload) {
    try {
      setSaving(true);

      await apiFetch("/api/insumos/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOpen(false);
      await refreshAll();
    } catch (err) {
      alert(err.message || "No se pudo crear el insumo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload) {
    if (!edit) return;

    try {
      setSaving(true);

      await apiFetch(`/api/insumos/${edit.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setEdit(null);
      await refreshAll();
    } catch (err) {
      alert(err.message || "No se pudo actualizar el insumo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Control de insumos"
        subtitle="Registro general de insumos y medicamentos con stock mínimo."
        right={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-[320px] rounded-2xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="Buscar por nombre o categoría..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
              <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Agregar insumo
              </Button>
            </div>
          </div>
        }
      />

      <Card className="p-4 lg:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            placeholder="Buscar por nombre o categoría..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
        <Kpi icon={Package} title="Total" value={stats.total} />
        <Kpi
          icon={AlertTriangle}
          title="Bajo stock"
          value={stats.lowCount}
          tone={stats.lowCount > 0 ? "warn" : "ok"}
        />
        <Kpi icon={Pill} title="Medicamentos" value={stats.meds} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <PillButton active={status === "ALL"} onClick={() => setStatus("ALL")} label="Todos" />
            <PillButton active={status === "LOW"} onClick={() => setStatus("LOW")} label="Bajo stock" />
            <PillButton active={status === "OK"} onClick={() => setStatus("OK")} label="OK" />
          </div>

          <div className="grid grid-cols-1 gap-1">
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="ALL">Todas las categorías</option>
              <option value="Insumo">Insumo</option>
              <option value="Medicamento">Medicamento</option>
              {categories
                .filter((c) => !["ALL", "Insumo", "Medicamento"].includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Insumo</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Movimientos</th>
                <th className="px-4 py-3 font-semibold">Acciones rápidas</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Cargando insumos...
                  </td>
                </tr>
              ) : supplies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No hay insumos registrados.
                  </td>
                </tr>
              ) : (
                supplies.map((r) => {
                  const qty = Number(r.cantidad || 0);
                  const min = Number(r.minimo || 0);
                  const low = qty <= min;
                  const denom = Math.max(1, min || 1);
                  const pct = Math.min(100, Math.round((qty / denom) * 100));

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">{r.nombre}</div>
                          {r.notas ? (
                            <div className="mt-1 truncate text-xs text-slate-500">{r.notas}</div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone="neutral">{r.categoria || "Insumo"}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-[240px]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">{qty}</div>
                            <div className="text-xs text-slate-500">
                              Mín: <span className="font-semibold text-slate-900">{min}</span>
                            </div>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <div
                              className={low ? "h-full bg-amber-400/80" : "h-full bg-emerald-400/80"}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <Badge tone={low ? "warn" : "ok"}>{low ? "Bajo" : "OK"}</Badge>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {(r.movimientos || []).length}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex min-w-[100px] flex-wrap justify-end gap-2">
                          <Button variant="soft" onClick={() => inc(r, -1)} disabled={saving}>
                            -1
                          </Button>
                          <Button variant="soft" onClick={() => inc(r, +1)} disabled={saving}>
                            +1
                          </Button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="soft" onClick={() => setEdit(r)} disabled={saving}>
                            Editar
                          </Button>
                          <Button variant="danger" onClick={() => removeSupply(r)} disabled={saving}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 lg:hidden">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Cargando insumos...
            </div>
          ) : supplies.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No hay insumos registrados.
            </div>
          ) : (
            supplies.map((r) => {
              const qty = Number(r.cantidad || 0);
              const min = Number(r.minimo || 0);
              const low = qty <= min;

              return (
                <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-extrabold text-slate-900">{r.nombre}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge tone="neutral">{r.categoria || "Insumo"}</Badge>
                      </div>
                    </div>
                    <Badge tone={low ? "warn" : "ok"}>{low ? "Bajo" : "OK"}</Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <MiniInfo label="Cantidad" value={qty} />
                    <MiniInfo label="Mínimo" value={min} />
                    <MiniInfo label="Movimientos" value={(r.movimientos || []).length} />
                    <MiniInfo label="Categoría" value={r.categoria || "Insumo"} />
                  </div>

                  {r.notas ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {r.notas}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="soft" onClick={() => inc(r, -1)} disabled={saving}>
                      -1
                    </Button>
                    <Button variant="soft" onClick={() => inc(r, +1)} disabled={saving}>
                      +1
                    </Button>
                    <Button variant="soft" onClick={() => openKardex(r)} disabled={saving}>
                      Kardex
                    </Button>
                    <Button variant="soft" onClick={() => setEdit(r)} disabled={saving}>
                      Editar
                    </Button>
                  </div>

                  <div className="mt-2">
                    <Button
                      variant="danger"
                      onClick={() => removeSupply(r)}
                      className="w-full"
                      disabled={saving}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <ModalShell open={open} title="Agregar insumo" onClose={() => setOpen(false)}>
        <SupplyForm
          onCancel={() => setOpen(false)}
          onSubmit={handleCreate}
          saving={saving}
        />
      </ModalShell>

      <ModalShell open={!!edit} title="Editar insumo" onClose={() => setEdit(null)}>
        {edit ? (
          <SupplyForm
            initial={edit}
            onCancel={() => setEdit(null)}
            onSubmit={handleUpdate}
            saving={saving}
          />
        ) : null}
      </ModalShell>

      <ModalShell
        open={kardexOpen}
        title="Kardex del insumo"
        onClose={() => {
          setKardexOpen(false);
          setKardexItem(null);
        }}
        size="xl"
      >
        {kardexItem ? (
          <KardexPanel
            item={kardexItem}
            onSubmitMovement={addMovement}
            onClose={() => {
              setKardexOpen(false);
              setKardexItem(null);
            }}
            saving={saving}
          />
        ) : null}
      </ModalShell>
    </div>
  );
}

/* ---------------- UI base ---------------- */

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex flex-wrap gap-2">{right}</div> : null}
    </div>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}) {
  const variants = {
    primary: "bg-[#3dc2d5] text-white border-[#3dc2d5] hover:bg-[#35b1c3]",
    soft: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
    danger: "bg-[#ef4444] text-white border-[#ef4444] hover:bg-red-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant] || variants.primary,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ModalShell({ open, title, children, onClose, size = "lg" }) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const sizeClass =
    size === "xl"
      ? "max-w-6xl"
      : "max-w-3xl";

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-3 sm:p-4 md:p-6">
          <div
            className={[
              "relative w-full",
              sizeClass,
              "max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[calc(100dvh-48px)]",
              "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
              <h3 className="pr-2 text-lg font-black text-slate-900">{title}</h3>

              <button
                onClick={onClose}
                className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5 max-h-[calc(100dvh-110px)] sm:max-h-[calc(100dvh-120px)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
function Kpi({ icon: Icon, title, value, tone = "neutral" }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        <Badge tone={tone}>{title}</Badge>
      </div>
    </Card>
  );
}

function PillButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/* ---------------- Kardex ---------------- */

function KardexPanel({ item, onSubmitMovement, onClose, saving = false }) {
  const [tipo, setTipo] = useState("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");

  const movimientos = useMemo(() => {
    const m = Array.isArray(item.movimientos) ? item.movimientos : [];
    return [...m].sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  }, [item.movimientos]);

  const qty = Number(item.cantidad || 0);
  const min = Number(item.minimo || 0);
  const low = qty <= min;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold text-slate-900">{item.nombre}</div>
            <div className="text-sm text-slate-500">
              {item.categoria || "Insumo"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={low ? "warn" : "ok"}>{low ? "Bajo stock" : "OK"}</Badge>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <Box label="Cantidad actual" value={qty} />
          <Box label="Stock mínimo" value={min} />
          <Box label="Movimientos" value={movimientos.length} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-extrabold text-slate-900">Registrar movimiento</div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-xs font-semibold text-slate-500">Tipo</div>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-500">
              {tipo === "AJUSTE" ? "Nueva cantidad" : "Cantidad"}
            </div>
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-slate-500">Motivo (opcional)</div>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Compra, consumo, ajuste..."
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="soft" onClick={onClose} className="w-full sm:w-auto" disabled={saving}>
            Cerrar
          </Button>

          <Button
            onClick={() => {
              const n = Number(cantidad);
              if (!Number.isFinite(n) || n < 0) {
                alert("Escribe una cantidad válida.");
                return;
              }

              onSubmitMovement({ tipo, cantidad: n, motivo });
              setCantidad("");
              setMotivo("");
            }}
            className="w-full sm:w-auto"
            disabled={saving}
          >
            Guardar movimiento
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Historial (Kardex)</div>
            <div className="text-xs text-slate-500">Entradas, salidas y ajustes con fecha.</div>
          </div>
          <Badge tone="neutral">{movimientos.length} movimientos</Badge>
        </div>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[780px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Cantidad</th>
                <th className="px-4 py-3 font-semibold">Antes</th>
                <th className="px-4 py-3 font-semibold">Después</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {movimientos.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Sin movimientos todavía.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">
                      {m.fechaISO ? new Date(m.fechaISO).toLocaleString("es-MX") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={m.tipo === "SALIDA" ? "warn" : m.tipo === "AJUSTE" ? "info" : "ok"}>
                        {m.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-900">{m.cantidad}</td>
                    <td className="px-4 py-3 text-slate-900">{m.before}</td>
                    <td className="px-4 py-3 text-slate-900">{m.after}</td>
                    <td className="px-4 py-3 text-slate-900">{m.motivo || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-900">{value}</div>
    </div>
  );
}