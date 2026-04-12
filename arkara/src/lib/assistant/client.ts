import type {
  AssistantClientOptions,
  AssistantPageContext,
  ChatStreamEvent,
  ClientMessage,
  RuntimeSession,
  ScenarioAnalyzerResponse,
  StartChatInput
} from "./contracts";
import { clearStoredSession, readStoredSession, writeStoredSession } from "./storage";

const PAGE_CONTEXT_HANDOFF_KEY = "arkara-assistant-page-context";

export function createAssistantClient(options: AssistantClientOptions) {
  const apiBaseUrl = options.apiBaseUrl.replace(/\/$/, "");
  const locale = options.locale ?? "id-ID";

  return {
    async ensureSession(): Promise<RuntimeSession> {
      const existing = readStoredSession(options.storageKey);
      const requestedSessionId = resolveRequestedSessionId();

      if (existing && (!requestedSessionId || existing.sessionId === requestedSessionId)) {
        return existing;
      }

      const response = await fetch(`${apiBaseUrl}/v1/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...(requestedSessionId ? { requestedSessionId } : {})
        })
      });

      if (!response.ok) {
        throw new Error("Gagal membuat sesi assistant.");
      }

      const session = await response.json();
      const storedSession = writeStoredSession(session, options.storageKey);
      if (requestedSessionId) {
        cleanupRequestedSessionId();
      }

      return storedSession;
    },

    async loadMessages(): Promise<ClientMessage[]> {
      const session = await this.ensureSession();
      const response = await fetch(`${apiBaseUrl}/v1/session/${session.sessionId}/messages`);
      if (!response.ok) {
        throw new Error("Gagal memuat riwayat percakapan.");
      }

      const payload = await response.json();
      return payload.messages as ClientMessage[];
    },

    async streamChat(
      input: StartChatInput,
      callbacks: { onEvent(event: ChatStreamEvent): void }
    ): Promise<void> {
      const session = await this.ensureSession();
      const response = await fetch(`${apiBaseUrl}/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          message: input.message,
          pageContext: input.pageContext,
          locale,
          mode: input.mode
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Gagal memulai streaming assistant.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event = parseSseEvent(part);
          if (event) {
            callbacks.onEvent(event);
          }
        }
      }
    },

    async analyzeScenario(input: {
      threatType: string;
      locationType: string;
      electricityStatus: string;
      waterStatus: string;
      householdSize: number;
      availableTools: string[];
      medicalConstraints: string[];
      goal: string;
      freeTextNotes: string;
    }): Promise<ScenarioAnalyzerResponse> {
      const session = await this.ensureSession();
      const response = await fetch(`${apiBaseUrl}/v1/analyze-scenario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...input,
          sessionId: session.sessionId,
          locale
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Gagal menganalisis skenario." }));
        throw new Error(error.error ?? "Gagal menganalisis skenario.");
      }

      return (await response.json()) as ScenarioAnalyzerResponse;
    },

    async resetSession(): Promise<RuntimeSession> {
      clearStoredSession(options.storageKey);
      return this.ensureSession();
    }
  };
}

export async function buildAssistantPageUrl(options: AssistantClientOptions): Promise<string> {
  const assistantPageUrl = options.assistantPageUrl ?? "/assistant";
  const session = await createAssistantClient(options).ensureSession();
  storePageContextHandoff(session.sessionId, options.pageContext);
  return appendSessionToUrl(assistantPageUrl, session.sessionId);
}

export function readAssistantPageContextHandoff(): AssistantPageContext | undefined {
  const requestedSessionId = resolveRequestedSessionId();
  if (!requestedSessionId) {
    return undefined;
  }

  return readStoredPageContext(requestedSessionId);
}

function parseSseEvent(part: string): ChatStreamEvent | null {
  const line = part.split("\n").find((candidate) => candidate.startsWith("data: "));
  if (!line) {
    return null;
  }

  return JSON.parse(line.replace(/^data:\s*/, "")) as ChatStreamEvent;
}

function resolveRequestedSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = new URLSearchParams(window.location.search).get("session");
  if (!value || !isUuid(value)) {
    return null;
  }

  return value;
}

function cleanupRequestedSessionId() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore cleanup failures after local session is stored.
  }
}

function appendSessionToUrl(url: string, sessionId: string) {
  if (typeof window === "undefined") {
    return `${url}${url.includes("?") ? "&" : "?"}session=${encodeURIComponent(sessionId)}`;
  }

  const resolved = new URL(url, window.location.origin);
  resolved.searchParams.set("session", sessionId);
  return resolved.pathname + resolved.search + resolved.hash;
}

function storePageContextHandoff(sessionId: string, pageContext?: AssistantPageContext) {
  if (typeof window === "undefined" || !pageContext) {
    return;
  }

  try {
    window.sessionStorage.setItem(getPageContextStorageKey(sessionId), JSON.stringify(pageContext));
  } catch {
    // Ignore storage failures and continue with the session handoff only.
  }
}

function readStoredPageContext(sessionId: string): AssistantPageContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.sessionStorage.getItem(getPageContextStorageKey(sessionId));
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<AssistantPageContext>;
    if (
      typeof parsed.url === "string" &&
      typeof parsed.title === "string" &&
      typeof parsed.pathname === "string"
    ) {
      return {
        url: parsed.url,
        title: parsed.title,
        pathname: parsed.pathname,
        description: typeof parsed.description === "string" ? parsed.description : undefined,
        bodyText: typeof parsed.bodyText === "string" ? parsed.bodyText : undefined
      };
    }
  } catch {
    // Ignore malformed handoff payloads.
  }

  return undefined;
}

function getPageContextStorageKey(sessionId: string) {
  return `${PAGE_CONTEXT_HANDOFF_KEY}:${sessionId}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
