import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList } from "lucide-react";
import BodyPainMap, { getPainLabels } from "./BodyPainMap";
import { getFullName, yesNo } from "./PatientUtils";

function sortSessionsDesc(list = []) {
    return [...list].sort((a, b) => {
        const ka = `${a.fecha || ""}T${a.creado || ""}`;
        const kb = `${b.fecha || ""}T${b.creado || ""}`;
        return kb.localeCompare(ka);
    });
}

function rfcValido(rfc = "") {
    const limpio = String(rfc || "").trim().toUpperCase();
    return /^([A-Z&Ñ]{3,4})\d{6}([A-Z\d]{3})$/.test(limpio);
}

function ModalContent({ mode, patient, onClose, onSave }) {
    const isEdit = mode === "edit";

    const meta = patient?._meta || patient?.expediente || {};
    const sesiones = sortSessionsDesc(patient?._sesiones || patient?.sesiones_clinicas || []);
    const ultimaSesion = sesiones[0] || null;

    const [step, setStep] = useState(0);
    const steps = [
        { key: "basicos", label: "Datos básicos" },
        { key: "dolor", label: "Dolor corporal" },
        { key: "antecedentes", label: "Antecedentes" },
        { key: "docs", label: "Documentos" },
        { key: "confirm", label: "Confirmación" },
    ];

    const [form, setForm] = useState({
        nombre: patient ? getFullName(patient) : "",
        telefono: patient?.telefono ?? "",
        email: patient?.correo ?? "",
        nacimiento: patient?.fecha_nac ?? "",
        sexo: patient?.genero ?? "",
        ocupacion: meta?.ocupacion ?? "",
        direccion: meta?.direccion ?? "",
        molestia: patient?.molestia ?? "",
        notas: meta?.notas_generales ?? patient?.notas ?? "",
        heredoFamiliares: meta?.heredo_familiares ?? "",
        antecedentes: {
            diabetes: meta?.antecedentes?.diabetes ?? null,
            presionAlta: meta?.antecedentes?.presionAlta ?? null,
            corazon: meta?.antecedentes?.corazon ?? null,
            alergias: meta?.antecedentes?.alergias ?? null,
            asma: meta?.antecedentes?.asma ?? null,
            cirugiasPrevias: meta?.antecedentes?.cirugiasPrevias ?? null,
            fracturasAnteriores: meta?.antecedentes?.fracturasAnteriores ?? null,
            otrasEnfermedades: meta?.antecedentes?.otrasEnfermedades ?? "",
            tratamientosPrevios: meta?.antecedentes?.tratamientosPrevios ?? "",
            medicamentosActuales: meta?.antecedentes?.medicamentosActuales ?? "",
        },
        habitos: {
            fumo: meta?.habitos?.fumo ?? null,
            tomoAlcohol: meta?.habitos?.tomoAlcohol ?? null,
            otrasSustancias: meta?.habitos?.otrasSustancias ?? null,
            hagoEjercicio: meta?.habitos?.hagoEjercicio ?? null,
        },
        docs: {
            evaluacion: meta?.documentos?.evaluacion ?? false,
            consentimiento: meta?.documentos?.consentimiento ?? false,
            privacidad: meta?.documentos?.privacidad ?? false,
        },
        pain: Array.isArray(ultimaSesion?.zonas_dolor) ? ultimaSesion.zonas_dolor : [],
        dolorResumen: ultimaSesion?.motivo_consulta ?? patient?.molestia ?? "",
        estado_tratamiento: patient?.estado_tratamiento ?? "en_tratamiento",
        fecha_alta: patient?.fecha_alta ?? "",

        requiere_factura: patient?.requiere_factura ?? false,
        factura_razon_social: patient?.facturacion_razon_social ?? "",
        factura_rfc: patient?.facturacion_rfc ?? "",
        factura_regimen_fiscal: patient?.facturacion_regimen_fiscal ?? "",
        factura_codigo_postal: patient?.facturacion_codigo_postal ?? "",
        factura_uso_cfdi: patient?.facturacion_uso_cfdi ?? "",
        factura_correo: patient?.facturacion_correo ?? "",
    });

    const canGoNext = useMemo(() => {
        if (step === 0) {
            if (String(form.nombre || "").trim().length < 3) return false;

            if (form.requiere_factura) {
                if (!String(form.factura_razon_social || "").trim()) return false;
                if (!rfcValido(form.factura_rfc)) return false;
                if (!String(form.factura_regimen_fiscal || "").trim()) return false;
                if (!String(form.factura_codigo_postal || "").trim()) return false;
                if (!String(form.factura_uso_cfdi || "").trim()) return false;
                if (!String(form.factura_correo || "").trim()) return false;
            }
        }

        if (step === 3) return form.docs.consentimiento && form.docs.privacidad;
        return true;
    }, [step, form]);

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function updateAntecedente(key, value) {
        setForm((prev) => ({
            ...prev,
            antecedentes: { ...(prev.antecedentes || {}), [key]: value },
        }));
    }

    function updateHabito(key, value) {
        setForm((prev) => ({
            ...prev,
            habitos: { ...(prev.habitos || {}), [key]: value },
        }));
    }

    function updateDoc(key, value) {
        setForm((prev) => ({
            ...prev,
            docs: { ...(prev.docs || {}), [key]: value },
        }));
    }

    function next() {
        if (!canGoNext) return;
        setStep((s) => Math.min(s + 1, steps.length - 1));
    }

    function back() {
        setStep((s) => Math.max(s - 1, 0));
    }

    async function handleSubmit(e) {
        e?.preventDefault?.();
        await onSave(form);
    }

    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/55 p-2 sm:p-4">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 flex max-h-[96dvh] w-full max-w-[98vw] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl sm:max-w-6xl 2xl:max-w-7xl">
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Wizard clínico
                            </div>

                            <h2 className="mt-3 text-lg font-black text-slate-900 sm:text-xl">
                                {isEdit ? "Editar paciente" : "Registrar paciente"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Captura expediente, dolor corporal, antecedentes y datos fiscales si el paciente necesita factura.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:w-auto"
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {steps.map((s, idx) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setStep(idx)}
                                className={[
                                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                                    idx === step
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                ].join(" ")}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
                    {step === 0 && <StepDatosBasicos form={form} updateField={updateField} />}
                    {step === 1 && <StepDolorCorporal form={form} updateField={updateField} />}
                    {step === 2 && (
                        <StepAntecedentes
                            form={form}
                            updateAntecedente={updateAntecedente}
                            updateHabito={updateHabito}
                            updateField={updateField}
                        />
                    )}
                    {step === 3 && <StepDocumentos form={form} updateDoc={updateDoc} />}
                    {step === 4 && <StepConfirmacion form={form} />}

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                        >
                            Cancelar
                        </button>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                            {step > 0 && (
                                <button
                                    type="button"
                                    onClick={back}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                                >
                                    Volver
                                </button>
                            )}

                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={next}
                                    disabled={!canGoNext}
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    Siguiente
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
                                >
                                    {isEdit ? "Guardar cambios" : "Registrar paciente"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PatientFormModal(props) {
    return createPortal(<ModalContent {...props} />, document.body);
}

function StepDatosBasicos({ form, updateField }) {
    return (
        <div className="space-y-5">
            <SectionBox
                title="Ficha de identificación"
                subtitle="Datos básicos del paciente para abrir su expediente."
            >
                <div className="grid grid-cols-1 gap-4">
                    <Field label="Nombre completo" required>
                        <input
                            className={inputClass()}
                            value={form.nombre}
                            onChange={(e) => updateField("nombre", e.target.value)}
                            placeholder="Ej. María Fernanda López"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Teléfono">
                            <input
                                className={inputClass()}
                                value={form.telefono}
                                onChange={(e) => updateField("telefono", e.target.value)}
                                placeholder="Ej. 2721234567"
                            />
                        </Field>

                        <Field label="Correo">
                            <input
                                type="email"
                                className={inputClass()}
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                placeholder="Ej. paciente@email.com"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Fecha de nacimiento">
                            <input
                                type="date"
                                className={inputClass()}
                                value={form.nacimiento}
                                onChange={(e) => updateField("nacimiento", e.target.value)}
                            />
                        </Field>

                        <Field label="Sexo">
                            <select
                                className={inputClass()}
                                value={form.sexo}
                                onChange={(e) => updateField("sexo", e.target.value)}
                            >
                                <option value="">Selecciona…</option>
                                <option value="femenino">Femenino</option>
                                <option value="masculino">Masculino</option>
                                <option value="otro">Otro</option>
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Ocupación / trabajo">
                            <input
                                className={inputClass()}
                                value={form.ocupacion}
                                onChange={(e) => updateField("ocupacion", e.target.value)}
                                placeholder="Ej. Empleado, estudiante, comerciante"
                            />
                        </Field>

                        <Field label="Estado del tratamiento">
                            <select
                                className={inputClass()}
                                value={form.estado_tratamiento}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    updateField("estado_tratamiento", v);
                                    if (v !== "alta") updateField("fecha_alta", "");
                                }}
                            >
                                <option value="en_tratamiento">En tratamiento</option>
                                <option value="alta">Dado de alta</option>
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Fecha de alta">
                            <input
                                type="date"
                                className={inputClass()}
                                value={form.fecha_alta}
                                onChange={(e) => updateField("fecha_alta", e.target.value)}
                                disabled={form.estado_tratamiento !== "alta"}
                            />
                        </Field>

                        <Field label="Molestia principal">
                            <input
                                className={inputClass()}
                                value={form.molestia}
                                onChange={(e) => updateField("molestia", e.target.value)}
                                placeholder="Ej. Dolor lumbar, hombro, rodilla..."
                            />
                        </Field>
                    </div>

                    <Field label="Dirección completa">
                        <textarea
                            rows={2}
                            className={textareaClass()}
                            value={form.direccion}
                            onChange={(e) => updateField("direccion", e.target.value)}
                            placeholder="Calle, número, colonia, ciudad..."
                        />
                    </Field>

                    <Field label="Notas clínicas (resumen)">
                        <textarea
                            rows={3}
                            className={textareaClass()}
                            value={form.notas}
                            onChange={(e) => updateField("notas", e.target.value)}
                            placeholder="Observaciones generales, contexto de la consulta, etc."
                        />
                    </Field>

                    <SectionBox
                        title="Facturación"
                        subtitle="Si el paciente requiere factura, captura los datos fiscales para CFDI en México."
                    >
                        <div className="grid grid-cols-1 gap-4">
                            <Field label="¿Necesita factura?">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateField("requiere_factura", true)}
                                        className={[
                                            "rounded-2xl border px-4 py-3 text-sm font-semibold",
                                            form.requiere_factura
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                        ].join(" ")}
                                    >
                                        Sí
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateField("requiere_factura", false)}
                                        className={[
                                            "rounded-2xl border px-4 py-3 text-sm font-semibold",
                                            !form.requiere_factura
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                        ].join(" ")}
                                    >
                                        No
                                    </button>
                                </div>
                            </Field>

                            {form.requiere_factura ? (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <Field label="Razón social / nombre fiscal" required>
                                        <input
                                            className={inputClass()}
                                            value={form.factura_razon_social}
                                            onChange={(e) => updateField("factura_razon_social", e.target.value)}
                                        />
                                    </Field>

                                    <Field label="RFC" required>
                                        <input
                                            className={inputClass()}
                                            value={form.factura_rfc}
                                            onChange={(e) => updateField("factura_rfc", e.target.value.toUpperCase())}
                                            placeholder="Ej. XAXX010101000"
                                        />
                                        {!rfcValido(form.factura_rfc) && String(form.factura_rfc || "").trim() ? (
                                            <div className="mt-1 text-xs font-semibold text-rose-600">
                                                RFC con formato inválido.
                                            </div>
                                        ) : null}
                                    </Field>

                                    <Field label="Régimen fiscal" required>
                                        <input
                                            className={inputClass()}
                                            value={form.factura_regimen_fiscal}
                                            onChange={(e) => updateField("factura_regimen_fiscal", e.target.value)}
                                            placeholder="Ej. 612, 601, 626..."
                                        />
                                    </Field>

                                    <Field label="Código postal fiscal" required>
                                        <input
                                            className={inputClass()}
                                            value={form.factura_codigo_postal}
                                            onChange={(e) => updateField("factura_codigo_postal", e.target.value)}
                                        />
                                    </Field>

                                    <Field label="Uso CFDI" required>
                                        <input
                                            className={inputClass()}
                                            value={form.factura_uso_cfdi}
                                            onChange={(e) => updateField("factura_uso_cfdi", e.target.value)}
                                            placeholder="Ej. G03"
                                        />
                                    </Field>

                                    <Field label="Correo de facturación" required>
                                        <input
                                            type="email"
                                            className={inputClass()}
                                            value={form.factura_correo}
                                            onChange={(e) => updateField("factura_correo", e.target.value)}
                                        />
                                    </Field>
                                </div>
                            ) : null}
                        </div>
                    </SectionBox>
                </div>
            </SectionBox>
        </div>
    );
}

