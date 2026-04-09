import { useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Trash2,
    RotateCcw,
    Users,
    Shield,
    Mail,
    Phone,
    Image as ImgIcon,
    AlignLeft,
    X,
    Pencil,
    Palette,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function normalize(str) {
    return String(str || "").trim();
}

function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email).toLowerCase());
}

function isPhoneValid(phone) {
    const digits = normalize(phone).replace(/\D/g, "");
    return digits.length >= 8;
}

function normalizarColorHex(valor, fallback = "#06b6d4") {
    const v = String(valor || "").trim();

    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        return v.toLowerCase();
    }

    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
        const r = v[1];
        const g = v[2];
        const b = v[3];
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return fallback;
}

function isColorHexValid(valor) {
    return /^#[0-9a-fA-F]{6}$/.test(String(valor || "").trim());
}

const ROLES = [
    { value: "doctor", label: "Doctor" },
    { value: "fisioterapeuta", label: "Fisioterapeuta" },
    { value: "aux_fisioterapia", label: "Auxiliar de fisioterapia" },
    { value: "recepcionista", label: "Recepcionista" },
];

async function apiFetch(path, options = {}) {
    const access = localStorage.getItem("auth.access");
    const refresh = localStorage.getItem("auth.refresh");

    const headers = { ...(options.headers || {}) };
    if (access) headers.Authorization = `Bearer ${access}`;

    let resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (resp.status === 401 && refresh) {
        const r = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });

        if (r.ok) {
            const data = await r.json();
            localStorage.setItem("auth.access", data.access);
            headers.Authorization = `Bearer ${data.access}`;
            resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
        } else {
            localStorage.removeItem("auth.access");
            localStorage.removeItem("auth.refresh");
            localStorage.removeItem("auth.user");
            window.location.href = "/login";
            return resp;
        }
    }

    return resp;
}

