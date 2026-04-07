// src/components/layout/sales/SalesUiParts.jsx
import React from "react";
import { money, safeStr } from "./salesUtils";

export const CHART_COLORS = [
    "#3dc2d5",
    "#f79034",
    "#6cc067",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#a855f7",
    "#22c55e",
    "#64748b",
    "#e11d48",
];

export function Card({ className = "", children }) {
    return (
        <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
            {children}
        </div>
    );
}

export function Button({
    children,
    onClick,
    variant = "soft",
    className = "",
    disabled = false,
    type = "button",
}) {
    const variants = {
        primary: "bg-[#3dc2d5] text-white hover:bg-[#3dc2d5]/80 border-blue-500",
        soft: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
        outline: "bg-white text-slate-700 hover:bg-slate-50 border-slate-300",
        danger: "bg-[#ef4444] text-white hover:bg-red-700 border-red-600",
        success: "bg-[#6cc067] text-white hover:bg-emerald-700 border-green-500",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={[
                "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-60",
                variants[variant] || variants.soft,
                className,
            ].join(" ")}
        >
            {children}
        </button>
    );
}

export function Badge({ children, tone = "neutral" }) {
    const tones = {
        success: "bg-[#6cc067]/50 text-emerald-700 border-emerald-100",
        warn: "bg-[#f79034]/50 text-amber-800 border-amber-100",
        danger: "bg-red-50 text-red-700 border-red-100",
        neutral: "bg-slate-100 text-slate-700 border-slate-200",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

export function Stat({ title, value, hint }) {
    return (
        <Card className="p-5">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
            </div>
        </Card>
    );
}

export function SectionHeader({ title, subtitle, right }) {
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

export function SalesTable({ rows, onEdit, onTicket, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 font-semibold">Cita</th>
                        <th className="px-3 py-3 font-semibold">Fecha pago</th>
                        <th className="px-3 py-3 font-semibold">Paciente</th>
                        <th className="px-3 py-3 font-semibold">Profesional</th>
                        <th className="px-3 py-3 font-semibold">Servicio</th>
                        <th className="px-3 py-3 font-semibold">Métodos</th>
                        <th className="px-3 py-3 font-semibold">Estado</th>
                        <th className="px-3 py-3 font-semibold">Facturado</th>
                        <th className="px-3 py-3 font-semibold">Restante</th>
                        <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const rep = r.representativePayment;
                        const paidOk = Number(r.restante_calc || 0) <= 0;

                        return (
                            <tr key={r.key} className="border-b border-slate-100 align-top hover:bg-slate-50">
                                <td className="px-3 py-4 font-semibold text-slate-800">#{r.cita}</td>
                                <td className="px-3 py-4 text-slate-600">{safeStr(r.fecha_pago, "-")}</td>

                                <td className="px-3 py-4">
                                    <div className="min-w-[180px]">
                                        <p className="font-medium text-slate-900">{safeStr(r.paciente_nombre, "Paciente")}</p>
                                        <p className="text-xs text-slate-500">Fecha cita: {safeStr(r.fecha_cita, "-")}</p>
                                    </div>
                                </td>

                                <td className="px-3 py-4 text-slate-700">{safeStr(r.profesional_nombre, "Profesional")}</td>
                                <td className="px-3 py-4 text-slate-700">{safeStr(r.servicio_nombre, "Servicio")}</td>

                                <td className="px-3 py-4">
                                    <div className="min-w-[220px] space-y-1">
                                        {r.methods.map((m) => (
                                            <div key={m.metodo} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-2 py-1">
                                                <span className="text-slate-600">{m.metodo}</span>
                                                <span className="font-semibold text-slate-800">{money(m.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>

                                <td className="px-3 py-4">
                                    <Badge tone={paidOk ? "success" : "warn"}>
                                        {paidOk ? "Pagado" : "Parcial"}
                                    </Badge>
                                </td>

                                <td className="px-3 py-4 text-slate-700">{money(r.monto_facturado)}</td>

                                <td className="px-3 py-4">
                                    <div className={paidOk ? "font-semibold text-emerald-700" : "text-slate-700"}>
                                        {money(r.restante_calc)}
                                    </div>
                                    {Number(r.descuento_porcentaje || 0) > 0 ? (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Desc: {Number(r.descuento_porcentaje).toFixed(0)}%
                                        </p>
                                    ) : null}
                                </td>

                                <td className="px-3 py-4">
                                    <div className="flex min-w-[220px] flex-col justify-end gap-2 sm:flex-row">
                                        <Button onClick={() => rep && onEdit(rep)} variant="outline" disabled={!rep}>
                                            Ver / editar
                                        </Button>
                                        <Button onClick={() => rep?.id && onTicket(rep.id)} variant="success" disabled={!rep?.id}>
                                            Ticket PDF
                                        </Button>
                                        <Button onClick={() => onDelete(r)} variant="danger">
                                            Eliminar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {!rows.length ? (
                        <tr>
                            <td colSpan={11} className="px-3 py-10 text-center text-sm text-slate-400">
                                No hay ventas dentro del rango seleccionado.
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}