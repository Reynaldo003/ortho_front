import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./index.css";

import { AgendaView as AgendaGeneralView } from "./components/layout/agenda/AgendaView";

import { AgendaView as AcondicionamientoAgendaView } from "./components/layout/acondicionamiento/AgendaView";
import { ReservationModal as AcondicionamientoReservationModal } from "./components/layout/acondicionamiento/ReservationModal";
import { BlockTimeModal as AcondicionamientoBlockTimeModal } from "./components/layout/acondicionamiento/BlockTimeModal";

import { AgendaView as TerapiaAgendaView } from "./components/layout/terapia/AgendaView";
import { ReservationModal as TerapiaReservationModal } from "./components/layout/terapia/ReservationModal";
import { BlockTimeModal as TerapiaBlockTimeModal } from "./components/layout/terapia/BlockTimeModal";

import { PatientsView } from "./components/layout/patients/PatientsView";
import { InsumosView } from "./components/layout/insumos/InsumosPage";
import { SalesView } from "./components/layout/sales/SalesView";
import { ReservationModal } from "./components/reservations/ReservationModal";
import { CommentsModerationView } from "./components/layout/comments/CommentsModerationView";
import { Equipo } from "./components/layout/equipo/Equipo";
import { BlockTimeModal } from "./components/layout/agenda/BlockTimeModal";
import { notifySalesRefresh } from "./utils/salesSync";
import { ServiciosAdminView } from "./components/layout/servicios/ServiciosAdminView";
import { UserProfileView } from "./components/layout/profile/UserProfileView";
import {
    AdminSidebar,
    AgendaSidebarContent,
    PatientsSidebarContent,
    SalesSidebarContent,
} from "./components/layout/sidebar/AdminSidebar";

import {
    LogOut,
    ExternalLink,
    Menu,
} from "lucide-react";
import { clearSession, startSessionRefresh } from "./utils/authSession";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const ROLE_DOCTOR = "doctor";
const ROLE_FISIOTERAPEUTA = "fisioterapeuta";
const ROLE_AUX_FISIOTERAPIA = "aux_fisioterapia";
const ROLE_RECEPCIONISTA = "recepcionista";

function normalizeRole(role) {
    const value = String(role || "").trim().toLowerCase();

    if (value === "admin") return ROLE_DOCTOR;
    if (value === "recepcion") return ROLE_RECEPCIONISTA;

    return value;
}

function isAdminLikeRole(role) {
    const normalized = normalizeRole(role);
    return normalized === ROLE_DOCTOR || normalized === ROLE_FISIOTERAPEUTA;
}

function canSeeAllAgendasRole(role) {
    const normalized = normalizeRole(role);
    return (
        normalized === ROLE_DOCTOR ||
        normalized === ROLE_FISIOTERAPEUTA ||
        normalized === ROLE_RECEPCIONISTA
    );
}

function isSelfOnlyAgendaRole(role) {
    return normalizeRole(role) === ROLE_AUX_FISIOTERAPIA;
}

function roleLabel(role) {
    switch (normalizeRole(role)) {
        case ROLE_DOCTOR:
            return "Doctor";
        case ROLE_FISIOTERAPEUTA:
            return "Fisioterapeuta";
        case ROLE_AUX_FISIOTERAPIA:
            return "Auxiliar de fisioterapia";
        case ROLE_RECEPCIONISTA:
            return "Recepcionista";
        default:
            return "Usuario";
    }
}