function ModalShell({ title, children, onClose, actions, maxWidth = "max-w-md" }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className={`w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-5 py-4 text-sm text-slate-700">
                    {children}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
                    {actions}
                </div>
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
                <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                    Entendido
                </button>
            }
        >
            {message}
        </ModalShell>
    );
}

function ConfirmModal({ open, title, message, danger, onCancel, onConfirm }) {
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

function EditUserModal({
    open,
    user,
    onClose,
    onSave,
    saving,
}) {
    const [form, setForm] = useState({
        id: null,
        nombres: "",
        apellidos: "",
        usuario: "",
        correo: "",
        telefono: "",
        rol: "doctor",
        descripcion: "",
        color_agenda: "#06b6d4",
        foto: null,
        password: "",
    });

    useEffect(() => {
        if (!open || !user) return;

        setForm({
            id: user.id,
            nombres: user.first_name || "",
            apellidos: user.last_name || "",
            usuario: user.username || "",
            correo: user.email || "",
            telefono: user.telefono || "",
            rol: user.rol || "fisioterapeuta",
            descripcion: user.descripcion || "",
            color_agenda: normalizarColorHex(user.color_agenda || user.color_agenda_out || "#06b6d4"),
            foto: null,
            password: "",
        });
    }, [open, user]);

    if (!open || !user) return null;

    function updateField(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function validar() {
        const nombres = normalize(form.nombres);
        const apellidos = normalize(form.apellidos);
        const usuario = normalize(form.usuario);
        const correo = normalize(form.correo);
        const telefono = normalize(form.telefono);
        const descripcion = normalize(form.descripcion);

        if (!nombres) return "Ingresa nombres.";
        if (!apellidos) return "Ingresa apellidos.";
        if (!usuario) return "Ingresa usuario.";
        if (correo && !isEmailValid(correo)) return "El correo no parece válido.";
        if (telefono && !isPhoneValid(telefono)) return "El teléfono no parece válido.";
        if (!form.rol) return "Selecciona un rol.";
        if (descripcion.length > 500) return "La descripción es muy larga (máx 500 chars).";
        if (!isColorHexValid(form.color_agenda)) return "El color debe tener formato #rrggbb.";
        if (form.password && form.password.length < 6) return "Si escribes contraseña nueva, debe tener al menos 6 caracteres.";

        return null;
    }

    function handleSave() {
        const error = validar();
        if (error) return onSave({ ok: false, error });

        onSave({
            ok: true,
            data: {
                ...form,
                color_agenda: normalizarColorHex(form.color_agenda),
            },
        });
    }

    return (
        <ModalShell
            title="Editar usuario"
            onClose={onClose}
            maxWidth="max-w-3xl"
            actions={
                <>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </>
            }
        >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field label="Nombres">
                    <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.nombres}
                        onChange={(e) => updateField("nombres", e.target.value)}
                    />
                </Field>

                <Field label="Apellidos">
                    <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.apellidos}
                        onChange={(e) => updateField("apellidos", e.target.value)}
                    />
                </Field>

                <Field label="Usuario">
                    <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.usuario}
                        onChange={(e) => updateField("usuario", e.target.value)}
                    />
                </Field>

                <Field label="Correo (opcional)">
                    <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.correo}
                        onChange={(e) => updateField("correo", e.target.value)}
                    />
                </Field>

                <Field label="Teléfono (opcional)">
                    <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.telefono}
                        onChange={(e) => updateField("telefono", e.target.value)}
                    />
                </Field>

                <Field label="Rol">
                    <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                        value={form.rol}
                        onChange={(e) => updateField("rol", e.target.value)}
                    >
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Color de agenda">
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={normalizarColorHex(form.color_agenda)}
                            onChange={(e) => updateField("color_agenda", e.target.value)}
                            className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                        />

                        <div className="w-full">
                            <input
                                value={form.color_agenda}
                                onChange={(e) => updateField("color_agenda", e.target.value)}
                                placeholder="#06b6d4"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                            />
                            {!isColorHexValid(form.color_agenda) && normalize(form.color_agenda) ? (
                                <p className="mt-1 text-[11px] text-amber-600">
                                    Usa formato hexadecimal válido, por ejemplo: #06b6d4
                                </p>
                            ) : null}
                        </div>
                    </div>
                </Field>

                <Field label="Nueva contraseña (opcional)">
                    <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Déjalo vacío si no cambia"
                    />
                </Field>

                <div className="lg:col-span-2">
                    <Field label="Descripción (opcional)">
                        <textarea
                            className="w-full min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                            value={form.descripcion}
                            onChange={(e) => updateField("descripcion", e.target.value)}
                        />
                    </Field>
                </div>

                <div className="lg:col-span-2">
                    <Field label="Cambiar foto (opcional)">
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                            onChange={(e) => updateField("foto", e.target.files?.[0] || null)}
                        />
                    </Field>
                </div>
            </div>
        </ModalShell>
    );
}

export function Equipo() {
    const [form, setForm] = useState({
        nombres: "",
        apellidos: "",
        usuario: "",
        correo: "",
        telefono: "",
        rol: "doctor",
        password: "",
        descripcion: "",
        foto: null,
        color_agenda: "#06b6d4",
    });

    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);

    const [info, setInfo] = useState({ open: false, title: "", message: "" });
    const [confirm, setConfirm] = useState({ open: false, userId: null });
    const [editState, setEditState] = useState({ open: false, user: null });

    const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

    const limpiar = () => {
        setForm({
            nombres: "",
            apellidos: "",
            usuario: "",
            correo: "",
            telefono: "",
            rol: "doctor",
            password: "",
            descripcion: "",
            foto: null,
            color_agenda: "#06b6d4",
        });
    };

    const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

    const validar = () => {
        const nombres = normalize(form.nombres);
        const apellidos = normalize(form.apellidos);
        const usuario = normalize(form.usuario);
        const correo = normalize(form.correo);
        const telefono = normalize(form.telefono);
        const password = String(form.password || "");
        const descripcion = normalize(form.descripcion);

        if (!nombres) return "Ingresa nombres.";
        if (!apellidos) return "Ingresa apellidos.";
        if (!usuario) return "Ingresa usuario.";
        if (correo && !isEmailValid(correo)) return "El correo no parece válido.";
        if (telefono && !isPhoneValid(telefono)) return "El teléfono no parece válido.";
        if (!form.rol) return "Selecciona un rol.";
        if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
        if (descripcion.length > 500) return "La descripción es muy larga (máx 500 chars).";
        if (!isColorHexValid(form.color_agenda)) return "El color debe tener formato #rrggbb.";

        return null;
    };

    async function cargar() {
        setLoading(true);
        try {
            const resp = await apiFetch("/api/staff/");
            if (!resp.ok) {
                const t = await resp.text();
                console.error("STAFF LIST ERROR:", resp.status, t);
                setUsers([]);
                return;
            }

            const data = await resp.json();
            const mapped = (Array.isArray(data) ? data : []).map((u) => ({
                ...u,
                rol: u.rol_out ?? u.rol,
                telefono: u.telefono_out ?? u.telefono,
                descripcion: u.descripcion_out ?? u.descripcion,
                color_agenda: normalizarColorHex(u.color_agenda_out ?? u.color_agenda ?? "#06b6d4"),
            }));
            setUsers(mapped);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    const darAlta = async () => {
        const err = validar();
        if (err) {
            setInfo({ open: true, title: "Validación", message: err });
            return;
        }

        const fd = new FormData();
        fd.append("username", normalize(form.usuario));
        fd.append("first_name", normalize(form.nombres));
        fd.append("last_name", normalize(form.apellidos));
        fd.append("email", normalize(form.correo).toLowerCase());
        fd.append("password", String(form.password));
        fd.append("rol", form.rol);
        fd.append("telefono", normalize(form.telefono));
        fd.append("descripcion", normalize(form.descripcion));
        fd.append("color_agenda", normalizarColorHex(form.color_agenda));
        if (form.foto) fd.append("foto", form.foto);

        setLoading(true);
        try {
            const resp = await apiFetch("/api/staff/", {
                method: "POST",
                body: fd,
                headers: {},
            });

            if (!resp.ok) {
                const txt = await resp.text();
                console.error("STAFF CREATE ERROR:", resp.status, txt);
                setInfo({
                    open: true,
                    title: "Error",
                    message: `No se pudo crear. HTTP ${resp.status}. Revisa consola.`,
                });
                return;
            }

            await cargar();
            limpiar();
            setInfo({ open: true, title: "Listo", message: "Usuario creado." });
        } finally {
            setLoading(false);
        }
    };

    const pedirEliminar = (id) => setConfirm({ open: true, userId: id });

    const eliminar = async () => {
        const id = confirm.userId;
        setConfirm({ open: false, userId: null });

        if (!id) return;

        setLoading(true);
        try {
            const resp = await apiFetch(`/api/staff/${id}/`, { method: "DELETE" });

            if (!resp.ok) {
                setInfo({ open: true, title: "Error", message: "No se pudo eliminar." });
                return;
            }

            setUsers((prev) => prev.filter((u) => u.id !== id));
            setInfo({ open: true, title: "Listo", message: "Usuario eliminado." });
        } finally {
            setLoading(false);
        }
    };

    const abrirEditar = (user) => {
        setEditState({ open: true, user });
    };

    const guardarEdicion = async (result) => {
        if (!result?.ok) {
            setInfo({ open: true, title: "Validación", message: result?.error || "Formulario inválido." });
            return;
        }

        const edit = result.data;

        const fd = new FormData();
        fd.append("username", normalize(edit.usuario));
        fd.append("first_name", normalize(edit.nombres));
        fd.append("last_name", normalize(edit.apellidos));
        fd.append("email", normalize(edit.correo).toLowerCase());
        fd.append("rol", edit.rol);
        fd.append("telefono", normalize(edit.telefono));
        fd.append("descripcion", normalize(edit.descripcion));
        fd.append("color_agenda", normalizarColorHex(edit.color_agenda));
        if (edit.password) fd.append("password", edit.password);
        if (edit.foto) fd.append("foto", edit.foto);

        setSavingEdit(true);
        try {
            const resp = await apiFetch(`/api/staff/${edit.id}/`, {
                method: "PATCH",
                body: fd,
                headers: {},
            });

            if (!resp.ok) {
                const txt = await resp.text();
                console.error("STAFF UPDATE ERROR:", resp.status, txt);
                setInfo({
                    open: true,
                    title: "Error",
                    message: `No se pudo actualizar. HTTP ${resp.status}. Revisa consola.`,
                });
                return;
            }

            await cargar();
            setEditState({ open: false, user: null });
            setInfo({ open: true, title: "Listo", message: "Usuario actualizado." });
        } finally {
            setSavingEdit(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const q = normalize(query).toLowerCase();
        if (!q) return users;

        return users.filter((u) => {
            const nombre = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
            return (
                nombre.includes(q) ||
                String(u.username || "").toLowerCase().includes(q) ||
                String(u.email || "").toLowerCase().includes(q) ||
                roleLabel(u.rol).toLowerCase().includes(q)
            );
        });
    }, [users, query]);

    return (
        <div className="w-full overflow-auto">
            <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 sm:text-lg">
                            <Users className="h-5 w-5 text-[#3dc2d5]" />
                            Equipo de la clínica
                        </h2>
                        <p className="text-xs text-slate-500">
                            Da de alta miembros del equipo y administra su color de agenda.
                        </p>
                    </div>
                    {loading ? <span className="text-xs text-slate-500">Procesando…</span> : null}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <UserPlus className="h-4 w-4 text-[#3dc2d5]" />
                            Alta de usuario
                        </p>
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <Field label="Nombres">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                                    value={form.nombres}
                                    onChange={(e) => handleChange("nombres", e.target.value)}
                                    placeholder="Ej. Juan Carlos"
                                />
                            </Field>

                            <Field label="Apellidos">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                                    value={form.apellidos}
                                    onChange={(e) => handleChange("apellidos", e.target.value)}
                                    placeholder="Ej. Pérez López"
                                />
                            </Field>

                            <Field label="Usuario">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                                    value={form.usuario}
                                    onChange={(e) => handleChange("usuario", e.target.value)}
                                    placeholder="Ej. jperez"
                                />
                            </Field>

                            <div className="lg:col-span-2">
                                <Field label="Correo (opcional)">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                            value={form.correo}
                                            onChange={(e) => handleChange("correo", e.target.value)}
                                            placeholder="Ej. usuario@gmail.com"
                                        />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Teléfono (opcional)">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                        value={form.telefono}
                                        onChange={(e) => handleChange("telefono", e.target.value)}
                                        placeholder="Ej. 55 1234 5678"
                                    />
                                </div>
                            </Field>

                            <Field label="Rol">
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                        value={form.rol}
                                        onChange={(e) => handleChange("rol", e.target.value)}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Field>

                            <Field label="Contraseña">
                                <input
                                    type="password"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                                    value={form.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </Field>

                            <Field label="Color de agenda">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={normalizarColorHex(form.color_agenda)}
                                        onChange={(e) => handleChange("color_agenda", e.target.value)}
                                        className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                                    />

                                    <div className="w-full">
                                        <div className="relative">
                                            <Palette className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <input
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                                value={form.color_agenda}
                                                onChange={(e) => handleChange("color_agenda", e.target.value)}
                                                placeholder="#06b6d4"
                                            />
                                        </div>

                                        {!isColorHexValid(form.color_agenda) && normalize(form.color_agenda) ? (
                                            <p className="mt-1 text-[11px] text-amber-600">
                                                Usa formato hexadecimal válido, por ejemplo: #06b6d4
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </Field>

                            <div className="lg:col-span-2">
                                <Field label="Descripción (opcional)">
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <textarea
                                            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                            value={form.descripcion}
                                            onChange={(e) => handleChange("descripcion", e.target.value)}
                                            placeholder="Breve presentación."
                                        />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Foto (opcional)">
                                <div className="relative">
                                    <ImgIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm focus:border-slate-400 focus:outline-none"
                                        onChange={(e) => handleChange("foto", e.target.files?.[0] || null)}
                                    />
                                </div>

                                {form.foto ? (
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="min-w-0 truncate text-xs text-slate-600">
                                            <b>Seleccionado:</b> {form.foto.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleChange("foto", null)}
                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                                        >
                                            <X size={14} />
                                            Quitar
                                        </button>
                                    </div>
                                ) : null}
                            </Field>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={limpiar}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Limpiar
                            </button>

                            <button
                                type="button"
                                onClick={darAlta}
                                disabled={loading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#3dc2d5] px-5 text-sm font-semibold text-white hover:bg-[#3dc2d5]/80 disabled:opacity-60"
                            >
                                <UserPlus className="h-4 w-4" />
                                Dar alta
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-700">Usuarios dados de alta</p>
                            <p className="text-[11px] text-slate-500">Total: {users.length} usuario(s)</p>
                        </div>

                        <input
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none sm:w-72"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, usuario, correo o rol…"
                        />
                    </div>

                    <div className="overflow-x-auto p-4">
                        <table className="min-w-[1120px] w-full border-separate border-spacing-y-1 text-left">
                            <thead>
                                <tr className="text-[11px] text-slate-500">
                                    <th className="px-3 py-2">Foto</th>
                                    <th className="px-3 py-2">Nombre</th>
                                    <th className="px-3 py-2">Usuario</th>
                                    <th className="px-3 py-2">Correo</th>
                                    <th className="px-3 py-2">Teléfono</th>
                                    <th className="px-3 py-2">Rol</th>
                                    <th className="px-3 py-2">Color</th>
                                    <th className="px-3 py-2">Descripción</th>
                                    <th className="px-3 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="bg-slate-50/70 hover:bg-slate-100/80">
                                        <td className="px-3 py-2">
                                            <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white">
                                                {u.foto_url ? (
                                                    <img src={u.foto_url} alt="foto" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="grid h-full w-full place-items-center text-[10px] text-slate-400">
                                                        N/A
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 text-sm font-semibold text-slate-800">
                                            {u.first_name} {u.last_name}
                                        </td>

                                        <td className="px-3 py-2 text-sm text-slate-700">{u.username}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{u.email}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{u.telefono || "-"}</td>

                                        <td className="px-3 py-2">
                                            <span className="rounded-full border border-violet-200 bg-[#3dc2d5]/15 px-2 py-1 text-[11px] text-[#3dc2d5]">
                                                {roleLabel(u.rol)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-5 w-5 rounded-full border border-slate-300"
                                                    style={{ backgroundColor: normalizarColorHex(u.color_agenda) }}
                                                />
                                                <span className="text-xs text-slate-700">
                                                    {normalizarColorHex(u.color_agenda)}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="max-w-[320px] px-3 py-2 text-sm text-slate-700">
                                            <span className="line-clamp-2">{u.descripcion || "-"}</span>
                                        </td>

                                        <td className="px-3 py-2 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirEditar(u)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => pedirEliminar(u.id)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-1.5 text-[11px] text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!filteredUsers.length && (
                                    <tr>
                                        <td colSpan={9} className="px-3 py-8 text-center text-sm text-slate-400">
                                            No hay usuarios que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <InfoModal
                open={info.open}
                title={info.title}
                message={info.message}
                onClose={() => setInfo({ open: false, title: "", message: "" })}
            />

            <ConfirmModal
                open={confirm.open}
                title="Eliminar usuario"
                message="¿Seguro que quieres eliminar este usuario del equipo? Esta acción no se puede deshacer."
                danger
                onCancel={() => setConfirm({ open: false, userId: null })}
                onConfirm={eliminar}
            />

            <EditUserModal
                open={editState.open}
                user={editState.user}
                saving={savingEdit}
                onClose={() => setEditState({ open: false, user: null })}
                onSave={guardarEdicion}
            />
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="grid gap-1">
            <label className="block text-[11px] font-semibold text-slate-600">{label}</label>
            {children}
        </div>
    );
}