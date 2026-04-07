// src/utils/authSession.js
const ACCESS_KEY = "auth.access";
const REFRESH_KEY = "auth.refresh";
const USER_KEY = "auth.user";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function saveSessionTokens(data, userIdentifier = "") {
  if (data?.access) localStorage.setItem(ACCESS_KEY, data.access);
  if (data?.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
  if (userIdentifier) localStorage.setItem(USER_KEY, userIdentifier);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function accessTokenExpiresSoon(seconds = 120) {
  const token = getAccessToken();
  const payload = decodeJwt(token || "");
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= seconds;
}

export async function refreshAccessToken(apiBase) {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const resp = await fetch(`${apiBase}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data?.access) {
    clearSession();
    return null;
  }

  localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

export function startSessionRefresh({
  apiBase,
  onAuthLost,
  thresholdSeconds = 120,
  intervalMs = 60000,
}) {
  let running = false;

  const tick = async () => {
    if (running) return;
    if (!document.hasFocus() && document.visibilityState !== "visible") return;
    if (!accessTokenExpiresSoon(thresholdSeconds)) return;

    running = true;
    try {
      const token = await refreshAccessToken(apiBase);
      if (!token) onAuthLost?.();
    } catch {
      onAuthLost?.();
    } finally {
      running = false;
    }
  };

  const intervalId = window.setInterval(tick, intervalMs);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("focus", tick);

  tick();

  return () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", tick);
    window.removeEventListener("focus", tick);
  };
}
