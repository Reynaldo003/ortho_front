import { useEffect, useMemo, useState } from "react";
import logo from "/logo.png";
import { MiniCalendar } from "../agenda/MiniCalendar";
import {
    CalendarDays,
    TrendingUp,
    Boxes,
    Users,
    Dumbbell,
    Stethoscope,
    MessageSquareText,
    UsersRound,
    Menu,
    X,
    Search,
    RefreshCcw,
    SlidersHorizontal,
} from "lucide-react";

const PATIENTS_SIDEBAR_STORAGE_KEY = "patients_sidebar_filters_v2";
const SALES_SIDEBAR_STORAGE_KEY = "sales_sidebar_filters_v1";

const ROLE_DOCTOR = "doctor";
const ROLE_FISIOTERAPEUTA = "fisioterapeuta";
const ROLE_AUX_FISIOTERAPIA = "aux_fisioterapia";
const ROLE_RECEPCIONISTA = "recepcionista";

const ADMIN_LIKE_ROLES = [ROLE_DOCTOR];
const CAN_SEE_ALL_AGENDAS_ROLES = [
    ROLE_DOCTOR,
    ROLE_RECEPCIONISTA,
];
const SELF_ONLY_AGENDA_ROLES = [ROLE_AUX_FISIOTERAPIA];

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function normalizeRole(role) {
    const value = String(role || "").trim().toLowerCase();

    if (value === "admin") return ROLE_DOCTOR;
    if (value === "recepcion") return ROLE_RECEPCIONISTA;

    return value;
}

function isAdminLikeRole(role) {
    return ADMIN_LIKE_ROLES.includes(normalizeRole(role));
}

function canSeeAllAgendas(role) {
    return CAN_SEE_ALL_AGENDAS_ROLES.includes(normalizeRole(role));
}

function isSelfOnlyAgendaRole(role) {
    return SELF_ONLY_AGENDA_ROLES.includes(normalizeRole(role));
}

function getAllowedTabsByRole(role) {
    const normalized = normalizeRole(role);

    if (normalized === ROLE_FISIOTERAPEUTA) {
        return [
            "pacientes",
            "acondicionamiento",
            "terapia",
            "ventas",
            "servicios",
            "comentarios",
            "equipo",
            "perfil",
        ];
    }

    if (isAdminLikeRole(normalized)) {
        return [
            "agenda",
            "pacientes",
            "acondicionamiento",
            "terapia",
            "ventas",
            "servicios",
            "comentarios",
            "equipo",
            "perfil",
        ];
    }

    if (normalized === ROLE_RECEPCIONISTA) {
        return [
            "agenda",
            "pacientes",
            "acondicionamiento",
            "terapia",
            "perfil",
        ];
    }

    if (normalized === ROLE_AUX_FISIOTERAPIA) {
        return [
            "acondicionamiento",
            "terapia",
            "pacientes",
            "perfil",
        ];
    }

    return ["perfil"];
}

function filterTabsByRole(tabs, role) {
    const allowedByRole = getAllowedTabsByRole(role);
    return (tabs || []).filter((tab) => allowedByRole.includes(tab));
}

function tabLabel(tab) {
    switch (tab) {
        case "agenda":
            return "Agenda";
        case "pacientes":
            return "Pacientes";
        case "acondicionamiento":
            return "Acondicionamiento";
        case "terapia":
            return "Terapia";
        case "ventas":
            return "Ingresos";
        case "servicios":
            return "Insumos";
        case "comentarios":
            return "Comentarios";
        case "equipo":
            return "Equipo";
        case "perfil":
            return "Mi perfil";
        default:
            return tab;
    }
}

function tabIcon(tab) {
    switch (tab) {
        case "agenda":
            return CalendarDays;
        case "ventas":
            return TrendingUp;
        case "servicios":
            return Boxes;
        case "pacientes":
            return Users;
        case "acondicionamiento":
            return Dumbbell;
        case "terapia":
            return Stethoscope;
        case "comentarios":
            return MessageSquareText;
        case "equipo":
            return UsersRound;
        case "perfil":
            return Users;
        default:
            return CalendarDays;
    }
}

/* =========================
   Patients sidebar helpers
========================= */
function readPatientsSidebarFilters() {
    try {
        const raw = localStorage.getItem(PATIENTS_SIDEBAR_STORAGE_KEY);
        if (!raw) {
            return {
                search: "",
                filterBranch: "Todos",
                filterProfessional: "Todos",
                filterService: "Todos",
                filterStatus: "Todos",
                filterStartDate: "",
                filterEndDate: "",
            };
        }
        return JSON.parse(raw);
    } catch {
        return {
            search: "",
            filterBranch: "Todos",
            filterProfessional: "Todos",
            filterService: "Todos",
            filterStatus: "Todos",
            filterStartDate: "",
            filterEndDate: "",
        };
    }
}