function getAllowedTabsByRole(role) {
    const normalized = normalizeRole(role);

    if (normalized === ROLE_DOCTOR || normalized === ROLE_FISIOTERAPEUTA) {
        return [
            "agenda",
            "pacientes",
            "ventas",
            "acondicionamiento",
            "terapia",
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
function getProfessionalsForTab(tab, list) {
    const professionals = Array.isArray(list) ? list : [];

    if (tab === "agenda") {
        return professionals.filter((p) => normalizeRole(p.rol) === ROLE_DOCTOR);
    }

    if (tab === "acondicionamiento" || tab === "terapia") {
        return professionals.filter((p) => {
            const rol = normalizeRole(p.rol);
            return rol === ROLE_FISIOTERAPEUTA || rol === ROLE_AUX_FISIOTERAPIA;
        });
    }

    return professionals;
}

function getPreferredProfessionalId({ tab, role, me, visibleProfessionals, currentId }) {
    const list = Array.isArray(visibleProfessionals) ? visibleProfessionals : [];
    const ids = new Set(list.map((p) => Number(p.id)));
    const myId = Number(me?.id);
    const normalizedRole = normalizeRole(role);

    if (!list.length) return null;

    const currentSelectedId =
        currentId != null && ids.has(Number(currentId)) ? Number(currentId) : null;

    if (isSelfOnlyAgendaRole(normalizedRole) && ids.has(myId)) {
        return myId;
    }

    if (currentSelectedId != null) {
        return currentSelectedId;
    }

    if (normalizedRole === ROLE_DOCTOR && tab === "agenda" && ids.has(myId)) {
        return myId;
    }

    if (
        normalizedRole === ROLE_FISIOTERAPEUTA &&
        (tab === "acondicionamiento" || tab === "terapia") &&
        ids.has(myId)
    ) {
        return myId;
    }
    return Number(list[0]?.id) || null;
}

/* =========================================================
   Helpers back/frontend
========================================================= */
function mapFrontendPaymentMethodToBackend(metodo) {
    if (!metodo) return "";
    const v = String(metodo).toLowerCase();
    if (v === "tarjeta_credito" || v === "tarjeta_debito" || v === "tarjeta") return "tarjeta";
    if (v === "transferencia") return "transferencia";
    if (v === "efectivo") return "efectivo";
    return "otro";
}

function mapCitaToAppointment(cita) {
    const fecha = cita.fecha;
    const horaInicio = cita.hora_inicio;
    const horaTermina = cita.hora_termina;

    const time = horaInicio ? horaInicio.slice(0, 5) : "";
    const endTime = horaTermina ? horaTermina.slice(0, 5) : "";

    let color = "bg-blue-100 text-blue-900 border-blue-300";
    if (cita.estado === "confirmado") color = "bg-amber-100 text-amber-900 border-amber-300";
    else if (cita.estado === "completado") color = "bg-emerald-100 text-emerald-900 border-emerald-300";
    else if (cita.estado === "cancelado") color = "bg-red-100 text-red-900 border-red-300";

    const price = Number(cita.precio || 0);
    const finalAmount = Number(cita.monto_final ?? price);
    const paidAmount = Number(cita.anticipo || 0);
    const remainingAmount = Math.max(0, finalAmount - paidAmount);

    let paymentStatus = "pendiente";
    if (paidAmount > 0 && remainingAmount > 0) paymentStatus = "parcial";
    if (remainingAmount <= 0 && finalAmount > 0) paymentStatus = "liquidado";

    return {
        id: cita.id,
        date: fecha,
        time,
        endTime,
        patientId: cita.paciente,
        patient: cita.paciente_nombre || "Paciente",
        service: cita.servicio_nombre || "Servicio",
        serviceId: cita.servicio,
        professionalId: cita.profesional,
        professional: cita.profesional_nombre || "Profesional",
        status: cita.estado,
        price,
        paid: Boolean(cita.pagado),
        notesInternal: cita.notas || "",
        discountPct: Number(cita.descuento_porcentaje || 0),
        deposit: paidAmount,
        metodo_pago: cita.metodo_pago || "",
        agendaTipo: cita.agenda_tipo || "general",
        finalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus,
        color,
        _type: "cita",
    };
}

function mapBloqueoToAppointment(b) {
    const time = (b.hora_inicio || "").slice(0, 5);
    const endTime = (b.hora_termina || "").slice(0, 5);
    const motivo = String(b.motivo || "").trim();

    return {
        id: `blk-${b.id}`,
        date: b.fecha,
        time: time || "08:00",
        endTime: endTime || "09:00",
        motivo: motivo || "No disponible",
        patient: "Horario bloqueado",
        service: motivo || "Bloqueo",
        professionalId: b.profesional,
        professional: b.profesional_nombre || "Profesional",
        status: "bloqueado",
        price: 0,
        paid: false,
        type: "bloqueo",
        agendaTipo: b.agenda_tipo || "general",
        color: "bg-slate-200 text-slate-800 border-slate-300",
        _type: "bloqueo",
        _raw: b,
    };
}

function sortAppointments(a, b) {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
}

const DAYKEY_TO_JS = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };

function isoToDate(d) {
    const [y, m, day] = String(d).split("-").map(Number);
    return new Date(y, (m || 1) - 1, day || 1);
}

function dateToIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function buildRepeatDatesCount({ startDateIso, repeatDays, repeatCount }) {
    const start = isoToDate(startDateIso);
    const daysSet = new Set((repeatDays || []).map(String));
    const targetJsDays = new Set(
        Array.from(daysSet)
            .map((k) => DAYKEY_TO_JS[k])
            .filter((v) => typeof v === "number")
    );
    if (targetJsDays.size === 0) return [];

    const out = [];
    for (let i = 0; i < 365; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (!targetJsDays.has(d.getDay())) continue;
        out.push(dateToIso(d));
        if (out.length >= Number(repeatCount || 1)) break;
    }
    return out;
}

/* =========================================================
   Modales
========================================================= */
function ModalShell({ title, children, onClose, actions }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                        Cerrar
                    </button>
                </div>
                <div className="px-5 py-4 text-sm text-slate-700">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{actions}</div>
            </div>
        </div>
    );
}

function InfoModal({ open, title = "Aviso", message, onClose }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onClose}
            actions={
                <button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110">
                    Entendido
                </button>
            }
        >
            {message}
        </ModalShell>
    );
}

