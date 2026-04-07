import React, { useState } from "react";

export function SupplyForm({ initial, onCancel, onSubmit, saving = false }) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    nombre: initial?.nombre || "",
    categoria: initial?.categoria || "Insumo",
    cantidad: initial?.cantidad ?? 0,
    minimo: initial?.minimo ?? 0,
    notas: initial?.notas || "",
  });

  function change(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function num(value) {
    const x = Number(value);
    if (Number.isNaN(x)) return 0;
    return Math.max(0, Math.floor(x));
  }

  function adjustQty(delta) {
    setForm((prev) => ({
      ...prev,
      cantidad: Math.max(0, Number(prev.cantidad || 0) + delta),
    }));
  }

  function submit(e) {
    e.preventDefault();

    const nombre = String(form.nombre || "").trim();
    if (!nombre) {
      alert("El nombre es requerido.");
      return;
    }

    const payload = {
      nombre,
      categoria: String(form.categoria || "Insumo").trim() || "Insumo",
      cantidad: num(form.cantidad),
      minimo: num(form.minimo),
      notas: String(form.notas || "").trim(),
    };

    onSubmit?.(payload);
  }

  const qty = Number(form.cantidad || 0);
  const min = Number(form.minimo || 0);
  const low = qty <= min;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Nombre">
            <Input
              value={form.nombre}
              onChange={(e) => change("nombre", e.target.value)}
              placeholder="Ej. Guantes, jeringas, paracetamol..."
            />
          </Field>
        </div>

        <Field label="Categoría">
          <Select
            value={form.categoria}
            onChange={(e) => change("categoria", e.target.value)}
          >
            <option value="Insumo">Insumo</option>
            <option value="Medicamento">Medicamento</option>
          </Select>
        </Field>

        <Field label="Cantidad">
          <div className="flex gap-2">
            <SmallButton type="button" onClick={() => adjustQty(-1)} disabled={saving}>
              -1
            </SmallButton>
            <Input
              type="number"
              min={0}
              value={form.cantidad}
              onChange={(e) => change("cantidad", e.target.value)}
            />
            <SmallButton type="button" onClick={() => adjustQty(+1)} disabled={saving}>
              +1
            </SmallButton>
          </div>
        </Field>

        <Field label="Stock mínimo">
          <Input
            type="number"
            min={0}
            value={form.minimo}
            onChange={(e) => change("minimo", e.target.value)}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Notas (opcional)">
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={form.notas}
              onChange={(e) => change("notas", e.target.value)}
              rows={3}
              placeholder="Observaciones generales del insumo..."
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">Resumen</div>

              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    low
                      ? "border-amber-200 bg-amber-100 text-amber-900"
                      : "border-emerald-200 bg-emerald-100 text-emerald-900",
                  ].join(" ")}
                >
                  {low ? "Bajo stock" : "OK"}
                </span>

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {form.categoria || "Insumo"}
                </span>
              </div>
            </div>

            <div className="mt-2 text-sm text-slate-700">
              Cantidad: <span className="font-semibold">{qty}</span> •
              Mínimo: <span className="font-semibold"> {min}</span>
            </div>

            {form.notas?.trim() ? (
              <div className="mt-2 text-xs text-slate-600">
                Notas: <span className="font-semibold">{form.notas.trim()}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[#3dc2d5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#35b1c3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isEdit ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-semibold text-slate-900">{label}</div>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100",
        props.className || "",
      ].join(" ")}
    />
  );
}

function SmallButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}