function emitPatientsFilters(next) {
    try {
        localStorage.setItem(PATIENTS_SIDEBAR_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent("patients:filters:change", { detail: next }));
}

/* =========================
   Sales sidebar helpers
========================= */
function defaultSalesSidebarFilters() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const first = `${y}-${m}-01`;
    const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const last = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, "0")}-${String(lastDate.getDate()).padStart(2, "0")}`;

    return {
        mode: "mensual",
        preset: "month",
        group: "month",
        fromKey: first,
        toKey: last,
        professionalId: "",
    };
}

function readSalesSidebarFilters() {
    try {
        const raw = localStorage.getItem(SALES_SIDEBAR_STORAGE_KEY);
        if (!raw) return defaultSalesSidebarFilters();
        return { ...defaultSalesSidebarFilters(), ...JSON.parse(raw) };
    } catch {
        return defaultSalesSidebarFilters();
    }
}

function emitSalesFilters(next) {
    try {
        localStorage.setItem(SALES_SIDEBAR_STORAGE_KEY, JSON.stringify(next));
    } catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent("sales:filters:change", { detail: next }));
}

/* =========================
   Agenda sidebar
========================= */
export function AgendaSidebarContent({
    agendaDate,
    setAgendaDate,
    branch,
    setBranch,
    professionals,
    selectedProfessionalId,
    setSelectedProfessionalId,
    role,
    dualMode,
    setDualMode,
    proA,
    setProA,
    proB,
    setProB,
}) {
    const normalizedRole = normalizeRole(role);
    const isProfessionalSelfOnly = isSelfOnlyAgendaRole(normalizedRole);
    const canManageAllAgendas = canSeeAllAgendas(normalizedRole);

    return (
        <>
            <div className="mt-2">
                <MiniCalendar currentDate={agendaDate} onChangeDate={setAgendaDate} />
            </div>

            <div className="mt-3 space-y-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Profesional</label>
                    <select
                        disabled={isProfessionalSelfOnly}
                        className={
                            "w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 " +
                            (isProfessionalSelfOnly
                                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                                : "bg-slate-50")
                        }
                        value={selectedProfessionalId || ""}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            const id = Number.isNaN(val) ? null : val;
                            setSelectedProfessionalId?.(id);
                            setProA?.(id);
                        }}
                    >
                        {(professionals || []).map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    {isProfessionalSelfOnly && (
                        <p className="mt-1 text-[11px] text-slate-500">
                            Este rol solo puede ver su propia agenda.
                        </p>
                    )}
                </div>

                {canManageAllAgendas && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-slate-600">Vista 2 profesionales</p>
                            <button
                                type="button"
                                onClick={() => setDualMode((v) => !v)}
                                className={
                                    "rounded-md border px-2 py-1 text-[11px] " +
                                    (dualMode
                                        ? "border-violet-200 bg-violet-50 text-[#3dc2d5]"
                                        : "border-slate-200 bg-white text-slate-600")
                                }
                            >
                                {dualMode ? "Activo" : "Desactivado"}
                            </button>
                        </div>

                        {dualMode && (
                            <div className="mt-3 grid grid-cols-1 gap-2">
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                                        Profesional A
                                    </label>
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        value={proA || ""}
                                        onChange={(e) => setProA(Number(e.target.value) || null)}
                                    >
                                        {(professionals || []).map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                                        Profesional B
                                    </label>
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        value={proB || ""}
                                        onChange={(e) => setProB(Number(e.target.value) || null)}
                                    >
                                        <option value="">Selecciona…</option>
                                        {(professionals || [])
                                            .filter((p) => p.id !== proA)
                                            .map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.label}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <p className="text-[11px] text-slate-500">
                                    En este modo puedes arrastrar citas entre agendas.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/* =========================
   Patients sidebar
========================= */
export function PatientsSidebarContent() {
    const [filters, setFilters] = useState(readPatientsSidebarFilters());
    const [sidebarData, setSidebarData] = useState({
        professionals: [],
        services: [],
        total: 0,
        withAppointments: 0,
        withoutAppointments: 0,
    });

    useEffect(() => {
        function handleSidebarData(e) {
            setSidebarData(e.detail || {});
        }

        function handleExternalFilters(e) {
            if (e?.detail) setFilters(e.detail);
        }

        window.addEventListener("patients:sidebar:data", handleSidebarData);
        window.addEventListener("patients:filters:sync", handleExternalFilters);

        return () => {
            window.removeEventListener("patients:sidebar:data", handleSidebarData);
            window.removeEventListener("patients:filters:sync", handleExternalFilters);
        };
    }, []);

    const stats = useMemo(
        () => [
            { label: "Total", value: sidebarData.total || 0 },
            { label: "Con citas", value: sidebarData.withAppointments || 0 },
            { label: "Sin citas", value: sidebarData.withoutAppointments || 0 },
        ],
        [sidebarData]
    );

    function updateField(key, value) {
        const next = { ...filters, [key]: value };
        setFilters(next);
        emitPatientsFilters(next);
    }

    function resetAll() {
        const next = {
            search: "",
            filterBranch: "Todos",
            filterProfessional: "Todos",
            filterService: "Todos",
            filterStatus: "Todos",
            filterStartDate: "",
            filterEndDate: "",
        };
        setFilters(next);
        emitPatientsFilters(next);
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-extrabold text-slate-900">Filtros</span>
                    </div>

                    <button
                        type="button"
                        onClick={resetAll}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Limpiar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {stats.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                            <div className="text-[11px] text-slate-500">{item.label}</div>
                            <div className="mt-1 text-sm font-extrabold text-slate-900">{item.value}</div>
                        </div>
                    ))}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            placeholder="Nombre, correo o teléfono"
                            value={filters.search}
                            onChange={(e) => updateField("search", e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Profesional</label>
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        value={filters.filterProfessional}
                        onChange={(e) => updateField("filterProfessional", e.target.value)}
                    >
                        <option value="Todos">Todos</option>
                        {(sidebarData.professionals || []).map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Servicio</label>
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        value={filters.filterService}
                        onChange={(e) => updateField("filterService", e.target.value)}
                    >
                        <option value="Todos">Todos</option>
                        {(sidebarData.services || []).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Estado de reserva</label>
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        value={filters.filterStatus}
                        onChange={(e) => updateField("filterStatus", e.target.value)}
                    >
                        <option value="Todos">Todos</option>
                        <option value="Con reservas">Con reservas</option>
                        <option value="Sin reservas">Sin reservas</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Periodo</label>
                    <div className="grid grid-cols-1 gap-2">
                        <input
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            value={filters.filterStartDate}
                            onChange={(e) => updateField("filterStartDate", e.target.value)}
                        />
                        <input
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            value={filters.filterEndDate}
                            onChange={(e) => updateField("filterEndDate", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Sales sidebar
========================= */
export function SalesSidebarContent() {
    const [filters, setFilters] = useState(readSalesSidebarFilters());
    const [sidebarData, setSidebarData] = useState({
        professionals: [],
    });

    useEffect(() => {
        function handleSidebarData(e) {
            setSidebarData(e.detail || { professionals: [] });
        }

        function handleExternalFilters(e) {
            if (e?.detail) setFilters(e.detail);
        }

        window.addEventListener("sales:sidebar:data", handleSidebarData);
        window.addEventListener("sales:filters:sync", handleExternalFilters);

        return () => {
            window.removeEventListener("sales:sidebar:data", handleSidebarData);
            window.removeEventListener("sales:filters:sync", handleExternalFilters);
        };
    }, []);

    function updateField(key, value) {
        const next = { ...filters, [key]: value };
        setFilters(next);
        emitSalesFilters(next);
    }

    function applyPreset(preset) {
        const today = new Date();
        let from = new Date(today);
        let to = new Date(today);
        let mode = "mensual";

        if (preset === "week") {
            const jsDay = today.getDay();
            const deltaToMonday = (jsDay + 6) % 7;
            from.setDate(today.getDate() - deltaToMonday);
            to = new Date(from);
            to.setDate(from.getDate() + 6);
            mode = "semanal";
        } else if (preset === "month") {
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            mode = "mensual";
        } else if (preset === "year") {
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today.getFullYear(), 11, 31);
            mode = "anual";
        }

        const next = {
            ...filters,
            mode,
            preset,
            fromKey: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`,
            toKey: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`,
        };

        setFilters(next);
        emitSalesFilters(next);
    }

    function resetAll() {
        const next = defaultSalesSidebarFilters();
        setFilters(next);
        emitSalesFilters(next);
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-extrabold text-slate-900">Filtros</span>
                    </div>

                    <button
                        type="button"
                        onClick={resetAll}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Limpiar
                    </button>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Vista</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => applyPreset("week")}
                            className={cls(
                                "rounded-2xl border px-3 py-2 text-xs font-semibold",
                                filters.mode === "semanal"
                                    ? "border-[#3dc2d5]/20 bg-[#3dc2d5]/15 text-slate-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            Semanal
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("month")}
                            className={cls(
                                "rounded-2xl border px-3 py-2 text-xs font-semibold",
                                filters.mode === "mensual"
                                    ? "border-[#3dc2d5]/20 bg-[#3dc2d5]/15 text-slate-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            Mensual
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("year")}
                            className={cls(
                                "rounded-2xl border px-3 py-2 text-xs font-semibold",
                                filters.mode === "anual"
                                    ? "border-[#3dc2d5]/20 bg-[#3dc2d5]/15 text-slate-900"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            Anual
                        </button>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Profesional</label>
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        value={filters.professionalId}
                        onChange={(e) => updateField("professionalId", e.target.value)}
                    >
                        <option value="">Todos</option>
                        {(sidebarData.professionals || []).map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Agrupar por</label>
                    <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        value={filters.group}
                        onChange={(e) => updateField("group", e.target.value)}
                    >
                        <option value="day">Día</option>
                        <option value="week">Semana</option>
                        <option value="month">Mes</option>
                        <option value="year">Año</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Periodo</label>
                    <div className="grid grid-cols-1 gap-2">
                        <input
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            value={filters.fromKey}
                            onChange={(e) => updateField("fromKey", e.target.value)}
                        />
                        <input
                            type="date"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            value={filters.toKey}
                            onChange={(e) => updateField("toKey", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Sidebar shell
========================= */
export function AdminSidebar({
    mobileOpen,
    onCloseMobile,
    collapsed,
    onToggleCollapsed,
    allowedTabs,
    activeTab,
    onSelectTab,
    sectionContent,
    locked = false,
    role = "",
}) {
    const widthClass = collapsed ? "w-[88px]" : "w-80";

    const visibleTabs = useMemo(() => {
        return filterTabsByRole(allowedTabs || [], role);
    }, [allowedTabs, role]);

    const safeActiveTab = visibleTabs.includes(activeTab)
        ? activeTab
        : visibleTabs[0] || "perfil";
    useEffect(() => {
        if (locked) return;
        if (!visibleTabs.length) return;
        if (activeTab !== safeActiveTab) {
            onSelectTab?.(safeActiveTab);
        }
    }, [activeTab, safeActiveTab, visibleTabs, onSelectTab, locked]);

    const Content = ({ isMobile = false }) => (
        <div className="flex flex-col gap-4 p-3">
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className={cls("flex items-center gap-3", collapsed && !isMobile ? "justify-center" : "")}>
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <img src={logo} alt="Ortho Clinic Córdoba" className="h-10 w-10 object-contain" />
                    </div>

                    {!collapsed || isMobile ? (
                        <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold tracking-tight text-slate-900">
                                Ortho Clinic Córdoba
                            </div>
                            <div className="truncate text-xs text-slate-500">Panel administrativo</div>
                        </div>
                    ) : null}

                    {isMobile ? (
                        <button
                            type="button"
                            onClick={onCloseMobile}
                            className="ml-auto grid place-items-center rounded-2xl border border-slate-200 bg-white/70 p-2"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5 text-slate-800" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onToggleCollapsed}
                            className="ml-auto hidden place-items-center rounded-2xl border border-slate-200 bg-white/70 p-2 md:grid"
                            aria-label="Colapsar sidebar"
                            title={collapsed ? "Expandir" : "Colapsar"}
                        >
                            <Menu className="h-5 w-5 text-slate-800" />
                        </button>
                    )}
                </div>
            </div>

            {locked ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                    Navegación bloqueada temporalmente por privacidad mientras se captura o consulta un expediente.
                </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur">
                {visibleTabs.map((t) => {
                    const active = t === safeActiveTab;
                    const Icon = tabIcon(t);

                    return (
                        <button
                            key={t}
                            type="button"
                            disabled={locked}
                            onClick={() => {
                                if (locked) return;
                                onSelectTab(t);
                                if (isMobile) onCloseMobile?.();
                            }}
                            className={cls(
                                "w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition flex items-center gap-3",
                                active
                                    ? "border-[#3dc2d5]/20 bg-[#3dc2d5]/15 text-slate-900"
                                    : "border-transparent text-slate-800 hover:bg-black/5",
                                collapsed && !isMobile ? "justify-center px-2" : "",
                                locked ? "cursor-not-allowed opacity-50" : ""
                            )}
                            title={locked ? "Bloqueado por privacidad del paciente" : collapsed && !isMobile ? tabLabel(t) : undefined}
                        >
                            <Icon className="h-5 w-5 text-[#3dc2d5]" />
                            {!collapsed || isMobile ? <span>{tabLabel(t)}</span> : null}
                        </button>
                    );
                })}
            </div>

            {(!collapsed || isMobile) && sectionContent}
        </div>
    );

    return (
        <>
            <aside
                className={cls(
                    "sticky top-4 hidden self-start overflow-y-auto md:block max-h-[calc(100vh-2rem)]",
                    widthClass
                )}
            >
                <Content />
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30"
                        onClick={onCloseMobile}
                        aria-label="Cerrar overlay"
                    />
                    <div className="absolute left-0 top-0 h-full w-[86%] max-w-[340px] overflow-y-auto">
                        <Content isMobile />
                    </div>
                </div>
            ) : null}
        </>
    );
}