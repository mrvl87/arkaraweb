export const assistantStyles = `
:host {
  font-family: "Barlow", system-ui, sans-serif;
  color: #2a2218;
}

:host,
:host * {
  box-sizing: border-box;
}

.hidden {
  display: none !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.assistant-shell {
  --ink: #2a2218;
  --paper: #f0e8d0;
  --paper-strong: #faf4e7;
  --green: #86a786;
  --green-dark: #3d5c3d;
  --yellow: #d8c58a;
  --muted: #746a5c;
  --line: rgba(42, 34, 24, 0.12);
}

.assistant-shell--floating {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.assistant-shell--floating > * {
  pointer-events: auto;
}

.assistant-backdrop {
  position: fixed;
  inset: 0;
  border: none;
  background: rgba(42, 34, 24, 0.28);
  backdrop-filter: blur(3px);
  cursor: pointer;
}

.launcher-dock {
  position: fixed;
  right: 20px;
  bottom: 20px;
}

.launcher {
  display: grid;
  gap: 6px;
  width: 208px;
  padding: 12px 14px;
  border: 2px solid var(--green-dark);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.28), transparent 42%),
    linear-gradient(135deg, rgba(42, 34, 24, 0.98), rgba(61, 49, 36, 0.96));
  box-shadow: 0 18px 34px rgba(42, 34, 24, 0.26);
  color: var(--paper);
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.launcher:hover,
.prompt-card:hover,
.source-card:hover,
.assistant-tab:hover,
.utility-button:hover,
.ghost-link:hover,
.solid-button:hover,
.composer button:hover {
  transform: translateY(-1px);
}

.launcher__eyebrow,
.assistant-kicker,
.empty-state__eyebrow,
.sources-label,
.analyzer-card__eyebrow,
.source-card__type,
.bubble-meta {
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.launcher__eyebrow {
  color: var(--green);
}

.launcher__title,
.assistant-header h2,
.empty-state h3,
.analyzer-intro h3 {
  font-family: "Barlow Condensed", sans-serif;
  text-transform: none;
  letter-spacing: -0.01em;
}

.launcher__title {
  font-size: 1.05rem;
  line-height: 1;
  color: #f7f2e0;
}

.launcher__meta {
  color: rgba(240, 232, 208, 0.78);
  line-height: 1.35;
  font-size: 12px;
}

.assistant-panel {
  width: min(440px, calc(100vw - 24px));
  height: min(100dvh - 24px, 100%);
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(250, 244, 231, 0.98), rgba(240, 232, 208, 0.98));
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: 0 26px 54px rgba(42, 34, 24, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.assistant-shell--floating .assistant-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(440px, calc(100vw - 24px));
  height: auto;
  border-radius: 24px 0 0 24px;
}

.assistant-panel--page {
  width: 100%;
  max-height: none;
  height: auto;
}

.assistant-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 14px 10px;
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.22), transparent 36%),
    linear-gradient(160deg, var(--ink), #413628);
  color: var(--paper);
}

.assistant-header h2,
.assistant-header p,
.assistant-header a,
.empty-state h3,
.empty-state p,
.analyzer-intro h3,
.analyzer-intro p,
.analyzer-card h3,
.analyzer-card h4,
.analyzer-card p,
.analyzer-card ul {
  margin: 0;
}

.assistant-header__copy,
.assistant-stage,
.assistant-section,
.prompt-grid,
.empty-state,
.analyzer-intro,
.analyzer-form,
.analyzer-grid,
.source-list,
.sources,
.composer-shell {
  display: grid;
  gap: 12px;
}

.assistant-presence {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.assistant-presence__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(134, 167, 134, 0.18);
}

.assistant-header h2 {
  font-size: clamp(1.15rem, 1rem + 0.3vw, 1.4rem);
  line-height: 1.02;
}

.assistant-header p {
  color: rgba(240, 232, 208, 0.84);
  line-height: 1.32;
  max-width: 28ch;
  font-size: 12px;
}

.assistant-header__actions,
.assistant-tabs,
.assistant-footer,
.composer-actions {
  display: flex;
  gap: 10px;
}

.assistant-header__actions {
  align-items: flex-start;
  margin-left: auto;
}

.assistant-tabs {
  padding: 10px 14px 0;
}

.assistant-tab,
.utility-button,
.icon-button,
.handoff-button,
.ghost-link,
.solid-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px 15px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.assistant-tab,
.utility-button,
.icon-button,
.handoff-button,
.ghost-link {
  background: rgba(255, 251, 244, 0.78);
  border-color: rgba(42, 34, 24, 0.12);
  color: var(--muted);
}

.assistant-tab[data-active="true"],
.solid-button {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.icon-button {
  width: 34px;
  min-width: 34px;
  min-height: 34px;
  padding: 0;
  font-size: 0;
  line-height: 1;
}

.icon-button::before {
  content: "×";
  font-size: 18px;
  line-height: 1;
}

.handoff-button {
  min-width: 64px;
  min-height: 34px;
  padding: 0 16px;
  border-color: rgba(240, 232, 208, 0.28);
  background: rgba(255, 248, 236, 0.08);
  color: var(--paper);
}

.handoff-button svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.9;
  fill: none;
}

.assistant-stage {
  flex: 1;
  min-height: 0;
}

.assistant-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.conversation-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 8px 14px 4px;
}

.empty-state {
  padding: 10px 12px;
  border: 1px solid rgba(61, 92, 61, 0.18);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.26), transparent 42%),
    linear-gradient(180deg, rgba(247, 242, 224, 0.95), rgba(240, 232, 208, 0.9));
}

.empty-state h3 {
  font-size: 1rem;
  line-height: 1.08;
}

.empty-state p {
  color: #554a3f;
  line-height: 1.35;
  font-size: 12px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.messages.is-empty {
  display: none;
}

.bubble {
  display: grid;
  gap: 8px;
  max-width: 90%;
  padding: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px solid rgba(42, 34, 24, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 18px rgba(42, 34, 24, 0.06);
}

.bubble.user {
  align-self: flex-end;
  background: var(--ink);
  color: var(--paper);
  border-bottom-right-radius: 10px;
}

.bubble.assistant {
  align-self: flex-start;
  background: var(--paper-strong);
  color: var(--ink);
  border-bottom-left-radius: 10px;
}

.bubble-meta {
  color: var(--green-dark);
}

.bubble.user .bubble-meta {
  color: rgba(240, 232, 208, 0.74);
}

.bubble-copy {
  font-size: 13px;
}

.source-card,
.prompt-card,
.analyzer-card,
.analyzer-grid section {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(42, 34, 24, 0.08);
  border-radius: 16px;
  background: var(--paper-strong);
  color: var(--ink);
  text-decoration: none;
}

.source-card__type,
.empty-state__eyebrow,
.sources-label,
.analyzer-card__eyebrow {
  color: var(--green-dark);
}

.prompt-card {
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.prompt-card strong,
.source-card strong {
  font-size: 14px;
}

.prompt-card span,
.source-card span {
  color: var(--muted);
  line-height: 1.45;
  font-size: 13px;
}

.composer {
  padding: 0 14px 6px;
}

.composer-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(42, 34, 24, 0.08);
  border-radius: 16px;
  background: rgba(255, 250, 243, 0.96);
  box-shadow: 0 10px 24px rgba(42, 34, 24, 0.06);
}

.composer textarea,
.analyzer-form input,
.analyzer-form textarea {
  width: 100%;
  padding: 13px 14px;
  border: 2px solid var(--ink);
  background: #fffdf6;
  color: var(--ink);
  font: inherit;
}

.composer textarea {
  resize: none;
  min-height: 22px;
  max-height: 64px;
  border: none;
  padding: 0;
  outline: none;
  background: transparent;
  line-height: 1.35;
  font-size: 13px;
  overflow-y: auto;
  align-self: center;
}

.composer textarea::placeholder {
  color: #7a7064;
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border-top: none;
}

.composer button {
  min-width: 42px;
  width: 42px;
  height: 42px;
  min-height: 42px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  padding: 0;
}

.composer button svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  fill: none;
}

.analyzer-form button[type="submit"] {
  min-width: 120px;
  width: auto;
  height: auto;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
}

.status {
  margin: 0 14px 8px;
  padding: 7px 10px;
  border: 1px solid rgba(42, 34, 24, 0.08);
  border-radius: 14px;
  background: rgba(255, 249, 240, 0.84);
  font-size: 11px;
  color: var(--muted);
}

.status[data-tone="busy"] {
  color: #8c6b1f;
}

.status[data-tone="success"] {
  color: var(--green-dark);
}

.status[data-tone="danger"] {
  color: #8c3a3a;
}

.assistant-footer {
  justify-content: space-between;
  align-items: center;
  padding: 0 14px 8px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.35;
}

.assistant-footer .utility-button {
  min-height: 34px;
  padding: 8px 12px;
  font-size: 11px;
}

.analyzer-intro,
.analyzer-form,
.analyzer-output {
  padding: 0 18px 18px;
}

.analyzer-intro p {
  color: var(--muted);
  line-height: 1.6;
}

.analyzer-form textarea {
  min-height: 110px;
  resize: vertical;
}

.analyzer-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.analyzer-note {
  padding: 12px 14px;
  border: 1px solid rgba(216, 197, 138, 0.42);
  border-radius: 16px;
  background: rgba(216, 197, 138, 0.18);
}

.analyzer-follow-up {
  padding: 14px;
  border: 1px solid rgba(134, 167, 134, 0.3);
  border-radius: 16px;
  background: var(--ink);
  color: var(--paper);
}

@media (max-width: 768px) {
  .assistant-shell--floating {
    inset: 0;
  }

  .assistant-shell--floating .assistant-panel {
    top: 12px;
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    border-radius: 20px;
  }

  .assistant-header,
  .assistant-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .assistant-tabs,
  .composer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .assistant-header {
    padding: 10px 10px 8px;
    gap: 10px;
  }

  .assistant-header__copy {
    gap: 8px;
  }

  .assistant-header h2 {
    font-size: 1rem;
  }

  .assistant-header p {
    font-size: 11px;
    max-width: none;
  }

  .assistant-kicker,
  .empty-state__eyebrow,
  .sources-label,
  .analyzer-card__eyebrow,
  .source-card__type,
  .bubble-meta {
    font-size: 10px;
  }

  .assistant-header__actions {
    position: absolute;
    top: 10px;
    right: 10px;
    margin-left: 0;
    gap: 8px;
    align-items: center;
  }

  .handoff-button {
    min-width: 54px;
    min-height: 28px;
    padding: 0 12px;
  }

  .handoff-button svg {
    width: 16px;
    height: 16px;
  }

  .icon-button {
    width: 30px !important;
    min-width: 30px;
    min-height: 30px;
    height: 30px;
  }

  .icon-button::before {
    font-size: 16px;
  }

  .launcher-dock {
    justify-items: stretch;
  }

  .assistant-header__actions > *,
  .launcher {
    width: 100%;
  }

  .bubble {
    max-width: 96%;
  }

  .conversation-scroll {
    padding: 6px 10px 2px;
  }

  .composer {
    padding: 0 10px 4px;
  }

  .composer-shell {
    padding: 6px 8px;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .composer textarea {
    min-height: 20px;
    max-height: 56px;
    font-size: 12px;
  }

  .composer-actions {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  .composer button {
    width: 38px;
    min-width: 38px;
    height: 38px;
    min-height: 38px;
  }

  .composer button svg {
    width: 16px;
    height: 16px;
  }

  .status {
    margin: 0 10px 6px;
    padding: 6px 8px;
    font-size: 10px;
  }

  .assistant-footer {
    padding: 0 10px 6px;
    font-size: 10px;
  }

  .assistant-footer .utility-button {
    min-height: 30px;
    padding: 6px 10px;
    font-size: 10px;
  }
}
`;

