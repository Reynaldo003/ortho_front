//src/components/layout/patient/PatientView.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  UserRound,
  CalendarDays,
  ShieldCheck,
  ClipboardList,
  Activity,
  FileText,
  ImageIcon,
} from "lucide-react";

import PatientProfileModal from "./PatientProfileModal";
import PatientFormModal from "./PatientFormModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { getPainLabels } from "./BodyPainMap";

import {
  PATIENTS_SIDEBAR_STORAGE_KEY,
  getFullName,
  splitFullName,
  getProfessionalLabel,
  formatDateMX,
  readPatientsSidebarFilters,
  initialsFromPatient,
  calcEdad,
  estadoTratamientoLabel,
} from "./PatientUtils";

const API_BASE = "https://ortho-clinic-cordoba.cloud";

async function openProtectedBinary(url, { filename = "documento.pdf", download = false } = {}) {
  const token = localStorage.getItem("auth.access");
  if (!token) {
    localStorage.removeItem("auth.access");
    localStorage.removeItem("auth.refresh");
    localStorage.removeItem("auth.user");
    window.location.href = "/login";
    return;
  }

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (resp.status === 401) {
    localStorage.removeItem("auth.access");
    localStorage.removeItem("auth.refresh");
    localStorage.removeItem("auth.user");
    window.location.href = "/login";
    return;
  }

  if (!resp.ok) {
    let detail = "No se pudo abrir el archivo.";
    try {
      const data = await resp.json();
      detail = data?.detail || detail;
    } catch { }
    throw new Error(detail);
  }

  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);

  if (download) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function getEvidenceFileUrl(item) {
  return item?.archivo_url || item?.archivo || "";
}

function normalizeExpediente(expediente) {
  const e = expediente || {};
  return {
    ocupacion: e.ocupacion || "",
    direccion: e.direccion || "",
    heredo_familiares: e.heredo_familiares || "",
    antecedentes: e.antecedentes || {},
    habitos: e.habitos || {},
    documentos: e.documentos || {},
    notas_generales: e.notas_generales || "",
  };
}

function sortSessionsDesc(list = []) {
  return [...list].sort((a, b) => {
    const ka = `${a.fecha || ""}T${a.creado || ""}`;
    const kb = `${b.fecha || ""}T${b.creado || ""}`;
    return kb.localeCompare(ka);
  });
}

function enhancePatient(rawPatient, citasList = []) {
  const cp = citasList.filter((c) => Number(c.paciente) === Number(rawPatient.id));
  const expediente = normalizeExpediente(rawPatient.expediente);
  const sesiones = sortSessionsDesc(rawPatient.sesiones_clinicas || []);

  let lastCita = null;
  const servicesSet = new Set();
  const professionalsSet = new Set();

  cp.forEach((c) => {
    if (c.servicio_nombre) servicesSet.add(c.servicio_nombre);
    if (c.profesional) professionalsSet.add(c.profesional);

    const key = `${c.fecha || ""}T${c.hora_inicio || ""}`;
    if (!lastCita) {
      lastCita = { ...c, _key: key };
    } else if (key > lastCita._key) {
      lastCita = { ...c, _key: key };
    }
  });

  const hasReservations = cp.length > 0;
  const lastServiceName = lastCita?.servicio_nombre || "";

  return {
    ...rawPatient,
    fullName: getFullName(rawPatient),
    fullNameDisplay: getFullName(rawPatient),
    lastServiceName,
    servicesSet,
    professionalsSet,
    hasReservations,
    branchLabel: "Fisionerv Centro",
    _citas: cp,
    _meta: expediente,
    _visibleNotes: rawPatient.notas || "",
    _sesiones: sesiones,
    _ultimaSesion: sesiones[0] || null,
  };
}


function getEmptyContenidoNom004(tipo = "evolucion") {
  const base = {
    historia_clinica: {
      ficha_identificacion: "",
      grupo_etnico: "",
      antecedentes_heredo_familiares: "",
      antecedentes_personales_patologicos: "",
      antecedentes_personales_no_patologicos: "",
      consumo_sustancias_psicoactivas: "",
      padecimiento_actual: "",
      interrogatorio_aparatos_sistemas: "",
      habitus_exterior: "",
      signos_vitales: "",
      peso_talla: "",
      exploracion_fisica: "",
      resultados_estudios: "",
      diagnosticos_problemas: "",
      pronostico: "",
      indicacion_terapeutica: "",
    },
    evolucion: {
      evolucion_cuadro_clinico: "",
      signos_vitales: "",
      resultados_relevantes: "",
      diagnosticos_problemas: "",
      pronostico: "",
      tratamiento_indicaciones: "",
    },
    interconsulta: {
      criterios_diagnosticos: "",
      plan_estudios: "",
      sugerencias_diagnosticas_tratamiento: "",
      notas_complementarias: "",
    },
    referencia_traslado: {
      establecimiento_envia: "",
      establecimiento_receptor: "",
      motivo_envio: "",
      impresion_diagnostica: "",
      terapeutica_empleada: "",
      resumen_clinico: "",
    },
  };

  return { ...(base[tipo] || base.evolucion) };
}

function getLegacySoapFromNom004(tipo, contenido = {}) {
  if (tipo === "historia_clinica") {
    return {
      subjetivo: [
        contenido.ficha_identificacion,
        contenido.grupo_etnico && `Grupo étnico: ${contenido.grupo_etnico}`,
        contenido.antecedentes_heredo_familiares,
        contenido.antecedentes_personales_patologicos,
        contenido.antecedentes_personales_no_patologicos,
        contenido.consumo_sustancias_psicoactivas,
        contenido.padecimiento_actual,
        contenido.interrogatorio_aparatos_sistemas,
      ].filter(Boolean).join("\n\n"),
      objetivo: [
        contenido.habitus_exterior,
        contenido.signos_vitales,
        contenido.peso_talla,
        contenido.exploracion_fisica,
        contenido.resultados_estudios,
      ].filter(Boolean).join("\n\n"),
      analisis: contenido.diagnosticos_problemas || "",
      plan: contenido.indicacion_terapeutica || "",
      observaciones: contenido.pronostico || "",
    };
  }

  if (tipo === "interconsulta") {
    return {
      subjetivo: contenido.criterios_diagnosticos || "",
      objetivo: contenido.plan_estudios || "",
      analisis: contenido.sugerencias_diagnosticas_tratamiento || "",
      plan: contenido.notas_complementarias || "",
      observaciones: "",
    };
  }

  if (tipo === "referencia_traslado") {
    return {
      subjetivo: [contenido.motivo_envio, contenido.impresion_diagnostica].filter(Boolean).join("\n\n"),
      objetivo: contenido.terapeutica_empleada || "",
      analisis: contenido.resumen_clinico || "",
      plan: [contenido.establecimiento_envia, contenido.establecimiento_receptor].filter(Boolean).join("\n\n"),
      observaciones: "",
    };
  }

  return {
    subjetivo: contenido.evolucion_cuadro_clinico || "",
    objetivo: [contenido.signos_vitales, contenido.resultados_relevantes].filter(Boolean).join("\n\n"),
    analisis: contenido.diagnosticos_problemas || "",
    plan: contenido.tratamiento_indicaciones || "",
    observaciones: contenido.pronostico || "",
  };
}

