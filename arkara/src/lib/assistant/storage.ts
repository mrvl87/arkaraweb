import type { RuntimeSession } from "./contracts";

const DEFAULT_STORAGE_KEY = "arkaraweb-assistant-session";
const FALLBACK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

export function getStorageKey(customKey?: string) {
  return customKey ?? DEFAULT_STORAGE_KEY;
}

export function readStoredSession(storageKey?: string): RuntimeSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getStorageKey(storageKey));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as RuntimeSession;
    const expiresAt = Date.parse(parsed.expiresAt);
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      window.localStorage.removeItem(getStorageKey(storageKey));
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(getStorageKey(storageKey));
    return null;
  }
}

export function writeStoredSession(
  session: { sessionId: string; expiresAt?: string; isNew?: boolean },
  storageKey?: string
): RuntimeSession {
  const expiresAt =
    session.expiresAt ?? new Date(Date.now() + FALLBACK_TTL_MS).toISOString();
  const runtimeSession: RuntimeSession = {
    sessionId: session.sessionId,
    isNew: Boolean(session.isNew),
    expiresAt,
    lastTouchedAt: nowIso()
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(getStorageKey(storageKey), JSON.stringify(runtimeSession));
  }

  return runtimeSession;
}

export function clearStoredSession(storageKey?: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(getStorageKey(storageKey));
  }
}
