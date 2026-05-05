export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
  toolTrace?: ToolTrace[];
  error?: string;
};

export type ChatAction =
  | { type: "open_doc"; category: string; level: string; slug: string; title?: string }
  | { type: "highlight"; category: string; level: string; slug: string; query: string };

export type ToolTrace = {
  name: "search_docs" | "open_doc" | "highlight" | "list_chapters";
  args: Record<string, unknown>;
  resultPreview?: string;
  /**
   * For search_docs: the top scoring hit (if any), so the client can
   * auto-trigger a highlight when the model fails to chain into one.
   */
  topHit?: {
    category: string;
    level: string;
    slug: string;
    title: string;
  };
};

export type ChatRequest = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  locale?: "zh" | "en";
};

export type ChatUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ChatResponse =
  | {
      ok: true;
      text: string;
      actions: ChatAction[];
      toolTrace: ToolTrace[];
      /**
       * Aggregated upstream token usage and tool-call count, surfaced for
       * audit logging on the server. Not exposed in the SSE stream.
       */
      audit?: {
        model: string;
        toolCalls: number;
        usage: ChatUsage;
      };
    }
  | {
      ok: false;
      error: string;
      code: "not_configured" | "upstream_error" | "bad_request";
    };
