// src/components/Login.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Lock,
    Mail,
    LogIn,
    Eye,
    EyeOff,
    ArrowLeft,
} from "lucide-react";
import { saveSessionTokens } from "../utils/authSession";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const BRAND_CYAN = "#3dc2d5";
const BRAND_GREEN = "#6cc067";
const BRAND_ORANGE = "#f79034";

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.55,
            delay,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
};

const softSpring = {
    type: "spring",
    stiffness: 220,
    damping: 18,
};

export default function Login() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [mode, setMode] = useState("login"); // "login" | "forgot"
    const [forgotValue, setForgotValue] = useState("");
    const [forgotMsg, setForgotMsg] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/auth/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: email.trim(),
                    password: pass,
                }),
            });

            if (!resp.ok) {
                const t = await resp.text();
                console.error("LOGIN ERROR:", resp.status, t);
                setError("Credenciales incorrectas. Verifica tu usuario/correo y contraseña.");
                return;
            }

            const data = await resp.json();
            saveSessionTokens(data, email.trim());
            window.location.href = "/Administrativa";
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar al servidor. ¿Django está corriendo en :8000?");
        } finally {
            setLoading(false);
        }
    }

    async function handleForgot(e) {
        e.preventDefault();
        setError("");
        setForgotMsg("");
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/auth/password-reset/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email_or_username: forgotValue.trim() }),
            });

            const data = await resp.json().catch(() => ({}));
            console.log("FORGOT RAW:", resp.status, data);

            setForgotMsg(
                "Si el usuario existe, te llegará un correo con tu usuario y una contraseña temporal."
            );
            setForgotValue("");
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar al servidor. ¿Django está corriendo en :8000?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="relative min-h-screen overflow-hidden bg-[#eef7f8]">
            {/* Fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,194,213,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(108,192,103,0.14),transparent_28%),radial-gradient(circle_at_bottom_center,rgba(247,144,52,0.12),transparent_24%),linear-gradient(135deg,#eef7f8_0%,#f8fbfc_55%,#eef5f7_100%)]" />

            {/* Blobs animados */}
            <motion.div
                className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
                animate={{ x: [0, 24, 0], y: [0, -16, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="pointer-events-none absolute right-[-40px] top-24 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl"
                animate={{ x: [0, -18, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="pointer-events-none absolute bottom-[-70px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl"
                animate={{ y: [0, -22, 0], scale: [1, 1.07, 1] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Halo central */}
            <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl"
                animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Grid muy sutil */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[560px]"
                >
                    <motion.div
                        whileHover={{ y: -2 }}
                        transition={softSpring}
                        className="overflow-hidden rounded-[36px] border border-white/70 bg-white/78 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                    >
                        {/* Cabecera visual centrada */}
                        <div className="relative border-b border-slate-200/80 px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(61,194,213,0.08),rgba(108,192,103,0.06),rgba(247,144,52,0.05))]" />

                            {/* brillo barrido */}
                            <motion.div
                                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{ x: ["0%", "380%"] }}
                                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                            />

                            <div className="relative flex flex-col items-center text-center">
                                <motion.div
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="show"
                                    custom={0.06}
                                    className="relative"
                                >
                                    {/* glow detrás del logo */}
                                    <motion.div
                                        className="absolute inset-0 rounded-[30px] blur-2xl"
                                        style={{
                                            background: `radial-gradient(circle, ${BRAND_CYAN}35 0%, ${BRAND_GREEN}18 45%, transparent 72%)`,
                                        }}
                                        animate={{
                                            scale: [1, 1.08, 1],
                                            opacity: [0.6, 0.9, 0.6],
                                        }}
                                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                                    />

                                    <motion.div
                                        animate={{ y: [0, -7, 0], rotate: [0, -1.2, 0, 1.2, 0] }}
                                        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative grid h-24 w-24 place-items-center rounded-[28px] border border-slate-200 bg-white shadow-sm"
                                    >
                                        <img
                                            src="/logo.png"
                                            alt="Logo Ortho Clinic Córdoba"
                                            className="h-16 w-16 object-contain"
                                        />
                                    </motion.div>
                                </motion.div>

                                <motion.div
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="show"
                                    custom={0.16}
                                    className="mt-5"
                                >
                                    <motion.div
                                        className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400"
                                        animate={{ letterSpacing: ["0.24em", "0.28em", "0.24em"] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        Panel administrativo
                                    </motion.div>

                                    <motion.h1
                                        className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
                                        animate={{ y: [0, -1.5, 0] }}
                                        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        Ortho Clinic Córdoba
                                    </motion.h1>
                                </motion.div>
                            </div>
                        </div>

                        {/* Formulario */}
                        <div className="px-6 py-6 sm:px-8 sm:py-7">
                            <motion.div
                                variants={fadeUp}
                                initial="hidden"
                                animate="show"
                                custom={0.22}
                                className="mb-5"
                            >
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                                    {mode === "login" ? "Iniciar sesión" : "Recuperar contraseña"}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {mode === "login"
                                        ? "Ingresa con tu usuario para acceder al panel."
                                        : ""}
                                </p>
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        key={`error-${error}`}
                                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.25 }}
                                        className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                {mode === "forgot" && forgotMsg && (
                                    <motion.div
                                        key={`forgot-${forgotMsg}`}
                                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.25 }}
                                        className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                                    >
                                        {forgotMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">
                                {mode === "login" ? (
                                    <motion.form
                                        key="login-form"
                                        initial={{ opacity: 0, x: -14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 14 }}
                                        transition={{ duration: 0.28, ease: "easeOut" }}
                                        onSubmit={handleSubmit}
                                        className="space-y-5"
                                    >
                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.28}
                                            className="space-y-1.5"
                                        >
                                            <label className="block text-sm font-semibold text-slate-800">
                                                Usuario
                                            </label>

                                            <motion.div
                                                whileTap={{ scale: 0.998 }}
                                                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100"
                                            >
                                                <motion.div
                                                    animate={{ rotate: [0, -4, 0] }}
                                                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                                                >
                                                    <Mail className="h-5 w-5 text-slate-400 transition group-focus-within:text-cyan-500" />
                                                </motion.div>

                                                <input
                                                    type="text"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="usuario"
                                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                                />
                                            </motion.div>
                                        </motion.div>

                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.34}
                                            className="space-y-1.5"
                                        >
                                            <label className="block text-sm font-semibold text-slate-800">
                                                Contraseña
                                            </label>

                                            <motion.div
                                                whileTap={{ scale: 0.998 }}
                                                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100"
                                            >
                                                <motion.div
                                                    animate={{ rotate: [0, 4, 0] }}
                                                    transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.8 }}
                                                >
                                                    <Lock className="h-5 w-5 text-slate-400 transition group-focus-within:text-cyan-500" />
                                                </motion.div>

                                                <input
                                                    type={showPass ? "text" : "password"}
                                                    required
                                                    value={pass}
                                                    onChange={(e) => setPass(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                                />

                                                <motion.button
                                                    whileTap={{ scale: 0.92 }}
                                                    type="button"
                                                    onClick={() => setShowPass((v) => !v)}
                                                    className="rounded-xl p-1.5 transition hover:bg-slate-100"
                                                    title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                                                >
                                                    {showPass ? (
                                                        <EyeOff className="h-4.5 w-4.5 text-slate-500" />
                                                    ) : (
                                                        <Eye className="h-4.5 w-4.5 text-slate-500" />
                                                    )}
                                                </motion.button>
                                            </motion.div>

                                            <div className="flex justify-end pt-1">
                                                <motion.button
                                                    whileHover={{ x: 2 }}
                                                    type="button"
                                                    onClick={() => {
                                                        setMode("forgot");
                                                        setError("");
                                                        setForgotMsg("");
                                                        setForgotValue(email.trim());
                                                    }}
                                                    className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 hover:underline"
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </motion.button>
                                            </div>
                                        </motion.div>

                                        <motion.button
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.4}
                                            whileHover={{ scale: 1.012, y: -1 }}
                                            whileTap={{ scale: 0.985 }}
                                            type="submit"
                                            disabled={loading}
                                            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
                                            style={{
                                                background: `linear-gradient(135deg, ${BRAND_CYAN} 0%, ${BRAND_GREEN} 100%)`,
                                                boxShadow: `0 18px 35px -18px ${BRAND_CYAN}`,
                                            }}
                                        >
                                            <motion.span
                                                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                                                animate={{ x: ["0%", "320%"] }}
                                                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <motion.div
                                                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                                                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.25 }}
                                            >
                                                <LogIn className="h-4.5 w-4.5" />
                                            </motion.div>
                                            {loading ? "Ingresando..." : "Acceder al panel"}
                                        </motion.button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="forgot-form"
                                        initial={{ opacity: 0, x: 14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -14 }}
                                        transition={{ duration: 0.28, ease: "easeOut" }}
                                        onSubmit={handleForgot}
                                        className="space-y-5"
                                    >
                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.28}
                                            className="space-y-1.5"
                                        >
                                            <label className="block text-sm font-semibold text-slate-800">
                                                Usuario
                                            </label>

                                            <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100">
                                                <motion.div
                                                    animate={{ rotate: [0, -4, 0] }}
                                                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                                                >
                                                    <Mail className="h-5 w-5 text-slate-400 transition group-focus-within:text-cyan-500" />
                                                </motion.div>

                                                <input
                                                    type="text"
                                                    required
                                                    value={forgotValue}
                                                    onChange={(e) => setForgotValue(e.target.value)}
                                                    placeholder="usuario"
                                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                                />
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.34}
                                            className="rounded-[26px] border border-amber-100 bg-amber-50 p-4"
                                        >
                                            <div className="text-sm font-semibold text-amber-900">
                                                Recuperación segura
                                            </div>
                                            <div className="mt-1 text-xs leading-5 text-amber-800/80">
                                                Escribe tu usuario. Si existe, enviaremos una contraseña temporal.                                            </div>
                                        </motion.div>

                                        <motion.button
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.4}
                                            whileHover={{ scale: 1.012, y: -1 }}
                                            whileTap={{ scale: 0.985 }}
                                            type="submit"
                                            disabled={loading}
                                            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
                                            style={{
                                                background: `linear-gradient(135deg, ${BRAND_CYAN} 0%, ${BRAND_GREEN} 100%)`,
                                                boxShadow: `0 18px 35px -18px ${BRAND_CYAN}`,
                                            }}
                                        >

                                            <motion.span
                                                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                                                animate={{ x: ["0%", "320%"] }}
                                                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            {loading ? "Enviando..." : "Enviar recuperación"}
                                        </motion.button>

                                        <motion.button
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            custom={0.46}
                                            whileHover={{ x: -2 }}
                                            whileTap={{ scale: 0.985 }}
                                            type="button"
                                            onClick={() => {
                                                setMode("login");
                                                setError("");
                                                setForgotMsg("");
                                            }}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <ArrowLeft className="h-4.5 w-4.5" />
                                            Volver al login
                                        </motion.button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}