function StepDolorCorporal({ form, updateField }) {
    const labels = getPainLabels(Array.isArray(form.pain) ? form.pain : []);

    return (
        <div className="space-y-5">
            <SectionBox
                title="Ubicación del dolor / molestia"
                subtitle="El paciente puede marcar la zona exacta del cuerpo donde presenta dolor."
            >
                <BodyPainMap value={form.pain || []} onChange={(next) => updateField("pain", next)} />

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Field label="Resumen del dolor / motivo de consulta">
                        <textarea
                            rows={4}
                            className={textareaClass()}
                            value={form.dolorResumen}
                            onChange={(e) => updateField("dolorResumen", e.target.value)}
                            placeholder="Ej. Dolor lumbar de 2 semanas, aumenta al estar sentado, irradiación a pierna derecha..."
                        />
                    </Field>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-900">Zonas marcadas</div>
                        <div className="mt-2 text-xs text-slate-500">
                            Se guardarán como nombres legibles dentro de la sesión clínica inicial.
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {labels.length === 0 ? (
                                <span className="text-sm text-slate-500">Aún no hay zonas marcadas.</span>
                            ) : (
                                labels.map((label, i) => (
                                    <span
                                        key={`${label}-${i}`}
                                        className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                                    >
                                        {label}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </SectionBox>
        </div>
    );
}

function StepAntecedentes({ form, updateAntecedente, updateHabito, updateField }) {
    const A = form.antecedentes || {};
    const H = form.habitos || {};

    return (
        <div className="space-y-5">
            <SectionBox
                title="Antecedentes conforme a NOM-004"
                subtitle="Captura antecedentes heredo-familiares, patológicos y no patológicos."
            >
                <div className="space-y-4">
                    <Field label="Antecedentes heredo-familiares" required>
                        <textarea
                            className={textareaClass()}
                            value={form.heredoFamiliares || ""}
                            onChange={(e) => updateField("heredoFamiliares", e.target.value)}
                            placeholder="Ej. Padre diabético, madre hipertensa, antecedentes de cáncer..."
                            rows={3}
                        />
                    </Field>

                    <div className="text-sm font-black text-slate-900">Antecedentes personales patológicos</div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <YesNo label="Diabetes" value={A.diabetes} onChange={(v) => updateAntecedente("diabetes", v)} />
                        <YesNo label="Presión alta" value={A.presionAlta} onChange={(v) => updateAntecedente("presionAlta", v)} />
                        <YesNo label="Problemas del corazón" value={A.corazon} onChange={(v) => updateAntecedente("corazon", v)} />
                        <YesNo label="Alergias" value={A.alergias} onChange={(v) => updateAntecedente("alergias", v)} />
                        <YesNo label="Asma" value={A.asma} onChange={(v) => updateAntecedente("asma", v)} />
                        <YesNo label="Cirugías previas" value={A.cirugiasPrevias} onChange={(v) => updateAntecedente("cirugiasPrevias", v)} />
                        <YesNo label="Fracturas anteriores" value={A.fracturasAnteriores} onChange={(v) => updateAntecedente("fracturasAnteriores", v)} />
                    </div>

                    <Field label="Otras enfermedades">
                        <textarea
                            className={textareaClass()}
                            value={A.otrasEnfermedades || ""}
                            onChange={(e) => updateAntecedente("otrasEnfermedades", e.target.value)}
                            rows={2}
                        />
                    </Field>

                    <Field label="Tratamientos previos">
                        <textarea
                            className={textareaClass()}
                            value={A.tratamientosPrevios || ""}
                            onChange={(e) => updateAntecedente("tratamientosPrevios", e.target.value)}
                            rows={2}
                        />
                    </Field>

                    <Field label="Medicamentos actuales">
                        <textarea
                            className={textareaClass()}
                            value={A.medicamentosActuales || ""}
                            onChange={(e) => updateAntecedente("medicamentosActuales", e.target.value)}
                            rows={2}
                        />
                    </Field>

                    <div className="text-sm font-black text-slate-900">Hábitos y estilo de vida</div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <YesNo label="Fumo" value={H.fumo} onChange={(v) => updateHabito("fumo", v)} />
                        <YesNo label="Tomo alcohol" value={H.tomoAlcohol} onChange={(v) => updateHabito("tomoAlcohol", v)} />
                        <YesNo label="Otras sustancias" value={H.otrasSustancias} onChange={(v) => updateHabito("otrasSustancias", v)} />
                        <YesNo label="Hago ejercicio regularmente" value={H.hagoEjercicio} onChange={(v) => updateHabito("hagoEjercicio", v)} />
                    </div>
                </div>
            </SectionBox>
        </div>
    );
}

function StepDocumentos({ form, updateDoc }) {
    const d = form.docs || {};

    return (
        <div className="space-y-5">
            <SectionBox
                title="Documentos y consentimientos"
                subtitle="Confirma que se revisaron o aceptaron los documentos clave del expediente."
            >
                <div className="space-y-3">
                    <DocCheck
                        title="Evaluación médica y/o terapéutica"
                        desc="Ficha interna de evaluación del paciente."
                        checked={d.evaluacion}
                        onChange={(v) => updateDoc("evaluacion", v)}
                    />

                    <DocCheck
                        title="Consentimiento informado"
                        desc="Autorización para valoración y tratamiento."
                        checked={d.consentimiento}
                        onChange={(v) => updateDoc("consentimiento", v)}
                    />

                    <DocCheck
                        title="Aviso de privacidad"
                        desc="Uso y resguardo de datos personales."
                        checked={d.privacidad}
                        onChange={(v) => updateDoc("privacidad", v)}
                    />
                </div>
            </SectionBox>
        </div>
    );
}

function StepConfirmacion({ form }) {
    const A = form.antecedentes || {};
    const H = form.habitos || {};
    const d = form.docs || {};
    const painLabels = getPainLabels(Array.isArray(form.pain) ? form.pain : []);

    return (
        <div className="space-y-5">
            <SectionBox
                title="Confirmación final"
                subtitle="Revisa el resumen antes de guardar el expediente del paciente."
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <SummaryItem label="Nombre" value={form.nombre || "—"} />
                        <SummaryItem label="Teléfono" value={form.telefono || "—"} />
                        <SummaryItem label="Correo" value={form.email || "—"} />
                        <SummaryItem label="Nacimiento" value={form.nacimiento || "—"} />
                        <SummaryItem label="Sexo" value={form.sexo || "—"} />
                        <SummaryItem label="Ocupación" value={form.ocupacion || "—"} />
                    </div>

                    <SummaryBlock title="Dirección" value={form.direccion || "—"} />
                    <SummaryBlock title="Molestia principal" value={form.molestia || form.dolorResumen || "—"} />
                    <SummaryBlock title="Antecedentes heredo-familiares" value={form.heredoFamiliares || "—"} />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryItem label="Diabetes" value={yesNo(A.diabetes)} />
                        <SummaryItem label="Presión alta" value={yesNo(A.presionAlta)} />
                        <SummaryItem label="Corazón" value={yesNo(A.corazon)} />
                        <SummaryItem label="Alergias" value={yesNo(A.alergias)} />
                        <SummaryItem label="Asma" value={yesNo(A.asma)} />
                        <SummaryItem label="Cirugías previas" value={yesNo(A.cirugiasPrevias)} />
                        <SummaryItem label="Fracturas anteriores" value={yesNo(A.fracturasAnteriores)} />
                        <SummaryItem label="Ejercicio regular" value={yesNo(H.hagoEjercicio)} />
                    </div>

                    <SummaryBlock title="Otras enfermedades" value={A.otrasEnfermedades || "—"} />
                    <SummaryBlock title="Tratamientos previos" value={A.tratamientosPrevios || "—"} />
                    <SummaryBlock title="Medicamentos actuales" value={A.medicamentosActuales || "—"} />
                    <SummaryBlock title="Notas clínicas" value={form.notas || "—"} />

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-black text-slate-900">Zonas de dolor</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {painLabels.length === 0 ? (
                                <span className="text-sm text-slate-500">Sin zonas seleccionadas.</span>
                            ) : (
                                painLabels.map((label, i) => (
                                    <span
                                        key={`${label}-${i}`}
                                        className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                                    >
                                        {label}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <SummaryItem label="Evaluación" value={d.evaluacion ? "Aceptado" : "Pendiente"} />
                        <SummaryItem label="Consentimiento" value={d.consentimiento ? "Aceptado" : "Pendiente"} />
                        <SummaryItem label="Privacidad" value={d.privacidad ? "Aceptado" : "Pendiente"} />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-900">Facturación</div>
                        <div className="mt-2 text-sm text-slate-700">
                            {form.requiere_factura ? "El paciente sí requiere factura." : "El paciente no requiere factura."}
                        </div>

                        {form.requiere_factura ? (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <SummaryItem label="Razón social" value={form.factura_razon_social || "—"} />
                                <SummaryItem label="RFC" value={form.factura_rfc || "—"} />
                                <SummaryItem label="Régimen fiscal" value={form.factura_regimen_fiscal || "—"} />
                                <SummaryItem label="Código postal fiscal" value={form.factura_codigo_postal || "—"} />
                                <SummaryItem label="Uso CFDI" value={form.factura_uso_cfdi || "—"} />
                                <SummaryItem label="Correo de facturación" value={form.factura_correo || "—"} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </SectionBox>
        </div>
    );
}

function SectionBox({ title, subtitle, children }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
                <div className="text-lg font-black text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>
            <div className="mt-5">{children}</div>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <label className="block">
            <div className="mb-1.5 text-sm font-semibold text-slate-900">
                {label} {required ? <span className="text-rose-500">*</span> : null}
            </div>
            {children}
        </label>
    );
}

function YesNo({ label, value, onChange }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">{label}</div>

            <div className="mt-3 flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={[
                        "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition",
                        value === true
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                >
                    Sí
                </button>

                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={[
                        "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition",
                        value === false
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                >
                    No
                </button>
            </div>

            <div className="mt-2 text-xs text-slate-500">
                Estado: <span className="font-semibold text-slate-700">{yesNo(value)}</span>
            </div>
        </div>
    );
}

function DocCheck({ title, desc, checked, onChange }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={!!checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div>
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <div className="text-sm text-slate-500">{desc}</div>
                </div>
            </div>
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 break-words whitespace-pre-wrap text-sm font-semibold text-slate-900">
                {value}
            </div>
        </div>
    );
}

function SummaryBlock({ title, value }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-900">{title}</div>
            <div className="mt-2 break-words whitespace-pre-wrap text-sm text-slate-700">{value}</div>
        </div>
    );
}

function inputClass() {
    return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300";
}

function textareaClass() {
    return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300";
}