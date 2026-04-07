// src/components/layout/patients/patientUtils.js
export const PATIENTS_SIDEBAR_STORAGE_KEY = "patients_sidebar_filters_v2";
export const META_START = "<!--PATIENT_META_START-->";
export const META_END = "<!--PATIENT_META_END-->";

export function getFullName(p) {
  return `${p?.nombres || ""} ${p?.apellido_pat || ""} ${p?.apellido_mat || ""}`.trim();
}

export function splitFullName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { nombres: "", apellido_pat: "", apellido_mat: "" };
  }

  if (parts.length === 1) {
    return { nombres: parts[0], apellido_pat: "", apellido_mat: "" };
  }

  if (parts.length === 2) {
    return { nombres: parts[0], apellido_pat: parts[1], apellido_mat: "" };
  }

  return {
    nombres: parts.slice(0, parts.length - 2).join(" "),
    apellido_pat: parts[parts.length - 2],
    apellido_mat: parts[parts.length - 1],
  };
}

export function getProfessionalLabel(p) {
  const full = `${p?.first_name || ""} ${p?.last_name || ""}`.trim();
  return full || p?.username || `Profesional #${p?.id}`;
}

export function formatDateMX(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatTimeHM(hhmmss) {
  if (!hhmmss) return "—";
  return String(hhmmss).slice(0, 5);
}

export function estadoTratamientoLabel(v) {
  if (v === "alta") return "Dado de alta";
  return "En tratamiento";
}

export function stripMetaFromNotes(raw = "") {
  const text = String(raw || "");
  const start = text.indexOf(META_START);
  const end = text.indexOf(META_END);

  if (start === -1 || end === -1 || end < start) return text.trim();

  const visible =
    `${text.slice(0, start)}${text.slice(end + META_END.length)}`.trim();
  return visible.trim();
}

export function extractMetaFromNotes(raw = "") {
  const text = String(raw || "");
  const start = text.indexOf(META_START);
  const end = text.indexOf(META_END);

  if (start === -1 || end === -1 || end < start) return {};

  const jsonRaw = text.slice(start + META_START.length, end).trim();

  try {
    return JSON.parse(jsonRaw || "{}");
  } catch {
    return {};
  }
}

export function composeNotesWithMeta(visibleNotes = "", meta = {}) {
  const cleanVisible = String(visibleNotes || "").trim();
  const cleanMeta = JSON.stringify(meta || {});
  return [cleanVisible, META_START, cleanMeta, META_END]
    .filter(Boolean)
    .join("\n");
}

export function readPatientsSidebarFilters() {
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

export function initialsFromPatient(p) {
  const full = getFullName(p);
  const parts = full.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function calcEdad(fecha) {
  if (!fecha) return "—";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  let edad = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) edad--;
  return edad;
}

export function yesNo(v) {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return "—";
}
