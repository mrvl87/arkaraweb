export const assistantStyles = `
:host {
  font-family: "Barlow", system-ui, sans-serif;
  color: #2a2218;
}

:host, :host * {
  box-sizing: border-box;
}

.hidden { display: none !important; }
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
  --paper-strong: #f7f2e0;
  --green: #8faf8f;
  --green-dark: #3d5c3d;
  --yellow: #d8c58a;
  --muted: #746a5c;
}

.assistant-shell--floating {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
}

.launcher {
  display: grid;
  gap: 2px;
  min-width: 188px;
  padding: 14px 18px;
  border: 2px solid var(--green);
  background: linear-gradient(135deg, var(--ink), #3a3124);
  box-shadow: 5px 5px 0 var(--green-dark);
  color: var(--paper);
  cursor: pointer;
}

.launcher__title,
.assistant-header h2,
.empty-state h3,
.analyzer-intro h3 {
  font-family: "Barlow Condensed", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.launcher__meta,
.assistant-kicker,
.empty-state__eyebrow,
.sources-label,
.analyzer-card__eyebrow {
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.assistant-panel {
  width: min(420px, calc(100vw - 24px));
  background: var(--paper);
  border: 3px solid var(--ink);
  box-shadow: 8px 8px 0 var(--ink);
  overflow: hidden;
}

.assistant-panel--page {
  width: 100%;
}

.assistant-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: linear-gradient(160deg, var(--ink), #413628);
  color: var(--paper);
  border-bottom: 3px solid var(--green);
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

.assistant-header__actions,
.assistant-tabs,
.assistant-footer {
  display: flex;
  gap: 10px;
}

.assistant-tabs {
  padding: 14px 18px 0;
}

.assistant-tab,
.utility-button,
.ghost-link,
.solid-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 10px 14px;
  border: 2px solid;
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
}

.assistant-tab,
.utility-button,
.ghost-link {
  background: transparent;
  border-color: var(--ink);
  color: var(--ink);
}

.assistant-tab[data-active="true"],
.solid-button {
  background: var(--ink);
  border-color: var(--green);
  color: var(--green);
}

.assistant-stage,
.assistant-section,
.prompt-grid,
.empty-state,
.analyzer-intro,
.analyzer-form,
.analyzer-grid,
.source-list,
.sources {
  display: grid;
  gap: 12px;
}

.empty-state {
  margin: 18px;
  padding: 18px;
  border: 2px dashed var(--green-dark);
  background: rgba(216, 197, 138, 0.2);
}

.messages {
  min-height: 260px;
  max-height: 420px;
  overflow: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background:
    linear-gradient(rgba(143, 175, 143, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(143, 175, 143, 0.04) 1px, transparent 1px),
    var(--paper);
  background-size: 24px 24px, 24px 24px, auto;
}

.messages.is-empty {
  min-height: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.bubble {
  display: grid;
  gap: 12px;
  max-width: 92%;
  padding: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 2px solid var(--ink);
}

.bubble.user {
  align-self: flex-end;
  background: var(--ink);
  color: var(--paper);
}

.bubble.assistant {
  align-self: flex-start;
  background: var(--paper-strong);
  color: var(--ink);
}

.source-card,
.prompt-card,
.analyzer-card,
.analyzer-grid section {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 2px solid var(--ink);
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

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 14px 18px;
  border-top: 2px solid var(--ink);
  background: var(--paper-strong);
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
  min-height: 66px;
  max-height: 140px;
}

.composer button {
  min-width: 96px;
  border: 2px solid var(--green);
  background: var(--ink);
  color: var(--green);
  font-family: "Share Tech Mono", monospace;
  cursor: pointer;
}

.status {
  padding: 0 18px 12px;
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  color: var(--muted);
}

.status[data-tone="busy"] { color: #8c6b1f; }
.status[data-tone="success"] { color: var(--green-dark); }
.status[data-tone="danger"] { color: #8c3a3a; }

.assistant-footer {
  justify-content: space-between;
  align-items: center;
  padding: 0 18px 18px;
  color: var(--muted);
  font-size: 12px;
}

.analyzer-intro,
.analyzer-form,
.analyzer-output {
  padding: 0 18px 18px;
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
  border: 2px solid var(--yellow);
  background: rgba(216, 197, 138, 0.18);
}

.analyzer-follow-up {
  padding: 14px;
  border: 2px solid var(--green);
  background: var(--ink);
  color: var(--paper);
}

@media (max-width: 768px) {
  .assistant-shell--floating {
    right: 12px;
    bottom: 12px;
  }

  .assistant-panel {
    width: calc(100vw - 24px);
  }

  .assistant-header,
  .assistant-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .assistant-header__actions,
  .assistant-tabs {
    flex-direction: column;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer button,
  .assistant-header__actions > * {
    width: 100%;
  }
}
`;
