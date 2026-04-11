import type {
  AssistantClientOptions,
  AssistantMode,
  AssistantPageContext,
  ChatStreamEvent,
  ClientMessage,
  KnowledgeSource,
  ScenarioAnalyzerResponse
} from "./contracts";
import { buildAssistantPageUrl, createAssistantClient } from "./client";
import { assistantStyles } from "./styles";

export type AssistantRenderVariant = "floating" | "page";

type RenderOptions = AssistantClientOptions & {
  root: ShadowRoot | HTMLElement;
  variant: AssistantRenderVariant;
};

type PromptStarter = {
  label: string;
  prompt: string;
};

type BubbleHandle = {
  element: HTMLElement;
  copy: HTMLElement;
  sources: HTMLElement | null;
};

export function renderAssistantExperience(options: RenderOptions) {
  const client = createAssistantClient(options);
  const mode = resolveAssistantMode(options);
  const pageContext = resolvePageContext(options);
  const mount = document.createElement("div");
  mount.innerHTML = createShellMarkup({
    variant: options.variant,
    assistantPageUrl: options.assistantPageUrl ?? "/assistant",
    siteName: options.siteName ?? "Arkara",
    mode,
    promptStarters: getPromptStarters(mode)
  });

  const style = document.createElement("style");
  style.textContent = assistantStyles;
  options.root.innerHTML = "";
  options.root.append(style, mount);

  const launcherDock = mount.querySelector<HTMLElement>("[data-launcher-dock]");
  const launcher = mount.querySelector<HTMLButtonElement>("[data-launcher]");
  const backdrop = mount.querySelector<HTMLButtonElement>("[data-backdrop]");
  const closeButton = mount.querySelector<HTMLButtonElement>("[data-close]");
  const panel = query<HTMLElement>(mount, "[data-panel]");
  const messagesContainer = query<HTMLElement>(mount, "[data-messages]");
  const composer = query<HTMLTextAreaElement>(mount, "[data-composer]");
  const sendButton = query<HTMLButtonElement>(mount, "[data-send]");
  const resetButton = query<HTMLButtonElement>(mount, "[data-reset]");
  const status = query<HTMLElement>(mount, "[data-status]");
  const assistantLink = mount.querySelector<HTMLAnchorElement>("[data-assistant-link]");
  const emptyState = query<HTMLElement>(mount, "[data-empty-state]");
  const promptButtons = Array.from(mount.querySelectorAll<HTMLButtonElement>("[data-prompt]"));
  const analyzerForm = mount.querySelector<HTMLFormElement>("[data-analyzer-form]");
  const analyzerOutput = mount.querySelector<HTMLElement>("[data-analyzer-output]");
  const tabButtons = Array.from(mount.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const sections = Array.from(mount.querySelectorAll<HTMLElement>("[data-section]"));

  let isOpen = options.variant === "page";
  let lastAssistantBubble: BubbleHandle | null = null;
  let hasDone = false;
  let hasMessages = false;
  let activeTab = "chat";

  function setStatus(
    text: string,
    tone: "neutral" | "busy" | "success" | "danger" = "neutral"
  ) {
    status.textContent = text;
    status.dataset.tone = tone;
  }

  function setPendingState(isPending: boolean) {
    sendButton.disabled = isPending;
    composer.disabled = isPending;
    resetButton.disabled = isPending;
  }

  function setPanelState(nextOpen: boolean) {
    if (options.variant !== "floating") {
      panel.classList.remove("hidden");
      return;
    }

    isOpen = nextOpen;
    panel.classList.toggle("hidden", !isOpen);
    backdrop?.classList.toggle("hidden", !isOpen);
    launcherDock?.classList.toggle("hidden", isOpen);
  }

  function setActiveTab(nextTab: string) {
    activeTab = nextTab;
    for (const button of tabButtons) {
      button.dataset.active = String(button.dataset.tab === nextTab);
    }
    for (const section of sections) {
      section.classList.toggle("hidden", section.dataset.section !== nextTab);
    }
  }

  function syncEmptyState() {
    emptyState.classList.toggle("hidden", hasMessages);
    messagesContainer.classList.toggle("is-empty", !hasMessages);
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendBubble(role: "user" | "assistant", content: string): BubbleHandle {
    const bubble = document.createElement("article");
    bubble.className = `bubble ${role}`;
    bubble.dataset.role = role;

    const meta = document.createElement("div");
    meta.className = "bubble-meta";
    meta.textContent = role === "assistant" ? "Arkara AI" : "Anda";
    bubble.appendChild(meta);

    const copy = document.createElement("div");
    copy.className = "bubble-copy";
    copy.textContent = content;
    bubble.appendChild(copy);

    const sources = role === "assistant" ? document.createElement("div") : null;
    if (sources) {
      bubble.appendChild(sources);
    }

    messagesContainer.appendChild(bubble);
    hasMessages = true;
    syncEmptyState();
    scrollToBottom();
    return { element: bubble, copy, sources };
  }

  async function hydrateHistory() {
    try {
      const messages = await client.loadMessages();
      renderHistory(messages);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gagal memuat riwayat.", "danger");
    }
  }

  function renderHistory(messages: ClientMessage[]) {
    messagesContainer.innerHTML = "";
    hasMessages = false;

    for (const message of messages) {
      if (message.role === "system") continue;
      appendBubble(message.role === "assistant" ? "assistant" : "user", message.content);
    }

    syncEmptyState();
    setStatus(
      hasMessages ? "Riwayat percakapan dimuat." : "Pilih prompt pembuka atau mulai bertanya.",
      hasMessages ? "success" : "neutral"
    );
  }

  async function handleSend(prefilledMessage?: string) {
    const message = (prefilledMessage ?? composer.value).trim();
    if (!message) return;

    setPanelState(true);
    setActiveTab("chat");
    appendBubble("user", message);
    composer.value = "";
    setPendingState(true);
    setStatus("Menghubungkan ke Arkara AI...", "busy");
    lastAssistantBubble = appendBubble("assistant", "");
    hasDone = false;

    try {
      await client.streamChat(
        { mode, message, pageContext },
        {
          onEvent(event: ChatStreamEvent) {
            if (!lastAssistantBubble) return;

            switch (event.type) {
              case "meta":
                setStatus("Koneksi aktif. Assistant sedang membaca konteks...", "busy");
                break;
              case "delta":
                lastAssistantBubble.copy.textContent += event.delta;
                setStatus("Assistant sedang menyiapkan jawaban...", "busy");
                scrollToBottom();
                break;
              case "sources":
                if (lastAssistantBubble.sources) {
                  lastAssistantBubble.sources.innerHTML = renderSourcesMarkup(event.sources);
                }
                break;
              case "done":
                hasDone = true;
                setStatus(
                  `Selesai dalam ${Math.round(event.durationMs / 100) / 10} detik.`,
                  "success"
                );
                break;
              case "error":
                setStatus(event.message, "danger");
                if (!lastAssistantBubble.copy.textContent?.trim()) {
                  lastAssistantBubble.copy.textContent =
                    "Assistant sedang bermasalah. Coba lagi sebentar.";
                }
                break;
            }
          }
        }
      );

      if (!hasDone) {
        setStatus("Respons tersimpan sebagian. Anda bisa lanjutkan percakapan.", "neutral");
      }
    } catch (error) {
      if (lastAssistantBubble && !lastAssistantBubble.copy.textContent?.trim()) {
        lastAssistantBubble.copy.textContent = "Assistant belum bisa menjawab saat ini.";
      }
      setStatus(error instanceof Error ? error.message : "Gagal memulai assistant.", "danger");
    } finally {
      setPendingState(false);
      composer.focus();
    }
  }

  async function handleReset() {
    setPendingState(true);
    try {
      await client.resetSession();
      messagesContainer.innerHTML = "";
      hasMessages = false;
      syncEmptyState();
      await hydrateHistory();
      setStatus("Sesi baru dibuat.", "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Gagal mereset sesi.", "danger");
    } finally {
      setPendingState(false);
    }
  }

  async function handleAnalyzerSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!analyzerForm || !analyzerOutput) return;

    const data = new FormData(analyzerForm);
    analyzerOutput.innerHTML = `<div class="analyzer-card">Menganalisis kondisi Anda...</div>`;

    try {
      const response = await client.analyzeScenario({
        threatType: String(data.get("threatType") ?? ""),
        locationType: String(data.get("locationType") ?? ""),
        electricityStatus: String(data.get("electricityStatus") ?? ""),
        waterStatus: String(data.get("waterStatus") ?? ""),
        householdSize: Number(data.get("householdSize") ?? 1),
        availableTools: String(data.get("availableTools") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        medicalConstraints: String(data.get("medicalConstraints") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        goal: String(data.get("goal") ?? ""),
        freeTextNotes: String(data.get("freeTextNotes") ?? "")
      });

      analyzerOutput.innerHTML = createAnalyzerResultMarkup(response);
      composer.value = response.followUpPrompt;
      setStatus("Analisis selesai. Lanjutkan di panel chat.", "success");
    } catch (error) {
      analyzerOutput.innerHTML = `<div class="analyzer-card">${escapeHtml(
        error instanceof Error ? error.message : "Analisis gagal."
      )}</div>`;
      setStatus("Analisis gagal. Periksa input Anda.", "danger");
    }
  }

  launcher?.addEventListener("click", () => setPanelState(true));
  backdrop?.addEventListener("click", () => setPanelState(false));
  closeButton?.addEventListener("click", () => setPanelState(false));
  sendButton.addEventListener("click", () => void handleSend());
  composer.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  });
  resetButton.addEventListener("click", () => void handleReset());

  for (const button of promptButtons) {
    button.addEventListener("click", () => {
      composer.value = button.dataset.prompt ?? "";
      void handleSend(button.dataset.prompt);
    });
  }

  for (const button of tabButtons) {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab ?? "chat"));
  }

  assistantLink?.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const href = await buildAssistantPageUrl({ ...options, initialMode: mode, pageContext });
      window.location.href = href;
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal menyiapkan halaman assistant.",
        "danger"
      );
    }
  });

  if (analyzerForm) {
    analyzerForm.addEventListener("submit", (event) => void handleAnalyzerSubmit(event as SubmitEvent));
  }

  setPanelState(isOpen);
  setActiveTab(activeTab);
  syncEmptyState();
  void hydrateHistory();
}

