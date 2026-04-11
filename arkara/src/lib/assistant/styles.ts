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
  right: 20px;
  bottom: 20px;
  z-index: 9999;
}

.launcher-dock {
  display: grid;
  gap: 12px;
  justify-items: end;
}

.launcher {
  display: grid;
  gap: 6px;
  min-width: 238px;
  padding: 16px 18px;
  border: 2px solid var(--green-dark);
  border-radius: 18px;
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
  font-size: 1.55rem;
  line-height: 1;
  color: #f7f2e0;
}

.launcher__meta {
  color: rgba(240, 232, 208, 0.78);
  line-height: 1.45;
  font-size: 13px;
}

.launcher-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 14px;
  border: 1px solid rgba(61, 92, 61, 0.32);
  border-radius: 999px;
  background: rgba(240, 232, 208, 0.82);
  color: var(--ink);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.assistant-panel {
  width: min(420px, calc(100vw - 24px));
  max-height: min(80vh, 760px);
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(250, 244, 231, 0.98), rgba(240, 232, 208, 0.98));
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: 0 26px 54px rgba(42, 34, 24, 0.22);
  overflow: hidden;
}

.assistant-panel--page {
  width: 100%;
  max-height: none;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 20px 16px;
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
  font-size: clamp(1.6rem, 1.35rem + 0.7vw, 2rem);
  line-height: 1.02;
}

.assistant-header p {
  color: rgba(240, 232, 208, 0.84);
  line-height: 1.55;
  max-width: 34ch;
}

.assistant-header__actions,
.assistant-tabs,
.assistant-footer,
.composer-actions {
  display: flex;
  gap: 10px;
}

.assistant-tabs {
  padding: 14px 16px 0;
}

.assistant-tab,
.utility-button,
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

.empty-state {
  margin: 16px 16px 6px;
  padding: 18px;
  border: 1px solid rgba(61, 92, 61, 0.18);
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(216, 197, 138, 0.26), transparent 42%),
    linear-gradient(180deg, rgba(247, 242, 224, 0.95), rgba(240, 232, 208, 0.9));
}

.empty-state h3 {
  font-size: 1.45rem;
  line-height: 1.08;
}

.empty-state p {
  color: #554a3f;
  line-height: 1.6;
}

.messages {
  min-height: 260px;
  max-height: 440px;
  overflow: auto;
  padding: 10px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(240, 231, 214, 0.92)),
    radial-gradient(circle at top, rgba(255, 245, 228, 0.55), transparent 40%);
}

.messages.is-empty {
  min-height: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
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
  font-size: 14px;
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
  padding: 0 16px 16px;
}

.composer-shell {
  padding: 12px;
  border: 1px solid rgba(42, 34, 24, 0.08);
  border-radius: 18px;
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
  min-height: 96px;
  max-height: 168px;
  border: none;
  padding: 0;
  outline: none;
  background: transparent;
  line-height: 1.6;
}

.composer textarea::placeholder {
  color: #7a7064;
}

.composer-actions {
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px solid rgba(42, 34, 24, 0.08);
}

.composer-hint {
  color: var(--muted);
  font-size: 12px;
}

.composer button,
.analyzer-form button[type="submit"] {
  min-width: 108px;
  min-height: 42px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
}

.status {
  margin: 0 16px 12px;
  padding: 10px 12px;
  border: 1px solid rgba(42, 34, 24, 0.08);
  border-radius: 14px;
  background: rgba(255, 249, 240, 0.84);
  font-size: 12px;
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
  padding: 0 16px 18px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
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
    right: 12px;
    left: 12px;
    bottom: 12px;
  }

  .assistant-panel {
    width: 100%;
  }

  .assistant-header,
  .assistant-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .assistant-header__actions,
  .assistant-tabs,
  .composer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .launcher-dock {
    justify-items: stretch;
  }

  .composer button,
  .assistant-header__actions > *,
  .launcher,
  .launcher-link {
    width: 100%;
  }

  .bubble {
    max-width: 96%;
  }
}
`;
