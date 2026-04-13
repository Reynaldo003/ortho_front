const API_BASE = "https://ortho-clinic-cordoba.cloud";

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const tieneBody = options.body !== undefined && options.body !== null;
  if (tieneBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Ocurrió un error al conectar con el servidor.",
    );
  }

  return data;
}

function nombreCompletoProfesional(item) {
  const nombre = `${item.first_name || ""} ${item.last_name || ""}`.trim();
  return nombre || item.username || "Profesional";
}

export async function obtenerProfesionalesPublicos() {
  const data = await request("/api/public/team/");

  return (Array.isArray(data) ? data : [])
    .filter((item) => {
      const rol = String(item.rol_out || "").toLowerCase();
      return ["doctor", "fisioterapeuta", "nutriologo", "dentista"].includes(
        rol,
      );
    })
    .map((item) => ({
      id: item.id,
      tipo_objetivo: "profesional",
      nombre: nombreCompletoProfesional(item),
      subtitulo: item.descripcion_out || item.rol_out || "Profesional",
      foto_url: item.foto_url || null,
      tag: "Doctor",
    }));
}

export async function obtenerServiciosPublicos() {
  const data = await request("/api/servicios/");

  return (Array.isArray(data) ? data : []).map((item) => ({
    id: item.id,
    tipo_objetivo: "servicio",
    nombre: item.nombre || "Servicio",
    subtitulo: item.descripcion || "Servicio",
    foto_url: item.imagen_url || null,
    tag: "Servicio",
  }));
}

export async function obtenerComentariosPublicos(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.tipo_objetivo) {
    params.set("tipo_objetivo", filtros.tipo_objetivo);
  }

  if (filtros.profesional) {
    params.set("profesional", String(filtros.profesional));
  }

  if (filtros.servicio) {
    params.set("servicio", String(filtros.servicio));
  }

  if (filtros.objetivo_publico) {
    params.set("objetivo_publico", String(filtros.objetivo_publico));
  }

  const query = params.toString();
  const path = `/api/comentarios/public_list/${query ? `?${query}` : ""}`;

  const data = await request(path);
  return Array.isArray(data) ? data : [];
}

export async function crearComentario(payload) {
  return request("/api/comentarios/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
