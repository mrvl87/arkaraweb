import type { AssistantMode, AssistantClientOptions } from "./contracts";
import { buildAssistantPageUrl } from "./client";
import { renderAssistantExperience } from "./ui";

export { buildAssistantPageUrl };
export type { AssistantClientOptions } from "./contracts";

export class ArkaraAssistantWidget extends HTMLElement {
  connectedCallback() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    renderAssistantExperience({
      root,
      variant: "floating",
      apiBaseUrl: this.getAttribute("api-base-url") ?? "",
      locale: this.getAttribute("locale") ?? "id-ID",
      siteName: this.getAttribute("site-name") ?? "Arkara",
      assistantPageUrl: this.getAttribute("assistant-page-url") ?? "/assistant",
      initialMode: readAssistantMode(this.getAttribute("initial-mode")),
      pageContext: resolvePageContextFromAttributes(this)
    });
  }
}

export function defineAssistantWidget(tagName = "arkara-assistant-widget") {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ArkaraAssistantWidget);
  }
}

export function mountAssistantPage(container: HTMLElement, options: AssistantClientOptions) {
  renderAssistantExperience({
    root: container,
    variant: "page",
    ...options
  });
}

defineAssistantWidget();

function resolvePageContextFromAttributes(element: HTMLElement) {
  const hasExplicitContext =
    element.hasAttribute("context-url") ||
    element.hasAttribute("context-title") ||
    element.hasAttribute("context-pathname");

  if (!hasExplicitContext) {
    return undefined;
  }

  return {
    url: element.getAttribute("context-url") ?? window.location.href,
    title: element.getAttribute("context-title") ?? document.title,
    pathname: element.getAttribute("context-pathname") ?? window.location.pathname
  };
}

function readAssistantMode(value: string | null): AssistantMode | undefined {
  if (
    value === "site_guide_mode" ||
    value === "page_context_mode" ||
    value === "scenario_mode"
  ) {
    return value;
  }

  return undefined;
}