export function resolveAssistantMode(
  options: Pick<AssistantClientOptions, "initialMode">,
  pathname = window.location.pathname
): AssistantMode {
  if (options.initialMode) return options.initialMode;
  if (pathname.includes("/assistant")) return "scenario_mode";
  if (pathname.startsWith("/blog/") || pathname.startsWith("/panduan/")) return "page_context_mode";
  return "site_guide_mode";
}

export function resolvePageContext(
  options: Pick<AssistantClientOptions, "pageContext" | "siteName">,
  fallback: AssistantPageContext = {
    url: window.location.href,
    title: document.title || options.siteName || "Arkara",
    pathname: window.location.pathname
  }
) {
  return options.pageContext ?? fallback;
}

function getPromptStarters(mode: AssistantMode): PromptStarter[] {
  switch (mode) {
    case "page_context_mode":
      return [
        { label: "Ringkas Artikel", prompt: "Ringkas artikel ini menjadi 3 poin tindakan paling penting." },
        { label: "Langkah Lanjut", prompt: "Apa tindak lanjut paling realistis dari halaman yang sedang saya baca?" },
        { label: "Checklist Cepat", prompt: "Buat checklist cepat berdasarkan panduan ini." }
      ];
    case "scenario_mode":
      return [
        { label: "Prioritas 24 Jam", prompt: "Bantu saya menyusun prioritas tindakan survival 24 jam ke depan." },
        { label: "Cek Risiko", prompt: "Identifikasi risiko paling kritis dari kondisi saya saat ini." },
        { label: "Logistik Dasar", prompt: "Buat daftar kebutuhan air, cahaya, dan alat yang harus saya cek sekarang." }
      ];
    default:
      return [
        { label: "Mulai dari Nol", prompt: "Saya pemula. Ajarkan prinsip survival dasar yang paling penting." },
        { label: "Kit Darurat", prompt: "Apa isi minimal emergency kit yang realistis untuk rumah tangga kecil?" },
        { label: "Persiapan Rumah", prompt: "Bantu saya membuat checklist persiapan rumah untuk krisis dasar." }
      ];
  }
}

