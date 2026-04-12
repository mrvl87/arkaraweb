export type AssistantMode = "site_guide_mode" | "page_context_mode" | "scenario_mode";

export type AssistantPageContext = {
  url: string;
  title: string;
  pathname: string;
  description?: string;
  bodyText?: string;
};

export type SessionResponse = {
  sessionId: string;
  isNew: boolean;
  expiresAt: string;
};

export type RuntimeSession = SessionResponse & {
  lastTouchedAt: string;
};

export type KnowledgeSource = {
  sourceId: string;
  sourceType: "post" | "guide";
  title: string;
  url: string;
  excerpt?: string;
  score: number;
};

export type ClientMessage = {
  id: string;
  sessionId: string;
  role: "system" | "user" | "assistant";
  content: string;
  mode?: AssistantMode;
  createdAt: string;
};

export type ChatStreamEvent =
  | {
      type: "meta";
      sessionId: string;
      assistantMessageId: string;
      model: string;
      mode: AssistantMode;
    }
  | {
      type: "delta";
      delta: string;
    }
  | {
      type: "sources";
      sources: KnowledgeSource[];
    }
  | {
      type: "done";
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
      durationMs: number;
    }
  | {
      type: "error";
      message: string;
      retryable?: boolean;
    };

export type ScenarioAnalyzerResponse = {
  analysisId: string;
  summary: string;
  priorityActions: string[];
  criticalRisks: string[];
  recommendedTools: string[];
  nextSteps24h: string[];
  knowledgeSources: KnowledgeSource[];
  disclaimer: string;
  followUpPrompt: string;
};

export type AssistantClientOptions = {
  apiBaseUrl: string;
  locale?: string;
  siteName?: string;
  assistantPageUrl?: string;
  storageKey?: string;
  initialMode?: AssistantMode;
  pageContext?: AssistantPageContext;
};

export type StartChatInput = {
  mode: AssistantMode;
  message: string;
  pageContext: AssistantPageContext;
};