export function PatientsView({ onPrivacyLockChange }) {
  const [patients, setPatients] = useState([]);
  const [citas, setCitas] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [noteModal, setNoteModal] = useState({ open: false, payload: null, data: null });
  const [rxModal, setRxModal] = useState({ open: false, payload: null, data: null });
  const [evidenceModal, setEvidenceModal] = useState({ open: false, payload: null, items: [] });

  const [defaultClinicId, setDefaultClinicId] = useState(1);

  const sidebarDefaults = readPatientsSidebarFilters();
  const [search, setSearch] = useState(sidebarDefaults.search || "");
  const [filterBranch, setFilterBranch] = useState(sidebarDefaults.filterBranch || "Todos");
  const [filterProfessional, setFilterProfessional] = useState(sidebarDefaults.filterProfessional || "Todos");
  const [filterService, setFilterService] = useState(sidebarDefaults.filterService || "Todos");
  const [filterStatus, setFilterStatus] = useState(sidebarDefaults.filterStatus || "Todos");
  const [filterStartDate, setFilterStartDate] = useState(sidebarDefaults.filterStartDate || "");
  const [filterEndDate, setFilterEndDate] = useState(sidebarDefaults.filterEndDate || "");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formInitialStepKey, setFormInitialStepKey] = useState("basicos");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const logoutAndRedirect = () => {
    localStorage.removeItem("auth.access");
    localStorage.removeItem("auth.refresh");
    localStorage.removeItem("auth.user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const locked =
      formOpen ||
      profileOpen ||
      noteModal.open ||
      rxModal.open ||
      evidenceModal.open;

    onPrivacyLockChange?.(locked);
    return () => onPrivacyLockChange?.(false);
  }, [
    formOpen,
    profileOpen,
    noteModal.open,
    rxModal.open,
    evidenceModal.open,
    onPrivacyLockChange,
  ]);

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem("auth.access");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setLoading(true);

      const [patientsResp, citasResp, profsResp] = await Promise.all([
        fetch(`${API_BASE}/api/pacientes/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/api/citas/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/api/profesionales/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (
        patientsResp.status === 401 ||
        citasResp.status === 401 ||
        profsResp.status === 401
      ) {
        logoutAndRedirect();
        return;
      }

      const patientsData = await patientsResp.json();
      const citasData = await citasResp.json();
      const profsData = await profsResp.json();

      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setCitas(Array.isArray(citasData) ? citasData : []);
      setProfessionals(Array.isArray(profsData) ? profsData : []);

      if (patientsData?.length && patientsData[0].clinica) {
        setDefaultClinicId(patientsData[0].clinica);
      }
    } catch (err) {
      console.error("Error cargando pacientes/citas/profesionales:", err);
      setPatients([]);
      setCitas([]);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    function handleSidebarFilters(e) {
      const next = e?.detail || readPatientsSidebarFilters();
      setSearch(next.search || "");
      setFilterBranch(next.filterBranch || "Todos");
      setFilterProfessional(next.filterProfessional || "Todos");
      setFilterService(next.filterService || "Todos");
      setFilterStatus(next.filterStatus || "Todos");
      setFilterStartDate(next.filterStartDate || "");
      setFilterEndDate(next.filterEndDate || "");
    }

    const initial = readPatientsSidebarFilters();
    window.dispatchEvent(
      new CustomEvent("patients:filters:sync", { detail: initial })
    );
    window.addEventListener("patients:filters:change", handleSidebarFilters);

    return () => {
      window.removeEventListener("patients:filters:change", handleSidebarFilters);
    };
  }, []);

  const enhancedPatients = useMemo(() => {
    return patients.map((p) => enhancePatient(p, citas));
  }, [patients, citas]);

  useEffect(() => {
    if (!selectedPatient?.id) return;

    const fresh = enhancedPatients.find((p) => Number(p.id) === Number(selectedPatient.id));
    if (fresh && fresh !== selectedPatient) {
      setSelectedPatient(fresh);
    }
  }, [enhancedPatients, selectedPatient]);

  const servicesForFilter = useMemo(() => {
    const set = new Set();
    enhancedPatients.forEach((p) => p.servicesSet?.forEach((s) => s && set.add(s)));
    return Array.from(set).sort();
  }, [enhancedPatients]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("patients:sidebar:data", {
        detail: {
          professionals: professionals.map((p) => ({
            id: p.id,
            label: getProfessionalLabel(p),
          })),
          services: servicesForFilter,
          total: enhancedPatients.length,
          withAppointments: enhancedPatients.filter((p) => p.hasReservations).length,
          withoutAppointments: enhancedPatients.filter((p) => !p.hasReservations).length,
        },
      })
    );
  }, [professionals, servicesForFilter, enhancedPatients]);

  const stats = useMemo(() => {
    const total = enhancedPatients.length;
    const enTratamiento = enhancedPatients.filter((p) => p.estado_tratamiento !== "alta").length;
    const alta = enhancedPatients.filter((p) => p.estado_tratamiento === "alta").length;
    const conCitas = enhancedPatients.filter((p) => p.hasReservations).length;
    return { total, enTratamiento, alta, conCitas };
  }, [enhancedPatients]);

  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase();
    const profId = filterProfessional === "Todos" ? null : Number(filterProfessional);
    const serviceName = filterService === "Todos" ? null : filterService;
    const status = filterStatus;

    return enhancedPatients
      .filter((p) => {
        if (term) {
          const hayCoincidencia =
            p.fullName.toLowerCase().includes(term) ||
            (p.correo || "").toLowerCase().includes(term) ||
            (p.telefono || "").toLowerCase().includes(term);

          if (!hayCoincidencia) return false;
        }

        if (filterBranch !== "Todos" && p.branchLabel !== filterBranch) return false;
        if (profId && !p.professionalsSet.has(profId)) return false;
        if (serviceName && !p.servicesSet.has(serviceName)) return false;

        if (status === "Con reservas" && !p.hasReservations) return false;
        if (status === "Sin reservas" && p.hasReservations) return false;

        if (filterStartDate && (!p.registro || p.registro < filterStartDate)) return false;
        if (filterEndDate && (!p.registro || p.registro > filterEndDate)) return false;

        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [
    enhancedPatients,
    search,
    filterBranch,
    filterProfessional,
    filterService,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setFormInitialStepKey("basicos");
    setSelectedPatient(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setFormMode("edit");
    setFormInitialStepKey("basicos");
    setSelectedPatient(patient);
    setFormOpen(true);
  };

  const handleOpenHistory = (patient) => {
    setFormMode("edit");
    setFormInitialStepKey("historial");
    setSelectedPatient(patient);
    setFormOpen(true);
  };

  const handleOpenProfile = (patient) => {
    setSelectedPatient(patient);
    setProfileOpen(true);
  };

  const handleDeletePatient = (patient) => {
    setDeleteTarget(patient);
    setDeleteOpen(true);
  };

  const confirmDeletePatient = async (patient) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    try {
      const resp = await fetch(`${API_BASE}/api/pacientes/${patient.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) return logoutAndRedirect();

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        console.error("Error al eliminar paciente:", data || resp.status);
        return;
      }

      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setProfileOpen(false);
      setSelectedPatient(null);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error("Error al eliminar paciente:", e);
    }
  };

  async function fetchJsonAuth(url, options = {}) {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    const resp = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.status === 401) {
      logoutAndRedirect();
      return null;
    }

    const data = await resp.json().catch(() => null);
    if (!resp.ok) throw new Error(data?.detail || "Error en request");
    return data;
  }

  async function getSessionByCita(citaId) {
    if (!citaId) return null;
    const data = await fetchJsonAuth(`${API_BASE}/api/sesiones-clinicas/?cita=${citaId}`);
    if (Array.isArray(data) && data.length) return data[0];
    return null;
  }

  async function ensureSessionForCita({ cita, patientId, form }) {
    const token = localStorage.getItem("auth.access");
    if (!token) return null;

    const fechaBase = form.fecha || cita?.fecha || new Date().toISOString().slice(0, 10);
    const diagnosticoResumen =
      form.diagnostico_resumen ||
      form.diagnostico ||
      form?.contenido_nom004?.diagnosticos_problemas ||
      form?.contenido_nom004?.impresion_diagnostica ||
      "";
    const recomendacionesResumen =
      form.recomendaciones_resumen ||
      form?.contenido_nom004?.indicacion_terapeutica ||
      form?.contenido_nom004?.tratamiento_indicaciones ||
      form?.contenido_nom004?.terapeutica_empleada ||
      "";
    const exploracionResumen =
      form.exploracion_resumen ||
      form?.contenido_nom004?.exploracion_fisica ||
      "";

    const payloadBase = {
      paciente: patientId,
      cita: cita?.id || form.cita || null,
      fecha: fechaBase,
      motivo_consulta: form.motivo_consulta || "",
      zonas_dolor: Array.isArray(form.zonas_dolor) ? form.zonas_dolor : [],
      exploracion: exploracionResumen,
      diagnostico: diagnosticoResumen,
      recomendaciones: recomendacionesResumen,
    };

    if (form.sesion_clinica) {
      const resp = await fetch(`${API_BASE}/api/sesiones-clinicas/${form.sesion_clinica}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBase),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        console.error("Error actualizando sesión clínica:", data || resp.status);
        return null;
      }
      return data;
    }

    const resp = await fetch(`${API_BASE}/api/sesiones-clinicas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payloadBase,
        intensidad_dolor: null,
        notas: "",
        tratamiento_realizado: "",
        estado_sesion: "",
      }),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      console.error("Error creando sesión clínica ligada a la cita:", data || resp.status);
      return null;
    }
    return data;
  }

  function buildNoteFormBase({ patient, cita, linkedSession, note }) {
    const tipoNota = note?.tipo_nota || "evolucion";
    const contenido = {
      ...getEmptyContenidoNom004(tipoNota),
      ...(note?.contenido_nom004 || {}),
    };

    return {
      id: note?.id || null,
      paciente: patient.id,
      cita: cita?.id || null,
      sesion_clinica: linkedSession?.id || note?.sesion_clinica || null,
      fecha: note?.fecha || cita?.fecha || linkedSession?.fecha || new Date().toISOString().slice(0, 10),
      cita_fecha: cita?.fecha || linkedSession?.fecha || new Date().toISOString().slice(0, 10),
      tipo_nota: tipoNota,
      motivo_consulta: linkedSession?.motivo_consulta || "",
      zonas_dolor: Array.isArray(linkedSession?.zonas_dolor) ? linkedSession.zonas_dolor : [],
      contenido_nom004: contenido,
      subjetivo: note?.subjetivo || "",
      objetivo: note?.objetivo || "",
      analisis: note?.analisis || "",
      plan: note?.plan || "",
      observaciones: note?.observaciones || "",
      paciente_nombre: patient.fullNameDisplay || patient.fullName || getFullName(patient),
      paciente_fecha_nac: patient.fecha_nac || "",
      profesional_nombre: cita?.profesional_nombre || linkedSession?.profesional_nombre || "",
      profesional_cedula: note?.profesional_cedula || "",
    };
  }

  function buildPrescriptionBase({ patient, cita, session, receta, professionals }) {
    const professional = (professionals || []).find((item) => Number(item.id) === Number(cita?.profesional));
    return {
      id: receta?.id || null,
      paciente: patient.id,
      cita: cita?.id || null,
      fecha: receta?.fecha || cita?.fecha || session?.fecha || new Date().toISOString().slice(0, 10),
      diagnostico: receta?.diagnostico || session?.diagnostico || "",
      indicaciones_generales: receta?.indicaciones_generales || session?.recomendaciones || "",
      medicamentos: Array.isArray(receta?.medicamentos) ? receta.medicamentos : [],
      paciente_nombre: patient.fullNameDisplay || patient.fullName || getFullName(patient),
      paciente_fecha_nac: patient.fecha_nac || "",
      profesional_nombre: receta?.profesional_nombre || cita?.profesional_nombre || professional?.full_name || professional?.label || "",
      profesional_cedula: receta?.profesional_cedula || professional?.cedula_profesional || "",
    };
  }

  async function handleOpenClinicalNote({ patient, cita, session, citaId }) {
    try {
      const effectiveCitaId = citaId || cita?.id || null;
      const linkedSession = session || (effectiveCitaId ? await getSessionByCita(effectiveCitaId) : null);
      const noteData = effectiveCitaId
        ? await fetchJsonAuth(`${API_BASE}/api/notas-clinicas/?cita=${effectiveCitaId}`)
        : [];

      const note = Array.isArray(noteData) && noteData.length ? noteData[0] : null;

      setNoteModal({
        open: true,
        payload: { patient, cita, session: linkedSession, citaId: effectiveCitaId },
        data: buildNoteFormBase({ patient, cita, linkedSession, note }),
      });
    } catch (error) {
      console.error("Error abriendo nota clínica:", error);
      alert("No se pudo abrir la nota clínica. Si agregaste campos nuevos en backend, verifica migraciones y reinicia el servidor.");
    }
  }

  async function handleOpenPrescription({ patient, cita, session, citaId }) {
    const effectiveCitaId = citaId || cita?.id || null;
    if (!effectiveCitaId) {
      alert("Para generar o editar receta médica, la acción debe abrirse desde una cita.");
      return;
    }

    try {
      const linkedSession = session || (effectiveCitaId ? await getSessionByCita(effectiveCitaId) : null);
      const data = await fetchJsonAuth(`${API_BASE}/api/recetas-medicas/?cita=${effectiveCitaId}`);
      const receta = Array.isArray(data) && data.length ? data[0] : null;

      setRxModal({
        open: true,
        payload: { patient, cita, session: linkedSession, citaId: effectiveCitaId },
        data: buildPrescriptionBase({
          patient,
          cita,
          session: linkedSession,
          receta,
          professionals,
        }),
      });
    } catch (error) {
      console.error("Error abriendo receta médica:", error);
    }
  }

  async function handleOpenEvidence({ patient, cita, session, citaId }) {
    const effectiveCitaId = citaId || cita?.id || null;
    if (!effectiveCitaId) {
      alert("Para cargar evidencias clínicas, la acción debe abrirse desde una cita.");
      return;
    }

    const linkedSession = session || (effectiveCitaId ? await getSessionByCita(effectiveCitaId) : null);
    const data = await fetchJsonAuth(`${API_BASE}/api/evidencias-clinicas/?cita=${effectiveCitaId}`);

    setEvidenceModal({
      open: true,
      payload: { patient, cita, session: linkedSession, citaId: effectiveCitaId },
      items: Array.isArray(data) ? data : [],
    });
  }

  function normalizePainPayload(pain = []) {
    if (!Array.isArray(pain)) return [];

    return pain
      .map((item) => {
        if (!item) return null;

        if (typeof item === "string") {
          return {
            id: item,
            meshName: item,
            label: getPainLabels([item])[0] || item,
            side: null,
          };
        }

        const id = item?.id || item?.meshName || "";
        if (!id) return null;

        return {
          id,
          meshName: item?.meshName || id,
          label: item?.label || getPainLabels([item])[0] || id,
          side: item?.side ?? null,
        };
      })
      .filter(Boolean);
  }

  async function syncPatientClinicalSession({
    patientId,
    formData,
    token,
    currentPatient = null,
  }) {
    const latestSession = currentPatient?._ultimaSesion || null;

    const hasClinicalInfo =
      String(formData.dolorResumen || "").trim() ||
      String(formData.notas || "").trim() ||
      (Array.isArray(formData.pain) && formData.pain.length > 0) ||
      !!latestSession?.id;

    if (!hasClinicalInfo) return null;

    const payload = {
      paciente: patientId,
      fecha: latestSession?.fecha || new Date().toISOString().slice(0, 10),
      motivo_consulta: formData.dolorResumen || formData.molestia || "",
      intensidad_dolor: latestSession?.intensidad_dolor ?? null,
      zonas_dolor: normalizePainPayload(formData.pain),
      notas: formData.notas || "",
      exploracion: latestSession?.exploracion || "",
      diagnostico: latestSession?.diagnostico || "",
      tratamiento_realizado: latestSession?.tratamiento_realizado || "",
      recomendaciones: latestSession?.recomendaciones || "",
      estado_sesion: latestSession?.estado_sesion || "",
    };

    const linkedCitaId = latestSession?.cita_id || latestSession?.cita || null;
    if (linkedCitaId) {
      payload.cita = linkedCitaId;
    }

    const url = latestSession?.id
      ? `${API_BASE}/api/sesiones-clinicas/${latestSession.id}/`
      : `${API_BASE}/api/sesiones-clinicas/`;

    const method = latestSession?.id ? "PATCH" : "POST";

    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => null);
      console.error("Error al guardar sesión clínica del paciente:", data || resp.status);
      return null;
    }

    return await resp.json();
  }

  const handleSavePatient = async (formData) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    const isEdit = formMode === "edit" && selectedPatient;
    const url = isEdit
      ? `${API_BASE}/api/pacientes/${selectedPatient.id}/`
      : `${API_BASE}/api/pacientes/`;
    const method = isEdit ? "PATCH" : "POST";

    const nameParts = splitFullName(formData.nombre);

    const payload = {
      clinica: isEdit ? selectedPatient.clinica || defaultClinicId : defaultClinicId,
      nombres: nameParts.nombres,
      apellido_pat: nameParts.apellido_pat,
      apellido_mat: nameParts.apellido_mat || "",
      fecha_nac: formData.nacimiento || null,
      genero: formData.sexo || "",
      telefono: formData.telefono || "",
      correo: formData.email || "",
      molestia: formData.molestia || formData.dolorResumen || "",
      notas: formData.notas || "",
      estado_tratamiento: formData.estado_tratamiento || "en_tratamiento",
      fecha_alta:
        formData.estado_tratamiento === "alta"
          ? formData.fecha_alta || null
          : null,
      requiere_factura: !!formData.requiere_factura,
      facturacion_razon_social: formData.requiere_factura ? formData.factura_razon_social || "" : "",
      facturacion_rfc: formData.requiere_factura ? formData.factura_rfc || "" : "",
      facturacion_regimen_fiscal: formData.requiere_factura ? formData.factura_regimen_fiscal || "" : "",
      facturacion_codigo_postal: formData.requiere_factura ? formData.factura_codigo_postal || "" : "",
      facturacion_uso_cfdi: formData.requiere_factura ? formData.factura_uso_cfdi || "" : "",
      facturacion_correo: formData.requiere_factura ? formData.factura_correo || "" : "",
      expediente: {
        ocupacion: formData.ocupacion || "",
        direccion: formData.direccion || "",
        heredo_familiares: formData.heredoFamiliares || "",
        antecedentes: formData.antecedentes || {},
        habitos: formData.habitos || {},
        documentos: formData.docs || {},
        notas_generales: formData.notas || "",
      },
    };

    if (isEdit) {
      delete payload.clinica;
    }

    try {
      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 401) return logoutAndRedirect();

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        console.error("Error al guardar paciente:", data || resp.status);
        return;
      }

      const saved = await resp.json();

      await syncPatientClinicalSession({
        patientId: saved.id,
        formData,
        token,
        currentPatient: isEdit ? selectedPatient : null,
      });

      await loadAll();
      setFormOpen(false);
      setSelectedPatient(null);
    } catch (e) {
      console.error("Error al guardar paciente:", e);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">
            Cargando pacientes desde el servidor…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-visible">
      <main className="flex flex-1 flex-col overflow-visible">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <ClipboardList className="h-3.5 w-3.5" />
                Expediente clínico
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                Gestión de pacientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Administra pacientes, consulta historial y registra información clínica con expediente y sesiones.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 sm:min-w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  value={search}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearch(next);
                    const current = readPatientsSidebarFilters();
                    const merged = { ...current, search: next };
                    localStorage.setItem(
                      PATIENTS_SIDEBAR_STORAGE_KEY,
                      JSON.stringify(merged)
                    );
                    window.dispatchEvent(
                      new CustomEvent("patients:filters:sync", { detail: merged })
                    );
                  }}
                />
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3dc2d5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#35b1c3]"
                onClick={handleOpenCreate}
              >
                <Plus className="h-4 w-4" />
                Nuevo paciente
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={UserRound} label="Total pacientes" value={stats.total} tone="neutral" />
          <StatCard icon={Activity} label="En tratamiento" value={stats.enTratamiento} tone="amber" />
          <StatCard icon={ShieldCheck} label="Dados de alta" value={stats.alta} tone="emerald" />
          <StatCard icon={CalendarDays} label="Con citas registradas" value={stats.conCitas} tone="sky" />
        </div>

        <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Listado de pacientes
              </div>
              <div className="text-xs text-slate-500">
                Mostrando <b>{filteredPatients.length}</b> de <b>{patients.length}</b> registros
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <FileText className="h-4 w-4" />
              Integrado con expediente y sesiones clínicas
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold">Último servicio</th>
                  <th className="px-6 py-4 font-semibold">Edad</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-900">
                          {initialsFromPatient(p)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-slate-900">
                            {p.fullNameDisplay}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {p.genero || "—"} • Registrado: {p.registro ? formatDateMX(p.registro) : "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-900">{p.telefono || "—"}</div>
                      <div className="text-xs text-slate-500">{p.correo || "—"}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-700">{p.lastServiceName || "—"}</td>

                    <td className="px-6 py-4 text-slate-700">{calcEdad(p.fecha_nac)}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${p.estado_tratamiento === "alta"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                      >
                        {estadoTratamientoLabel(p.estado_tratamiento)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton icon={ClipboardList} label="Historial clínico" onClick={() => handleOpenHistory(p)} />
                        <ActionButton icon={Pencil} label="Ver / Editar" onClick={() => handleOpenEdit(p)} />
                        <ActionButton
                          icon={Trash2}
                          label="Eliminar"
                          tone="danger"
                          onClick={() => handleDeletePatient(p)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      No se encontraron pacientes con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 lg:hidden">
            {filteredPatients.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No se encontraron pacientes con ese criterio.
              </div>
            ) : (
              filteredPatients.map((p) => (
                <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white font-extrabold text-slate-900">
                        {initialsFromPatient(p)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-extrabold text-slate-900">
                          {p.fullNameDisplay}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {p.telefono || "—"} • {p.correo || "—"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${p.estado_tratamiento === "alta"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                    >
                      {p.estado_tratamiento === "alta" ? "Alta" : "Tratamiento"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <MiniInfo label="Edad" value={calcEdad(p.fecha_nac)} />
                    <MiniInfo label="Último servicio" value={p.lastServiceName || "—"} />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <MobileActionButton
                      icon={Eye}
                      label="Ver expediente"
                      onClick={() => handleOpenProfile(p)}
                    />
                    <MobileActionButton
                      icon={ClipboardList}
                      label="Historial clínico"
                      onClick={() => handleOpenHistory(p)}
                    />
                    <MobileActionButton
                      icon={Pencil}
                      label="Editar"
                      onClick={() => handleOpenEdit(p)}
                    />
                    <MobileActionButton
                      icon={Trash2}
                      label="Eliminar"
                      tone="danger"
                      onClick={() => handleDeletePatient(p)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {profileOpen && selectedPatient && (
        <PatientProfileModal
          patient={selectedPatient}
          onClose={() => setProfileOpen(false)}
          onEdit={() => {
            setProfileOpen(false);
            handleOpenEdit(selectedPatient);
          }}
          onOpenClinicalNote={handleOpenClinicalNote}
          onOpenPrescription={handleOpenPrescription}
          onOpenEvidence={handleOpenEvidence}
        />
      )}

      {formOpen && (
        <PatientFormModal
          mode={formMode}
          patient={formMode === "edit" ? selectedPatient : null}
          initialStepKey={formInitialStepKey}
          onClose={() => setFormOpen(false)}
          onSave={handleSavePatient}
          onOpenClinicalNote={handleOpenClinicalNote}
          onOpenPrescription={handleOpenPrescription}
          onOpenEvidence={handleOpenEvidence}
        />
      )}

      {deleteOpen && deleteTarget && (
        <DeleteConfirmModal
          patient={deleteTarget}
          onClose={() => {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={() => confirmDeletePatient(deleteTarget)}
        />
      )}

      <ClinicalNoteModal
        open={noteModal.open}
        data={noteModal.data}
        payload={noteModal.payload}
        onClose={() => {
          setNoteModal({ open: false, payload: null, data: null });
        }}
        onSaved={async () => {
          setNoteModal({ open: false, payload: null, data: null });
          await loadAll();
        }}
        onEnsureSession={ensureSessionForCita}
      />

      <PrescriptionModal
        open={rxModal.open}
        data={rxModal.data}
        payload={rxModal.payload}
        onClose={() => {
          setRxModal({ open: false, payload: null, data: null });
        }}
        onSaved={async () => {
          setRxModal({ open: false, payload: null, data: null });
          await loadAll();
        }}
      />

      <EvidenceModal
        open={evidenceModal.open}
        items={evidenceModal.items}
        payload={evidenceModal.payload}
        onClose={() => {
          setEvidenceModal({ open: false, payload: null, items: [] });
        }}
        onUploaded={async () => {
          if (!evidenceModal.payload?.citaId) return;
          const data = await fetchJsonAuth(
            `${API_BASE}/api/evidencias-clinicas/?cita=${evidenceModal.payload.citaId}`
          );
          setEvidenceModal((prev) => ({
            ...prev,
            items: Array.isArray(data) ? data : [],
          }));
          await loadAll();
        }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "neutral" }) {
  const toneClass = {
    neutral: "bg-white border-slate-200",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    sky: "bg-sky-50 border-sky-100",
  }[tone];

  return (
    <div className={`rounded-[28px] border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/70 bg-white/80 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MobileActionButton({ icon: Icon, label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function formatDateForHeader(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function previewTypeFromItem(item) {
  if (item?.tipo_archivo === "imagen") return "imagen";
  if (item?.tipo_archivo === "pdf") return "pdf";

  const url = String(getEvidenceFileUrl(item) || "").toLowerCase();
  if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(url)) return "imagen";
  if (/\.pdf(\?|$)/.test(url)) return "pdf";
  return "otro";
}

function PortalOverlay({ children }) {
  return createPortal(children, document.body);
}

function SimpleOverlay({ children, onClose, maxWidth = "max-w-4xl" }) {
  return (
    <PortalOverlay>
      <div className="fixed inset-0 z-[1800] overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
        <div className="fixed inset-0" onClick={onClose} />
        <div className="relative flex min-h-full items-start justify-center sm:items-center">
          <div
            className={`relative z-10 my-2 flex w-full ${maxWidth} max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl sm:my-6 sm:max-h-[calc(100dvh-3rem)]`}
          >
            {children}
          </div>
        </div>
      </div>
    </PortalOverlay>
  );
}


function ClinicalNoteModal({ open, data, payload, onClose, onSaved, onEnsureSession }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  if (!open) return null;

  const tipoNota = form.tipo_nota || "evolucion";
  const contenido = form.contenido_nom004 || {};
  const isEdit = !!form?.id;
  const painLabels = getPainLabels(Array.isArray(form.zonas_dolor) ? form.zonas_dolor : []);

  function updateContenido(campo, value) {
    setForm((prev) => ({
      ...prev,
      contenido_nom004: {
        ...(prev.contenido_nom004 || {}),
        [campo]: value,
      },
    }));
  }

  function changeTipoNota(nextTipo) {
    setForm((prev) => ({
      ...prev,
      tipo_nota: nextTipo,
      contenido_nom004: getEmptyContenidoNom004(nextTipo),
    }));
  }

  async function save() {
    const token = localStorage.getItem("auth.access");
    const cita = payload?.cita || null;
    const legacy = getLegacySoapFromNom004(tipoNota, contenido);

    const sessionSaved = await onEnsureSession?.({
      cita,
      patientId: form.paciente,
      form: {
        ...form,
        diagnostico_resumen:
          contenido.diagnosticos_problemas || contenido.impresion_diagnostica || "",
        recomendaciones_resumen:
          contenido.indicacion_terapeutica ||
          contenido.tratamiento_indicaciones ||
          contenido.terapeutica_empleada ||
          "",
        exploracion_resumen: contenido.exploracion_fisica || "",
      },
    });

    if (!sessionSaved?.id) {
      console.error("No se pudo garantizar la sesión clínica ligada a la cita.");
      alert("No se pudo enlazar la nota clínica a una sesión clínica válida.");
      return;
    }

    const notePayload = {
      paciente: form.paciente,
      cita: form.cita || payload?.citaId || null,
      sesion_clinica: sessionSaved.id,
      fecha: form.fecha || cita?.fecha || new Date().toISOString().slice(0, 10),
      tipo_nota: tipoNota,
      contenido_nom004: contenido,
      subjetivo: legacy.subjetivo,
      objetivo: legacy.objetivo,
      analisis: legacy.analisis,
      plan: legacy.plan,
      observaciones: legacy.observaciones,
    };

    const url = isEdit
      ? `${API_BASE}/api/notas-clinicas/${form.id}/`
      : `${API_BASE}/api/notas-clinicas/`;
    const method = isEdit ? "PATCH" : "POST";

    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notePayload),
    });

    const saved = await resp.json().catch(() => null);

    if (!resp.ok) {
      console.error("Error guardando nota clínica:", saved || resp.status);
      alert("No se pudo guardar la nota clínica. Revisa la consola del backend y valida migraciones.");
      return;
    }

    setForm((prev) => ({ ...prev, ...saved, id: saved.id, sesion_clinica: sessionSaved.id }));
  }

  const camposPorTipo = {
    historia_clinica: [
      ["ficha_identificacion", "Ficha de identificación"],
      ["grupo_etnico", "Grupo étnico (si aplica)"],
      ["antecedentes_heredo_familiares", "Antecedentes heredo-familiares"],
      ["antecedentes_personales_patologicos", "Antecedentes personales patológicos"],
      ["antecedentes_personales_no_patologicos", "Antecedentes personales no patológicos"],
      ["consumo_sustancias_psicoactivas", "Uso y dependencia de tabaco, alcohol u otras sustancias"],
      ["padecimiento_actual", "Padecimiento actual y tratamientos previos"],
      ["interrogatorio_aparatos_sistemas", "Interrogatorio por aparatos y sistemas"],
      ["habitus_exterior", "Habitus exterior"],
      ["signos_vitales", "Signos vitales"],
      ["peso_talla", "Peso y talla"],
      ["exploracion_fisica", "Exploración física"],
      ["resultados_estudios", "Resultados de laboratorio / gabinete / otros"],
      ["diagnosticos_problemas", "Diagnósticos o problemas clínicos"],
      ["pronostico", "Pronóstico"],
      ["indicacion_terapeutica", "Indicación terapéutica"],
    ],
    evolucion: [
      ["evolucion_cuadro_clinico", "Evolución y actualización del cuadro clínico"],
      ["signos_vitales", "Signos vitales"],
      ["resultados_relevantes", "Resultados relevantes de estudios previos"],
      ["diagnosticos_problemas", "Diagnósticos o problemas clínicos"],
      ["pronostico", "Pronóstico"],
      ["tratamiento_indicaciones", "Tratamiento e indicaciones médicas"],
    ],
    interconsulta: [
      ["criterios_diagnosticos", "Criterios diagnósticos"],
      ["plan_estudios", "Plan de estudios"],
      ["sugerencias_diagnosticas_tratamiento", "Sugerencias diagnósticas y tratamiento"],
      ["notas_complementarias", "Datos complementarios"],
    ],
    referencia_traslado: [
      ["establecimiento_envia", "Establecimiento que envía"],
      ["establecimiento_receptor", "Establecimiento receptor"],
      ["motivo_envio", "Motivo de envío"],
      ["impresion_diagnostica", "Impresión diagnóstica"],
      ["terapeutica_empleada", "Terapéutica empleada"],
      ["resumen_clinico", "Resumen clínico"],
    ],
  };

  return (
    <SimpleOverlay onClose={onClose} maxWidth="max-w-7xl">
      <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-lg font-black text-slate-900">
              {isEdit ? "Ver / editar nota clínica NOM-004" : "Agregar nota clínica NOM-004"}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              La nota se guarda ligada a la cita y soporta historia clínica, evolución, interconsulta y referencia/traslado.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Paciente</div>
              <div>{form.paciente_nombre || "—"}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Fecha de la nota</div>
              <div>{formatDateForHeader(form.fecha)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                Tipo de nota
              </label>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={tipoNota}
                onChange={(e) => changeTipoNota(e.target.value)}
              >
                <option value="historia_clinica">Historia clínica</option>
                <option value="evolucion">Nota de evolución</option>
                <option value="interconsulta">Nota de interconsulta</option>
                <option value="referencia_traslado">Nota de referencia / traslado</option>
              </select>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                    Motivo de consulta
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    value={form.motivo_consulta || ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, motivo_consulta: e.target.value }))
                    }
                    placeholder="Motivo principal de la atención"
                  />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1.5 text-sm font-semibold text-slate-900">
                    Zonas de dolor registradas en la cita
                  </div>
                  <div className="text-xs text-slate-500">
                    Para la nota clínica ya no se muestra el modelo 3D. Aquí solo se visualizan las zonas previamente capturadas.
                  </div>
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
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(camposPorTipo[tipoNota] || []).map(([campo, label]) => (
              <div key={campo}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                  {label}
                </label>
                <textarea
                  rows={campo.includes("signos_vitales") || campo.includes("peso_talla") ? 2 : 4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  value={contenido[campo] || ""}
                  onChange={(e) => updateContenido(campo, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cerrar
          </button>
          {form.id ? (
            <>
              <button
                onClick={async () => {
                  try {
                    await openProtectedBinary(`${API_BASE}/api/notas-clinicas/${form.id}/pdf/?inline=1`, {
                      filename: `nota_clinica_${form.id}.pdf`,
                    });
                  } catch (error) {
                    console.error(error);
                    alert(error.message || "No se pudo visualizar la nota clínica.");
                  }
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Visualizar nota
              </button>
              <button
                onClick={async () => {
                  try {
                    await openProtectedBinary(`${API_BASE}/api/notas-clinicas/${form.id}/pdf/`, {
                      filename: `nota_clinica_${form.id}.pdf`,
                      download: true,
                    });
                  } catch (error) {
                    console.error(error);
                    alert(error.message || "No se pudo generar el PDF de la nota clínica.");
                  }
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Generar PDF
              </button>
            </>
          ) : null}
          <button
            onClick={save}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {isEdit ? "Guardar cambios" : "Guardar nota"}
          </button>
        </div>
      </div>
    </SimpleOverlay>
  );
}

function PrescriptionModal({ open, data, payload, onClose, onSaved }) {
  const [form, setForm] = useState(data || {});

  useEffect(() => {
    setForm(data || {});
  }, [data]);

  if (!open) return null;

  function updateMed(index, key, value) {
    setForm((prev) => {
      const meds = [...(prev.medicamentos || [])];
      meds[index] = { ...(meds[index] || {}), [key]: value };
      return { ...prev, medicamentos: meds };
    });
  }

  function addMed() {
    setForm((prev) => ({
      ...prev,
      medicamentos: [
        ...(prev.medicamentos || []),
        {
          nombre: "",
          dosis: "",
          via_administracion: "VO",
          frecuencia: "",
          duracion: "",
          notas: "",
        },
      ],
    }));
  }

  function removeMed(index) {
    setForm((prev) => ({
      ...prev,
      medicamentos: (prev.medicamentos || []).filter((_, i) => i !== index),
    }));
  }

  async function save() {
    const token = localStorage.getItem("auth.access");
    const isEdit = !!form.id;
    const url = isEdit
      ? `${API_BASE}/api/recetas-medicas/${form.id}/`
      : `${API_BASE}/api/recetas-medicas/`;
    const method = isEdit ? "PATCH" : "POST";

    const payloadSave = {
      paciente: form.paciente,
      cita: form.cita,
      fecha: form.fecha,
      diagnostico: form.diagnostico || "",
      indicaciones_generales: form.indicaciones_generales || "",
      medicamentos: (form.medicamentos || []).filter(
        (item) =>
          String(item?.nombre || "").trim() ||
          String(item?.dosis || "").trim() ||
          String(item?.frecuencia || "").trim()
      ),
    };

    const resp = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payloadSave),
    });

    const dataResp = await resp.json().catch(() => null);

    if (!resp.ok) {
      console.error("Error guardando receta:", dataResp || resp.status);
      alert("No se pudo guardar la receta. Revisa el backend y valida migraciones si agregaste nuevos campos.");
      return;
    }

    setForm((prev) => ({ ...prev, ...dataResp, id: dataResp.id }));
  }

  return (
    <SimpleOverlay onClose={onClose} maxWidth="max-w-6xl">
      <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
        <div className="text-lg font-black text-slate-900">Receta médica</div>
        <div className="mt-1 text-sm text-slate-500">
          Se autocompletan paciente, edad, fecha de nacimiento, fecha de receta y profesional tratante.
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <MiniInfo label="Paciente" value={form.paciente_nombre || "—"} />
            <MiniInfo label="Fecha de receta" value={formatDateForHeader(form.fecha)} />
            <MiniInfo label="Edad" value={calcEdad(form.paciente_fecha_nac)} />
            <MiniInfo label="Fecha de nacimiento" value={formatDateForHeader(form.paciente_fecha_nac)} />
            <MiniInfo label="Doctor" value={form.profesional_nombre || payload?.cita?.profesional_nombre || "—"} />
            <MiniInfo label="Cédula profesional" value={form.profesional_cedula || "Captúrala en el perfil del profesional"} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Diagnóstico
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.diagnostico || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, diagnostico: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Indicaciones generales
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={form.indicaciones_generales || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    indicaciones_generales: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">Medicamentos recetados</div>
              <button
                type="button"
                onClick={addMed}
                className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Agregar medicamento
              </button>
            </div>

            <div className="space-y-3">
              {(form.medicamentos || []).map((med, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Medicamento #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMed(index)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Nombre del medicamento"
                      value={med.nombre || ""}
                      onChange={(e) => updateMed(index, "nombre", e.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Dosis"
                      value={med.dosis || ""}
                      onChange={(e) => updateMed(index, "dosis", e.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Vía de administración"
                      value={med.via_administracion || ""}
                      onChange={(e) => updateMed(index, "via_administracion", e.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Cada cuánto tomarlo"
                      value={med.frecuencia || ""}
                      onChange={(e) => updateMed(index, "frecuencia", e.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Duración"
                      value={med.duracion || ""}
                      onChange={(e) => updateMed(index, "duracion", e.target.value)}
                    />
                    <textarea
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      rows={2}
                      placeholder="Notas"
                      value={med.notas || ""}
                      onChange={(e) => updateMed(index, "notas", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {(form.medicamentos || []).length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Todavía no has agregado medicamentos.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cerrar
          </button>
          {form.id ? (
            <>
              <button
                onClick={async () => {
                  try {
                    await openProtectedBinary(`${API_BASE}/api/recetas-medicas/${form.id}/pdf/?inline=1`, {
                      filename: `receta_medica_${form.id}.pdf`,
                    });
                  } catch (error) {
                    console.error(error);
                    alert(error.message || "No se pudo visualizar la receta.");
                  }
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Visualizar receta
              </button>
              <button
                onClick={async () => {
                  try {
                    await openProtectedBinary(`${API_BASE}/api/recetas-medicas/${form.id}/pdf/`, {
                      filename: `receta_medica_${form.id}.pdf`,
                      download: true,
                    });
                  } catch (error) {
                    console.error(error);
                    alert(error.message || "No se pudo generar el PDF de la receta.");
                  }
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Generar PDF
              </button>
            </>
          ) : null}
          <button
            onClick={save}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {form.id ? "Guardar cambios" : "Guardar receta"}
          </button>
        </div>
      </div>
    </SimpleOverlay>
  );
}

function EvidenceModal({ open, items, payload, onClose, onUploaded }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  useEffect(() => {
    if (!archivo || !String(archivo.type || "").startsWith("image/")) {
      setLocalPreviewUrl("");
      return;
    }

    const blobUrl = URL.createObjectURL(archivo);
    setLocalPreviewUrl(blobUrl);

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [archivo]);

  useEffect(() => {
    if (!open) {
      setTitulo("");
      setDescripcion("");
      setArchivo(null);
      setLocalPreviewUrl("");
    }
  }, [open]);

  if (!open) return null;

  async function upload() {
    if (!archivo || !payload?.citaId) {
      alert("Selecciona un archivo antes de subir la evidencia.");
      return;
    }

    const token = localStorage.getItem("auth.access");
    const fd = new FormData();

    fd.append("paciente", payload.patient.id);
    fd.append("cita", payload.citaId);
    if (payload.session?.id) {
      fd.append("sesion_clinica", payload.session.id);
    }
    fd.append("titulo", titulo);
    fd.append("descripcion", descripcion);
    fd.append("archivo", archivo);

    const resp = await fetch(`${API_BASE}/api/evidencias-clinicas/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    const dataResp = await resp.json().catch(() => null);

    if (!resp.ok) {
      console.error("Error subiendo evidencia:", dataResp || resp.status);
      alert(dataResp?.detail || "No se pudo subir la evidencia.");
      return;
    }

    setTitulo("");
    setDescripcion("");
    setArchivo(null);
    setLocalPreviewUrl("");
    onUploaded?.();
  }

  return (
    <SimpleOverlay onClose={onClose} maxWidth="max-w-6xl">
      <div className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
        <div className="text-lg font-black text-slate-900">Evidencias clínicas</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 p-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Título
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Radiografía AP, evolución 2 semanas..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Descripción
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Notas breves para identificar la evidencia."
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-900">Archivo</div>

              <input
                id="evidencia-clinica-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />

              <label
                htmlFor="evidencia-clinica-input"
                className="flex cursor-pointer items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-slate-100"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
                  +
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    {archivo ? "Cambiar archivo" : "Agregar evidencia"}
                  </span>
                  <span className="block text-xs text-slate-500">
                    JPG, PNG, WEBP o PDF
                  </span>
                </span>
              </label>

              <div className="mt-2 text-xs text-slate-500">
                {archivo ? `Seleccionado: ${archivo.name}` : "Aún no has seleccionado un archivo."}
              </div>
            </div>

            {archivo ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vista previa
                </div>

                {String(archivo.type || "").startsWith("image/") && localPreviewUrl ? (
                  <img
                    src={localPreviewUrl}
                    alt={archivo.name}
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                ) : String(archivo.type || "").includes("pdf") ? (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10" />
                      <span className="text-xs font-semibold">PDF listo para subir</span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={upload}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Subir evidencia
            </button>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Aún no hay evidencias cargadas para esta cita.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const previewType = previewTypeFromItem(item);
                  const fileUrl = getEvidenceFileUrl(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition hover:bg-slate-50"
                    >
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
                        {previewType === "imagen" ? (
                          <img
                            src={fileUrl}
                            alt={item.titulo || "Evidencia clínica"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : previewType === "pdf" ? (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <FileText className="h-10 w-10" />
                            <span className="text-xs font-semibold">Vista PDF</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <ImageIcon className="h-10 w-10" />
                            <span className="text-xs font-semibold">Archivo clínico</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 p-4">
                        <div className="line-clamp-2 text-sm font-black text-slate-900">
                          {item.titulo || item.archivo_nombre || "Archivo clínico"}
                        </div>
                        <div className="line-clamp-2 text-sm text-slate-600">
                          {item.descripcion || "Sin descripción"}
                        </div>
                        <div className="pt-1 text-xs font-semibold text-sky-700">
                          {(item.tipo_archivo || previewType).toUpperCase()} • Abrir en pestaña nueva
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </SimpleOverlay>
  );
}


export default PatientsView;
