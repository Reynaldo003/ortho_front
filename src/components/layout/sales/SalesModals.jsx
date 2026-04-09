// src/components/layout/sales/SalesModals.jsx
import React, { useEffect, useState } from "react";
import { money } from "./salesUtils";
import { Button } from "./SalesUiParts";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function DeletePaymentModal({ open, title = "Eliminar registro", onClose, onConfirm, hint }) {
    const [text, setText] = useState("");

    useEffect(() => {
        if (open) setText("");
    }, [open]);

    if (!open) return null;

    const ok = text.trim().toLowerCase() === "eliminar";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
                    </div>
                    <button onClick={onClose} className="rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100">
                        Cerrar
                    </button>
                </div>

                <div className="px-4 py-4 sm:px-5">
                    <p className="text-sm text-slate-700">
                        Para confirmar, escribe <span className="font-semibold">eliminar</span>.
                    </p>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                        placeholder='Escribe "eliminar"'
                        autoFocus
                    />
                    <p className="mt-2 text-[11px] text-slate-500">Esta acción no se puede deshacer.</p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
                    <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button onClick={() => ok && onConfirm?.()} disabled={!ok} variant="danger" className="w-full sm:w-auto">
                        Eliminar
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function PaymentDetailModal({ payment, onClose, onUpdated }) {
    const [form, setForm] = useState(() => ({
        fecha_pago: payment?.fecha_pago || "",
        comprobante: payment?.comprobante || "",
        metodo_pago: payment?.metodo_pago || "efectivo",
        monto_facturado: Number(payment?.monto_facturado || 0),
        descuento_porcentaje: Number(payment?.descuento_porcentaje || 0),
        anticipo: Number(payment?.anticipo || 0),
    }));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!payment) return;
        setForm({
            fecha_pago: payment.fecha_pago || "",
            comprobante: payment.comprobante || "",
            metodo_pago: payment.metodo_pago || "efectivo",
            monto_facturado: Number(payment.monto_facturado || 0),
            descuento_porcentaje: Number(payment.descuento_porcentaje || 0),
            anticipo: Number(payment.anticipo || 0),
        });
    }, [payment]);

    if (!payment) return null;

    const handleChange = (field, value) => {
        if (["monto_facturado", "descuento_porcentaje", "anticipo"].includes(field)) {
            setForm((prev) => ({
                ...prev,
                [field]: value === "" ? "" : Number(value),
            }));
            return;
        }
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("auth.access");

        try {
            setSaving(true);
            const resp = await fetch(`${API_BASE}/api/pagos/${payment.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!resp.ok) {
                const data = await resp.json().catch(() => null);
                console.error("Error actualizando pago", resp.status, data);
                alert("No se pudo actualizar el pago. Revisa la consola para más detalles.");
                return;
            }

            const updated = await resp.json();
            onUpdated?.(updated);
        } catch (err) {
            console.error("Error actualizando pago", err);
            alert("Ocurrió un error al actualizar el pago.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 flex w-full max-w-[96vw] max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[94dvh]">
                <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
                    <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-slate-900">Editar pago #{payment.id}</h3>
                                <p className="text-sm text-slate-500">Ajusta los datos del pago más reciente.</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 md:grid-cols-2">
                            <p><span className="font-semibold text-slate-600">Paciente:</span> {payment.paciente_nombre}</p>
                            <p><span className="font-semibold text-slate-600">Servicio:</span> {payment.servicio_nombre}</p>
                            <p><span className="font-semibold text-slate-600">Profesional:</span> {payment.profesional_nombre}</p>
                            <p><span className="font-semibold text-slate-600">Fecha cita:</span> {payment.fecha_cita}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Fecha de pago</label>
                                <input
                                    type="date"
                                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.fecha_pago}
                                    onChange={(e) => handleChange("fecha_pago", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Método de pago</label>
                                <select
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.metodo_pago}
                                    onChange={(e) => handleChange("metodo_pago", e.target.value)}
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Nº comprobante de pago</label>
                                <input
                                    type="text"
                                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.comprobante}
                                    onChange={(e) => handleChange("comprobante", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Monto facturado</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.monto_facturado}
                                    onChange={(e) => handleChange("monto_facturado", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Descuento (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.descuento_porcentaje}
                                    onChange={(e) => handleChange("descuento_porcentaje", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Monto de este pago</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3dc2d5]"
                                    value={form.anticipo}
                                    onChange={(e) => handleChange("anticipo", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <span className="font-semibold">Restante actual:</span> {money(payment.restante)}
                            <span className="ml-2 text-xs text-slate-500">Se recalculará al guardar.</span>
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-slate-200 p-4 sm:p-5">
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
                                Cerrar
                            </Button>
                            <Button type="submit" disabled={saving} variant="primary" className="w-full sm:w-auto">
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}