function renderSourcesMarkup(sources: KnowledgeSource[]) {
  if (sources.length === 0) return "";
  return `
    <div class="sources">
      <div class="sources-label">Rujukan Arkara</div>
      <div class="source-list">
        ${sources.map((source) => `
          <a class="source-card" href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">
            <span class="source-card__type">${source.sourceType === "guide" ? "Guide" : "Post"}</span>
            <strong>${escapeHtml(source.title)}</strong>
            <span>${escapeHtml(source.excerpt ?? "Buka sumber untuk detail Arkara terkait topik ini.")}</span>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function createAnalyzerResultMarkup(response: ScenarioAnalyzerResponse) {
  return `
    <div class="analyzer-card">
      <div class="analyzer-card__eyebrow">Scenario Analyzer</div>
      <h3>Ringkasan Kondisi</h3>
      <p>${escapeHtml(response.summary)}</p>
      <div class="analyzer-grid">
        <section><h4>Prioritas Tindakan</h4><ul>${response.priorityActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
        <section><h4>Risiko Kritis</h4><ul>${response.criticalRisks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
        <section><h4>Langkah 24 Jam</h4><ul>${response.nextSteps24h.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
        <section><h4>Tools Disarankan</h4><ul>${response.recommendedTools.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      </div>
      <p class="analyzer-note">${escapeHtml(response.disclaimer)}</p>
      <div class="analyzer-follow-up"><strong>Prompt tindak lanjut</strong><p>${escapeHtml(response.followUpPrompt)}</p></div>
      ${response.knowledgeSources.length > 0 ? renderSourcesMarkup(response.knowledgeSources) : ""}
    </div>
  `;
}

function query<TElement extends Element>(root: ParentNode, selector: string): TElement {
  const element = root.querySelector<TElement>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function getModeLabel(mode: AssistantMode) {
  return mode === "page_context_mode" ? "Page context mode" : mode === "scenario_mode" ? "Scenario mode" : "Site guide mode";
}

function getModeDescription(mode: AssistantMode) {
  return mode === "page_context_mode"
    ? "Jawaban diprioritaskan untuk menjelaskan konteks halaman aktif dan langkah lanjut praktis."
    : mode === "scenario_mode"
      ? "Percakapan difokuskan pada prioritas tindakan, risiko, dan tindak lanjut lapangan."
      : "Gunakan untuk pertanyaan survival umum, persiapan rumah, dan orientasi awal Arkara.";
}

function getCompactModeDescription(mode: AssistantMode) {
  return mode === "page_context_mode"
    ? "Ringkas halaman ini atau minta checklist yang paling relevan."
    : mode === "scenario_mode"
      ? "Petakan prioritas, risiko, dan keputusan awal yang perlu diambil."
      : "Untuk ringkasan cepat, checklist, dan langkah awal yang lebih jelas.";
}

function createShellMarkup(input: {
  variant: AssistantRenderVariant;
  assistantPageUrl: string;
  siteName: string;
  mode: AssistantMode;
  promptStarters: PromptStarter[];
}) {
  const isFloating = input.variant === "floating";
  return `
    <section class="assistant-shell assistant-shell--${input.variant}">
      ${isFloating ? `<button class="assistant-backdrop hidden" type="button" data-backdrop aria-label="Tutup assistant"></button>` : ""}
      ${isFloating ? `
        <div class="launcher-dock" data-launcher-dock>
          <button class="launcher" type="button" data-launcher>
            <span class="launcher__eyebrow">Arkara AI Assistant</span>
            <span class="launcher__title">Buka assistant</span>
            <span class="launcher__meta">Checklist, ringkasan, dan langkah cepat dari halaman ini.</span>
          </button>
        </div>
      ` : ""}
      <section class="${isFloating ? "assistant-panel hidden" : "assistant-panel assistant-panel--page"}" data-panel>
        <header class="assistant-header">
          <div class="assistant-header__copy">
            <div class="assistant-presence">
              <span class="assistant-presence__dot"></span>
              <span class="assistant-kicker">${isFloating ? "Siap membantu sekarang" : "Ruang bantu yang lebih fokus"}</span>
            </div>
            <h2>${input.siteName} AI Assistant</h2>
            <p>${isFloating ? getCompactModeDescription(input.mode) : getModeDescription(input.mode)}</p>
          </div>
          <div class="assistant-header__actions">
            ${isFloating ? `<button class="icon-button" type="button" data-close aria-label="Tutup assistant">×</button>` : `<a class="ghost-link" href="${escapeAttribute(input.assistantPageUrl)}">Rute kanonik</a><a class="solid-button" data-assistant-link href="${escapeAttribute(input.assistantPageUrl)}">Bagikan sesi</a>`}
          </div>
        </header>
        ${isFloating ? "" : `<nav class="assistant-tabs" aria-label="Assistant sections"><button type="button" class="assistant-tab" data-tab="chat" data-active="true">Percakapan</button><button type="button" class="assistant-tab" data-tab="analyzer" data-active="false">Scenario Analyzer</button></nav>`}
        <div class="assistant-stage">
          <section class="assistant-section" data-section="chat">
            <div class="conversation-scroll" data-conversation-scroll>
              <section class="empty-state" data-empty-state>
                <div class="empty-state__eyebrow">${getModeLabel(input.mode)}</div>
                <h3>${isFloating ? "Mulai dari pertanyaan yang paling mendesak." : "Mari mulai dari konteks yang paling penting buat Anda."}</h3>
                <p>Assistant menjaga sesi tetap nyambung lintas halaman dan bisa memakai konteks artikel atau panduan yang sedang Anda baca.</p>
                <div class="prompt-grid">
                  ${input.promptStarters.map((starter) => `<button class="prompt-card" type="button" data-prompt="${escapeAttribute(starter.prompt)}"><strong>${escapeHtml(starter.label)}</strong><span>${escapeHtml(starter.prompt)}</span></button>`).join("")}
                </div>
              </section>
              <div class="messages" data-messages></div>
            </div>
            <div class="status" data-status data-tone="neutral">Memuat sesi...</div>
            <div class="composer">
              <div class="composer-shell">
                <label class="sr-only" for="arkara-assistant-composer">Pesan assistant</label>
                <textarea id="arkara-assistant-composer" data-composer placeholder="Tulis kebutuhan Anda sekarang."></textarea>
                <div class="composer-actions">
                  <button type="button" data-send aria-label="Kirim pesan">
                    <span class="sr-only">Kirim</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M3 11.5L20 4l-4.5 16-4.2-6.1L3 11.5Z"></path>
                      <path d="M11.1 13.9L20 4"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="assistant-footer">
              <span>Fokus pada langkah aman, jelas, dan realistis untuk Anda lakukan sekarang.</span>
              <button class="utility-button" type="button" data-reset>Mulai sesi baru</button>
            </div>
          </section>
          ${isFloating ? "" : `<section class="assistant-section hidden" data-section="analyzer"><div class="analyzer-intro"><div class="assistant-kicker">Structured assessment</div><h3>Scenario Analyzer</h3><p>Gunakan panel ini saat situasi Anda sudah cukup spesifik. Hasilnya akan membantu merangkum risiko, prioritas, dan tindak lanjut ke chat.</p></div><form class="analyzer-form" data-analyzer-form><input name="threatType" placeholder="Ancaman utama, mis. banjir atau gempa" required /><input name="locationType" placeholder="Tipe lokasi, mis. permukiman padat" required /><input name="electricityStatus" placeholder="Status listrik saat ini" required /><input name="waterStatus" placeholder="Status air bersih" required /><input name="householdSize" type="number" min="1" max="50" value="1" required /><input name="availableTools" placeholder="Alat tersedia, pisahkan dengan koma" required /><input name="medicalConstraints" placeholder="Kondisi medis penting, opsional" /><input name="goal" placeholder="Target utama 24 jam" required /><textarea name="freeTextNotes" placeholder="Catatan tambahan yang perlu dipertimbangkan"></textarea><button class="solid-button" type="submit">Analisis kondisi</button></form><div class="analyzer-output" data-analyzer-output></div></section>`}
        </div>
      </section>
    </section>
  `;
}
