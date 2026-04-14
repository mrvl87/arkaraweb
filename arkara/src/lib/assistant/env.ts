const LOCAL_ASSISTANT_API_URL = "http://localhost:8787";

export function getAssistantApiBaseUrl() {
  const value = import.meta.env.PUBLIC_ASSISTANT_API_URL?.trim();
  if (value) {
    return value.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return LOCAL_ASSISTANT_API_URL;
  }

  throw new Error(
    "PUBLIC_ASSISTANT_API_URL is required for production builds of the assistant frontend."
  );
}