function ConfirmModal({ open, title = "Confirmar", message, onCancel, onConfirm, danger }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onCancel}
            actions={
                <>
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold text-white hover:brightness-110 ${danger ? "bg-red-600" : "bg-slate-900"
                            }`}
                    >
                        Confirmar
                    </button>
                </>
            }
        >
            {message}
        </ModalShell>
    );
}

function resolveAgendaTipoByTab(tab) {
    if (tab === "acondicionamiento") return "acondicionamiento";
    if (tab === "terapia") return "terapia";
    return "general";
}

/* =========================================================
   Administrativa
========================================================= */
export default function Administrativa() {
    const [activeTab, setActiveTab] = useState("agenda");
    const [branch, setBranch] = useState("Ortho Clinic Centro");
    const savingLockRef = useRef(false);
    const [patientsPrivacyLock, setPatientsPrivacyLock] = useState(false);
    const activeAgendaTipo = useMemo(() => resolveAgendaTipoByTab(activeTab), [activeTab]);

    const [selectedProfessionalId, setSelectedProfessionalId] = useState(null);
    const [agendaDate, setAgendaDate] = useState(() => new Date());

    const [dualMode, setDualMode] = useState(false);
    const [proA, setProA] = useState(null);
    const [proB, setProB] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [reservationPreset, setReservationPreset] = useState(null);

    const [me, setMe] = useState(null);
    const [professionals, setProfessionals] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    const [blockOpen, setBlockOpen] = useState(false);
    const [blockPreset, setBlockPreset] = useState(null);

    const [infoModal, setInfoModal] = useState({ open: false, title: "", message: "" });
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: "",
        message: "",
        danger: false,
        onConfirm: null,
    });

    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const userEmail = localStorage.getItem("auth.user");

    const forceLogout = () => {
        clearSession();
        window.location.href = "/login";
    };

    const tokenOrLogout = () => {
        const token = localStorage.getItem("auth.access");
        if (!token) {
            forceLogout();
            return null;
        }
        return token;
    };

    useEffect(() => {
        const stopRefresh = startSessionRefresh({
            apiBase: API_BASE,
            onAuthLost: forceLogout,
        });

        return () => stopRefresh?.();
    }, []);

    const rol = normalizeRole(me?.rol || null);
    const allowedTabs = useMemo(() => getAllowedTabsByRole(rol), [rol]);

    const generalProfessionals = useMemo(() => {
        return getProfessionalsForTab("agenda", professionals);
    }, [professionals]);

    const rehabProfessionals = useMemo(() => {
        return getProfessionalsForTab("acondicionamiento", professionals);
    }, [professionals]);

    const visibleProfessionalsForCurrentTab = useMemo(() => {
        if (activeTab === "agenda") return generalProfessionals;
        if (activeTab === "acondicionamiento" || activeTab === "terapia") return rehabProfessionals;
        return professionals;
    }, [activeTab, generalProfessionals, rehabProfessionals, professionals]);

    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) {
            setActiveTab(allowedTabs[0] || "perfil");
        }
    }, [allowedTabs, activeTab]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setSidebarMobileOpen(false);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const showInfo = (message, title = "Aviso") => setInfoModal({ open: true, title, message });

    async function safeJson(resp) {
        try {
            return await resp.json();
        } catch {
            try {
                const text = await resp.text();
                if (!text) return null;
                return JSON.parse(text);
            } catch {
                return null;
            }
        }
    }

    useEffect(() => {
        const token = tokenOrLogout();
        if (!token) return;

        async function loadMeAndProfessionals() {
            try {
                setLoadingMe(true);

                const respMe = await fetch(`${API_BASE}/api/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (respMe.status === 401) return forceLogout();
                if (!respMe.ok) throw new Error("No se pudo cargar /api/me/");
                const meData = await respMe.json();
                meData.rol = normalizeRole(meData.rol);
                setMe(meData);

                const respPros = await fetch(`${API_BASE}/api/profesionales/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (respPros.status === 401) return forceLogout();
                if (!respPros.ok) throw new Error("No se pudo cargar /api/profesionales/");
                const prosData = await respPros.json();

                const list = (prosData || []).map((p) => ({
                    ...p,
                    rol: normalizeRole(p.rol),
                    label: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username,
                    color_agenda: p.color_agenda || "#06b6d4",
                }));

                setProfessionals(list);
            } catch (e) {
                console.error(e);
                showInfo("No se pudo cargar la información del usuario/profesionales. Revisa consola.");
            } finally {
                setLoadingMe(false);
            }
        }

        loadMeAndProfessionals();
    }, []);

    useEffect(() => {
        if (!["agenda", "acondicionamiento", "terapia"].includes(activeTab)) return;

        const preferredId = getPreferredProfessionalId({
            tab: activeTab,
            role: rol,
            me,
            visibleProfessionals: visibleProfessionalsForCurrentTab,
            currentId: selectedProfessionalId,
        });

        setSelectedProfessionalId((prev) => {
            const current = prev != null ? Number(prev) : null;
            return current === preferredId ? prev : preferredId;
        });

        setProA((prev) => {
            const current = prev != null ? Number(prev) : null;
            if (
                current != null &&
                visibleProfessionalsForCurrentTab.some((p) => Number(p.id) === current)
            ) {
                return prev;
            }
            return preferredId;
        });

        setProB((prev) => {
            const current = prev != null ? Number(prev) : null;
            const available = visibleProfessionalsForCurrentTab.filter(
                (p) => Number(p.id) !== Number(preferredId)
            );

            if (current != null && available.some((p) => Number(p.id) === current)) {
                return prev;
            }

            return Number(available[0]?.id) || null;
        });
    }, [
        activeTab,
        rol,
        me,
        visibleProfessionalsForCurrentTab,
        selectedProfessionalId,
    ]);

    const loadAgendaData = useCallback(async () => {
        const token = tokenOrLogout();
        if (!token) return;

        const agendaTipo = resolveAgendaTipoByTab(activeTab);

        try {
            setLoadingAppointments(true);

            const qs = `?agenda_tipo=${encodeURIComponent(agendaTipo)}`;

            const [respCitas, respBloqs] = await Promise.all([
                fetch(`${API_BASE}/api/citas/${qs}`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/api/bloqueos/${qs}`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                }),
            ]);

            if (respCitas.status === 401 || respBloqs.status === 401) return forceLogout();
            if (!respCitas.ok) throw new Error("No se pudieron cargar las citas");

            const citasData = await safeJson(respCitas);
            const citasMapped = (Array.isArray(citasData) ? citasData : []).map(mapCitaToAppointment);

            const bloqsData = respBloqs.ok ? await safeJson(respBloqs) : null;
            const bloqueosMapped = (Array.isArray(bloqsData) ? bloqsData : []).map(mapBloqueoToAppointment);

            const merged = [...citasMapped, ...bloqueosMapped].sort(sortAppointments);
            setAppointments(merged);
        } catch (err) {
            console.error(err);
            setAppointments([]);
            showInfo("No se pudieron cargar las citas/bloqueos. Revisa consola.");
        } finally {
            setLoadingAppointments(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (["agenda", "acondicionamiento", "terapia"].includes(activeTab)) {
            loadAgendaData();
        }
    }, [loadAgendaData, activeTab]);

    useEffect(() => {
        const onRefresh = () => loadAgendaData();
        window.addEventListener("fisionerv:agenda-refresh", onRefresh);
        return () => window.removeEventListener("fisionerv:agenda-refresh", onRefresh);
    }, [loadAgendaData]);

    const refreshAppointmentById = useCallback(async (id, agendaTipoParam = activeAgendaTipo) => {
        const token = tokenOrLogout();
        if (!token || !id) return null;

        try {
            const resp = await fetch(
                `${API_BASE}/api/citas/${id}/?agenda_tipo=${encodeURIComponent(agendaTipoParam || "general")}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (resp.status === 401) return forceLogout();
            if (!resp.ok) return null;

            const saved = await safeJson(resp);
            const appt = mapCitaToAppointment(saved);

            setAppointments((prev) =>
                prev.map((a) => (String(a.id) === String(appt.id) ? appt : a)).sort(sortAppointments)
            );
            return saved;
        } catch (e) {
            console.error("refreshAppointmentById error:", e);
            return null;
        }
    }, [activeAgendaTipo]);

    const handleMoveAppointment = async (oldAppt, patch) => {
        if (oldAppt?._type === "bloqueo") return;

        const token = tokenOrLogout();
        if (!token) return;

        const optimistic = {
            ...oldAppt,
            date: patch.date ?? oldAppt.date,
            time: patch.time ?? oldAppt.time,
            endTime: patch.endTime ?? oldAppt.endTime,
            professionalId: patch.professionalId ?? oldAppt.professionalId,
            professional:
                professionals.find((p) => Number(p.id) === Number(patch.professionalId ?? oldAppt.professionalId))?.label ||
                oldAppt.professional,
        };

        setAppointments((prev) =>
            prev.map((a) => (a.id === oldAppt.id ? optimistic : a)).sort(sortAppointments)
        );

        const payload = {
            agenda_tipo: activeAgendaTipo,
            fecha: patch.date ?? oldAppt.date,
            hora_inicio: `${String(patch.time || oldAppt.time).slice(0, 5)}:00`,
            hora_termina: `${String(patch.endTime || oldAppt.endTime || patch.time || oldAppt.time).slice(0, 5)}:00`,
        };

        if (patch.professionalId != null) payload.profesional = patch.professionalId;

        try {
            const resp = await fetch(
                `${API_BASE}/api/citas/${oldAppt.id}/?agenda_tipo=${encodeURIComponent(
                    patch.agenda_tipo || oldAppt.agendaTipo || activeAgendaTipo
                )}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                }
            );

            if (resp.status === 401) return forceLogout();

            if (!resp.ok) {
                const err = await safeJson(resp);
                console.error("Error moviendo cita:", err || resp.status);
                setAppointments((prev) =>
                    prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments)
                );
                showInfo("No se pudo mover la cita. Intenta de nuevo.");
                return;
            }

            const saved = await safeJson(resp);
            if (!saved?.id) {
                await loadAgendaData();
                return;
            }

            const appt = mapCitaToAppointment(saved);
            setAppointments((prev) =>
                prev.map((a) => (a.id === appt.id ? appt : a)).sort(sortAppointments)
            );
        } catch (e) {
            console.error("Error de red moviendo cita:", e);
            setAppointments((prev) =>
                prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments)
            );
            showInfo("Error de red moviendo la cita.");
        }
    };

    const handleNewReservation = (preset = null) => {
        setSelectedAppointment(null);
        setReservationPreset(preset || null);
        setModalOpen(true);
    };

    const handleOpenAppointment = (appt) => {
        if (appt?._type === "bloqueo") return;
        setSelectedAppointment(appt);
        setReservationPreset(null);
        setModalOpen(true);
    };

    const handleOpenBlockModal = (preset) => {
        setBlockPreset(preset || null);
        setBlockOpen(true);
    };

    const handleSaveBlockTime = async (form) => {
        const token = tokenOrLogout();
        if (!token) return;

        const professionalId = form.professionalId ?? null;
        if (!professionalId) {
            showInfo("Selecciona un profesional para bloquear.");
            return;
        }

        const dates = form.repeatEnabled
            ? buildRepeatDatesCount({
                startDateIso: form.date,
                repeatDays: form.repeatDays,
                repeatCount: form.repeatCount,
            })
            : [form.date];

        try {
            for (const d of dates) {
                const payload = {
                    profesional: professionalId,
                    agenda_tipo: activeAgendaTipo,
                    fecha: d,
                    hora_inicio: `${String(form.startTime || "08:00").slice(0, 5)}:00`,
                    hora_termina: `${String(form.endTime || "09:00").slice(0, 5)}:00`,
                    motivo: String(form.motivo || "").trim(),
                };

                const resp = await fetch(`${API_BASE}/api/bloqueos/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });

                if (resp.status === 401) return forceLogout();
                if (!resp.ok) {
                    const err = await resp.json().catch(() => null);
                    console.error("Error creando bloqueo:", err || resp.status);
                    showInfo("No se pudo crear el bloqueo. Revisa consola.");
                    return;
                }
            }

            setBlockOpen(false);
            setBlockPreset(null);
            await loadAgendaData();
        } catch (e) {
            console.error(e);
            showInfo("Error de red creando bloqueo.");
        }
    };

    const normalizePhoneMX = (raw) => {
        const digits = String(raw || "").replace(/\D/g, "");
        if (!digits) return "";
        if (digits.startsWith("52") && digits.length >= 12) return digits;
        if (digits.length === 10) return `52${digits}`;
        return digits;
    };
    const handleSaveReservation = async (form) => {
        if (savingLockRef.current) return null;
        savingLockRef.current = true;

        const token = tokenOrLogout();
        if (!token) {
            savingLockRef.current = false;
            return null;
        }

        const isExistingPatient = Boolean(form.patientId);
        const isEditing = Boolean(form.id);

        const basePrecio = Number(form.price || 0);
        const baseDescuento = Number(form.discountPct || 0);
        const montoFacturado = Number(form.montoFacturado ?? form.price ?? 0);
        const montoFinal = Math.max(
            0,
            montoFacturado - (montoFacturado * baseDescuento) / 100
        );

        const previousPaid = isEditing ? Boolean(selectedAppointment?.paid) : false;
        const previousDeposit = isEditing ? Number(selectedAppointment?.deposit || 0) : 0;
        const previousMethod = isEditing ? String(selectedAppointment?.metodo_pago || "") : "";

        const basePayload = {
            servicio: form.serviceId,
            profesional: form.professionalId,
            agenda_tipo: activeAgendaTipo,
            fecha: form.date,
            hora_inicio: `${String(form.time || "").slice(0, 5)}:00`,
            hora_termina: `${String(form.endTime || form.time || "").slice(0, 5)}:00`,
            estado: form.status || "reservado",
            notas: form.notesInternal || "",
            precio: basePrecio,

            pagado: previousPaid,
            metodo_pago: mapFrontendPaymentMethodToBackend(previousMethod),
            descuento_porcentaje: baseDescuento,
            anticipo: previousDeposit,
            monto_final: montoFinal,
        };

        const payload = isExistingPatient
            ? { ...basePayload, paciente: form.patientId }
            : {
                ...basePayload,
                paciente: {
                    nombres: form.patient,
                    apellido_pat: form.apellido_pat || "",
                    apellido_mat: form.apellido_mat || "",
                    fecha_nac: form.fecha_nac || null,
                    genero: form.genero || "",
                    telefono: normalizePhoneMX(form.telefono),
                    correo: form.correo || "",
                    molestia: form.molestia || "",
                    notas: form.notesInternal || "",
                },
            };

        const url = isEditing
            ? `${API_BASE}/api/citas/${form.id}/?agenda_tipo=${encodeURIComponent(activeAgendaTipo)}`
            : `${API_BASE}/api/citas/`;
        const method = isEditing ? "PATCH" : "POST";

        try {
            const resp = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (resp.status === 401) {
                forceLogout();
                return null;
            }

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => null);
                console.error("Error al guardar cita:", errorData || resp.status);
                showInfo("Error al guardar la cita. Corrige los campos.");
                return null;
            }

            const saved = await safeJson(resp);
            if (!saved?.id) {
                await loadAgendaData();
                return null;
            }

            const appt = mapCitaToAppointment(saved);

            if (isEditing) {
                setAppointments((prev) =>
                    prev.map((item) => (item.id === appt.id ? appt : item)).sort(sortAppointments)
                );
            } else {
                setAppointments((prev) => [...prev, appt].sort(sortAppointments));
            }

            return saved;
        } catch (err) {
            console.error("Error de red guardando cita:", err);
            showInfo("Error de red guardando cita.");
            return null;
        } finally {
            savingLockRef.current = false;
        }
    };

    const handleDeleteReservation = async (id) => {
        if (!id) return;

        const token = tokenOrLogout();
        if (!token) return;

        try {
            const resp = await fetch(
                `${API_BASE}/api/citas/${id}/?agenda_tipo=${encodeURIComponent(activeAgendaTipo)}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (resp.status === 401) return forceLogout();

            if (!resp.ok && resp.status !== 204) {
                const errorData = await safeJson(resp);
                console.error("Error al eliminar cita:", errorData || resp.status);
                showInfo("No se pudo eliminar la cita. Revisa la consola.");
                return;
            }

            setAppointments((prev) => prev.filter((c) => c.id !== id));
            setModalOpen(false);
            setSelectedAppointment(null);
            setReservationPreset(null);
            notifySalesRefresh();
        } catch (e) {
            console.error("Error al eliminar cita:", e);
            showInfo("Ocurrió un error al eliminar la cita.");
        }
    };

    const handleDeleteBlock = useCallback(async (blockAppt) => {
        const token = tokenOrLogout();
        if (!token) return;

        const rawId =
            blockAppt?._raw?.id ??
            (() => {
                const s = String(blockAppt?.id || "");
                if (s.startsWith("blk-")) return Number(s.slice(4));
                const n = Number(s);
                return Number.isFinite(n) ? n : null;
            })();

        if (!rawId) {
            showInfo("No pude identificar el id del bloqueo en BD.");
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/bloqueos/${rawId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (resp.status === 401) return forceLogout();

            if (!resp.ok && resp.status !== 204) {
                const err = await safeJson(resp);
                console.error("Error eliminando bloqueo:", err || resp.status);
                showInfo("No se pudo eliminar el bloqueo. Revisa consola.");
                return;
            }

            setAppointments((prev) => prev.filter((x) => String(x.id) !== String(blockAppt.id)));
        } catch (e) {
            console.error(e);
            showInfo("Error de red eliminando el bloqueo.");
        }
    }, []);

    const handleLogout = () => forceLogout();

    const initialLetter = (me?.full_name?.trim()?.[0] || me?.username?.trim()?.[0] || userEmail?.trim()?.[0] || "U").toUpperCase();

    const sectionSidebarContent = useMemo(() => {
        if (activeTab === "agenda" || activeTab === "acondicionamiento" || activeTab === "terapia") {
            return (
                <AgendaSidebarContent
                    agendaDate={agendaDate}
                    setAgendaDate={setAgendaDate}
                    branch={branch}
                    setBranch={setBranch}
                    professionals={visibleProfessionalsForCurrentTab}
                    selectedProfessionalId={selectedProfessionalId}
                    setSelectedProfessionalId={setSelectedProfessionalId}
                    role={rol}
                    dualMode={dualMode}
                    setDualMode={setDualMode}
                    proA={proA}
                    setProA={setProA}
                    proB={proB}
                    setProB={setProB}
                />
            );
        }

        if (activeTab === "pacientes") return <PatientsSidebarContent />;
        if (activeTab === "ventas") return <SalesSidebarContent />;

        return null;
    }, [
        activeTab,
        agendaDate,
        branch,
        visibleProfessionalsForCurrentTab,
        selectedProfessionalId,
        rol,
        dualMode,
        proA,
        proB,
    ]);

    if (loadingMe) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-600">
                Cargando usuario...
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-900">
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-cyan-50 via-slate-50 to-indigo-50" />

            <div className="mx-auto max-w-[1900px] px-3 md:px-4 py-4">
                <div className="flex gap-4">
                    <AdminSidebar
                        mobileOpen={sidebarMobileOpen}
                        onCloseMobile={() => setSidebarMobileOpen(false)}
                        collapsed={sidebarCollapsed}
                        onToggleCollapsed={() => setSidebarCollapsed((s) => !s)}
                        allowedTabs={allowedTabs}
                        activeTab={activeTab}
                        onSelectTab={(t) => {
                            if (patientsPrivacyLock) return;
                            setActiveTab(t);
                        }}
                        sectionContent={sectionSidebarContent}
                        locked={patientsPrivacyLock}
                        role={rol}
                    />

                    <main className="flex-1 min-w-0">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-sm px-4 py-3 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarMobileOpen(true)}
                                className="md:hidden h-10 w-10 grid place-items-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 truncate">Dashboard</div>
                                <div className="text-xs text-slate-500 truncate">
                                    {rol ? `• ${roleLabel(rol)}` : "• Panel"}
                                </div>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={patientsPrivacyLock}
                                    onClick={() => (window.location.href = "/")}
                                    className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    title="Ir al sitio"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Sitio
                                </button>

                                <button
                                    type="button"
                                    disabled={patientsPrivacyLock}
                                    onClick={() => setActiveTab("perfil")}
                                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 hover:bg-slate-50"
                                    title="Mi perfil"
                                >
                                    <div className="h-8 w-8 rounded-2xl bg-slate-200 grid place-items-center text-xs font-semibold text-slate-700">
                                        {initialLetter}
                                    </div>
                                    <span className="hidden md:inline text-xs text-slate-600 max-w-[200px] truncate">
                                        {me?.username || userEmail || "Usuario"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    disabled={patientsPrivacyLock}
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#ef4444] px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur shadow-sm overflow-visible">
                            <div className="p-3 md:p-4">
                                {activeTab === "agenda" &&
                                    (loadingAppointments ? (
                                        <div className="p-6 text-sm text-slate-500">Cargando citas desde el servidor...</div>
                                    ) : (
                                        <AgendaGeneralView
                                            appointments={appointments}
                                            professionals={generalProfessionals}
                                            selectedProfessionalId={selectedProfessionalId}
                                            setSelectedProfessionalId={setSelectedProfessionalId}
                                            role={rol}
                                            myUserId={me?.id}
                                            onNewReservation={handleNewReservation}
                                            onOpenAppointment={handleOpenAppointment}
                                            onMoveAppointment={handleMoveAppointment}
                                            onOpenBlockModal={handleOpenBlockModal}
                                            onDeleteBlock={handleDeleteBlock}
                                            currentDate={agendaDate}
                                            onChangeDate={setAgendaDate}
                                            dualMode={dualMode}
                                            setDualMode={setDualMode}
                                            proA={proA}
                                            setProA={setProA}
                                            proB={proB}
                                            setProB={setProB}
                                        />
                                    ))}

                                {activeTab === "acondicionamiento" &&
                                    (loadingAppointments ? (
                                        <div className="p-6 text-sm text-slate-500">Cargando agenda de acondicionamiento...</div>
                                    ) : (
                                        <AcondicionamientoAgendaView
                                            appointments={appointments}
                                            professionals={rehabProfessionals}
                                            selectedProfessionalId={selectedProfessionalId}
                                            setSelectedProfessionalId={setSelectedProfessionalId}
                                            role={rol}
                                            myUserId={me?.id}
                                            agendaTipo="acondicionamiento"
                                            tituloAgenda="Acondicionamiento"
                                            defaultCalendarMode="day"
                                            allowTableView={true}
                                            onNewReservation={handleNewReservation}
                                            onOpenAppointment={handleOpenAppointment}
                                            onMoveAppointment={handleMoveAppointment}
                                            onOpenBlockModal={handleOpenBlockModal}
                                            onDeleteBlock={handleDeleteBlock}
                                            currentDate={agendaDate}
                                            onChangeDate={setAgendaDate}
                                            dualMode={dualMode}
                                            setDualMode={setDualMode}
                                            proA={proA}
                                            setProA={setProA}
                                            proB={proB}
                                            setProB={setProB}
                                        />
                                    ))}

                                {activeTab === "terapia" &&
                                    (loadingAppointments ? (
                                        <div className="p-6 text-sm text-slate-500">Cargando agenda de terapia...</div>
                                    ) : (
                                        <TerapiaAgendaView
                                            appointments={appointments}
                                            professionals={rehabProfessionals}
                                            selectedProfessionalId={selectedProfessionalId}
                                            setSelectedProfessionalId={setSelectedProfessionalId}
                                            role={rol}
                                            myUserId={me?.id}
                                            agendaTipo="terapia"
                                            tituloAgenda="Terapia"
                                            onNewReservation={handleNewReservation}
                                            onOpenAppointment={handleOpenAppointment}
                                            onMoveAppointment={handleMoveAppointment}
                                            onOpenBlockModal={handleOpenBlockModal}
                                            onDeleteBlock={handleDeleteBlock}
                                            currentDate={agendaDate}
                                            onChangeDate={setAgendaDate}
                                            dualMode={dualMode}
                                            setDualMode={setDualMode}
                                            proA={proA}
                                            setProA={setProA}
                                            proB={proB}
                                            setProB={setProB}
                                        />
                                    ))}

                                {activeTab === "pacientes" && (
                                    <PatientsView
                                        role={rol}
                                        myUserId={me?.id}
                                        onPrivacyLockChange={setPatientsPrivacyLock}
                                    />
                                )}

                                {activeTab === "ventas" && <SalesView />}

                                {activeTab === "servicios" && (
                                    <InsumosView role={rol} myUserId={me?.id} />
                                )}

                                {activeTab === "comentarios" && <CommentsModerationView />}

                                {activeTab === "equipo" && <Equipo />}

                                {activeTab === "perfil" && (
                                    <UserProfileView
                                        me={me}
                                        onUpdated={(nextMe) => {
                                            const normalizedNext = {
                                                ...nextMe,
                                                rol: normalizeRole(nextMe?.rol),
                                            };
                                            setMe(normalizedNext);
                                            if (normalizedNext?.email) {
                                                localStorage.setItem("auth.user", normalizedNext.email);
                                            }
                                        }}
                                        onShowInfo={(msg, title) => showInfo(msg, title)}
                                    />
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {modalOpen && activeTab === "acondicionamiento" && (
                <AcondicionamientoReservationModal
                    appointment={selectedAppointment}
                    preset={reservationPreset}
                    appointments={appointments}
                    onClose={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleSaveReservation}
                    onDelete={handleDeleteReservation}
                    onRefreshAppointment={refreshAppointmentById}
                    onRequestCloseModal={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    agendaTipo="acondicionamiento"
                    role={rol}
                    myUserId={me?.id}
                />
            )}

            {modalOpen && activeTab === "terapia" && (
                <TerapiaReservationModal
                    appointment={selectedAppointment}
                    preset={reservationPreset}
                    appointments={appointments}
                    onClose={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleSaveReservation}
                    onDelete={handleDeleteReservation}
                    onRefreshAppointment={(id) => refreshAppointmentById(id, "terapia")}
                    onRequestCloseModal={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    agendaTipo="terapia"
                    role={rol}
                    myUserId={me?.id}
                />
            )}

            {modalOpen && activeTab !== "acondicionamiento" && activeTab !== "terapia" && (
                <ReservationModal
                    appointment={selectedAppointment}
                    preset={reservationPreset}
                    appointments={appointments}
                    onClose={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleSaveReservation}
                    onDelete={handleDeleteReservation}
                    onRefreshAppointment={refreshAppointmentById}
                    onRequestCloseModal={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                />
            )}

            {blockOpen && activeTab === "acondicionamiento" && (
                <AcondicionamientoBlockTimeModal
                    preset={blockPreset}
                    onClose={() => {
                        setBlockOpen(false);
                        setBlockPreset(null);
                    }}
                    onSave={handleSaveBlockTime}
                />
            )}

            {blockOpen && activeTab === "terapia" && (
                <TerapiaBlockTimeModal
                    preset={blockPreset}
                    onClose={() => {
                        setBlockOpen(false);
                        setBlockPreset(null);
                    }}
                    onSave={handleSaveBlockTime}
                />
            )}

            {blockOpen && activeTab !== "acondicionamiento" && activeTab !== "terapia" && (
                <BlockTimeModal
                    preset={blockPreset}
                    onClose={() => {
                        setBlockOpen(false);
                        setBlockPreset(null);
                    }}
                    onSave={handleSaveBlockTime}
                />
            )}

            <InfoModal
                open={infoModal.open}
                title={infoModal.title}
                message={infoModal.message}
                onClose={() => setInfoModal({ open: false, title: "", message: "" })}
            />

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={confirmModal.danger}
                onCancel={() => setConfirmModal((s) => ({ ...s, open: false }))}
                onConfirm={() => {
                    if (typeof confirmModal.onConfirm === "function") confirmModal.onConfirm();
                }}
            />
        </div>
    );
}