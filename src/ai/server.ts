import OpenAI from "openai";
import { runTool, toolDefinitions } from "./tools";
import type { ChatAction, ChatRequest, ChatResponse, ToolTrace } from "./types";

const SYSTEM_ZH = `你是 ArcLibrary（个人知识库）内置的 AI 助手。

# 工具使用准则（强约束，必须遵守）

1. 只要用户在问"什么是 X / X 是怎么工作的 / X 怎么配置 / 给我讲讲 X / 我想看 X / 关于 X / 跳转到 X" 这类**与站内主题相关**的问题：
   - **第一步：调用 \`search_docs\` 检索站内文档。**
   - **第二步：从 search_docs 结果里挑命中最高的一篇，直接调用 \`highlight\`**（不是 \`open_doc\`），\`query\` 用用户提到的关键词或最贴近的原文片段。**这是默认行为，不要等用户确认，不要先问"要不要打开"。**
2. 仅在用户**明确**表达 "只是打开页面 / 不需要定位某句话" 时，才退化为 \`open_doc\`。否则一律使用 \`highlight\`，因为它能把用户直接带到具体段落并高亮。
3. \`highlight\` 的 \`query\` 字段：
   - 优先使用用户原话中的关键词（中文 2~12 个字，英文 1~5 个词最佳）。
   - 不要塞整段长句，命中率会变低；如果用户只问一个名词，就用那个名词本身。
4. 如果 \`search_docs\` 没有命中，或站内确实没有这篇：用一两句给概念解释，**并明确告知** "目前知识库里还没有这一篇"，不要硬调 \`highlight\`。
5. 不要凭印象编造文档路径；分类只能从 \`ai / network / ops\` 里选，level 只能从 \`beginner / advanced / ecosystem\` 里选。

# 回答风格

- 简洁、有条理；可使用 markdown（标题、列表、代码块）。
- 引用站内文档时给出 markdown 链接：\`[标题](/category/level/slug)\`。
- 永远使用与用户相同的语言（中文 / 英文）。`;

const SYSTEM_EN = `You are the AI assistant embedded in ArcLibrary (a personal wiki on AI / networking / ops).

# Tool-use rules (HARD constraints — follow exactly)

1. Whenever the user asks about a wiki-relevant topic ("what is X / how does X work / show me X / take me to X / about X / I want to see X"):
   - **Step 1: call \`search_docs\` first.**
   - **Step 2: pick the top hit from search_docs and IMMEDIATELY call \`highlight\`** (NOT \`open_doc\`). Use the user's keyword (or the closest verbatim phrase from the excerpt) as \`query\`. **This is the default. Do NOT ask the user to confirm. Do NOT just call \`open_doc\` instead.**
2. Only fall back to \`open_doc\` when the user EXPLICITLY says "just open the page" / "no need to find a specific phrase". Otherwise always use \`highlight\` — it both navigates AND scrolls the user to the exact paragraph.
3. \`highlight\`'s \`query\` field:
   - Prefer a 1–5 word keyword from the user's question (or a short verbatim snippet from the search excerpt).
   - Don't stuff a long sentence in — it will fail to match. If the user named a single noun, just use that noun.
4. If \`search_docs\` returns no relevant hit: give a 1-2 sentence conceptual answer and clearly say "this isn't in the library yet" — do NOT force a \`highlight\`.
5. Don't fabricate doc paths. Categories MUST be one of \`ai / network / ops\`; levels MUST be one of \`beginner / advanced / ecosystem\`.

# Style

- Concise, well-structured; markdown (headings, lists, code blocks) ok.
- When citing a wiki page, use a markdown link \`[Title](/category/level/slug)\`.
- Always reply in the same language the user used.`;

export type StreamUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "tool_start"; name: string; args: Record<string, unknown> }
  | { type: "tool_end"; trace: ToolTrace }
  | { type: "action"; action: ChatAction }
  | {
      type: "usage";
      model: string;
      toolCalls: number;
      usage: StreamUsage;
    }
  | { type: "done" }
  | { type: "error"; error: string; code?: string };

export async function* streamChat(
  req: ChatRequest,
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    yield { type: "error", error: "OPENAI_API_KEY missing", code: "not_configured" };
    return;
  }
  if (!Array.isArray(req.messages) || req.messages.length === 0) {
    yield { type: "error", error: "messages is empty", code: "bad_request" };
    return;
  }

  const baseURL = normalizeBaseURL(
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, baseURL });

  const sys = req.locale === "en" ? SYSTEM_EN : SYSTEM_ZH;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sys },
    ...req.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Aggregate stats across the (possibly multi-step) tool-calling loop so
  // the route handler can emit a single audit record per request.
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalToolCalls = 0;
  let usageReported = false;

  for (let step = 0; step < 6; step++) {
    let stream;
    try {
      stream = await client.chat.completions.create({
        model,
        messages,
        tools: toolDefinitions,
        temperature: 0.4,
        stream: true,
        // Ask the upstream to emit a final chunk with token usage so we
        // can record per-request cost in the audit log. Providers that
        // do not support this option silently ignore it.
        stream_options: { include_usage: true },
      });
    } catch (e) {
      yield { type: "error", error: formatUpstreamError(e, baseURL, model), code: "upstream_error" };
      return;
    }

    let assembledContent = "";
    let assembledReasoning = "";
    type ToolCallAcc = {
      id?: string;
      name?: string;
      args: string;
    };
    const toolCallAcc: Record<number, ToolCallAcc> = {};
    let finishReason: string | null = null;

    try {
      for await (const chunk of stream) {
        // The final chunk emitted when `stream_options.include_usage` is
        // set has no `choices` but carries `usage` totals for the whole
        // completion. Capture and accumulate.
        const usageChunk = (chunk as unknown as { usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        } }).usage;
        if (usageChunk) {
          totalPromptTokens += usageChunk.prompt_tokens ?? 0;
          totalCompletionTokens += usageChunk.completion_tokens ?? 0;
          totalTokens += usageChunk.total_tokens ?? 0;
          usageReported = true;
        }
        const choice = chunk.choices[0];
        if (!choice) continue;
        const delta = choice.delta as typeof choice.delta & {
          reasoning_content?: string;
          reasoning?: string;
        };
        if (delta?.content) {
          assembledContent += delta.content;
          yield { type: "delta", text: delta.content };
        }
        // capture thinking-mode reasoning trace (qwen3 / deepseek-r1 / kimi-k2 etc.)
        const reasoningChunk = delta?.reasoning_content ?? delta?.reasoning;
        if (reasoningChunk) {
          assembledReasoning += reasoningChunk;
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            const acc = (toolCallAcc[idx] ??= { args: "" });
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) acc.args += tc.function.arguments;
          }
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }
    } catch (e) {
      yield { type: "error", error: formatUpstreamError(e, baseURL, model), code: "upstream_error" };
      return;
    }

    const toolCalls = Object.entries(toolCallAcc)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v)
      .filter((c) => c.id && c.name);

    if (toolCalls.length === 0) {
      yield {
        type: "usage",
        model,
        toolCalls: totalToolCalls,
        usage: usageReported
          ? {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens,
            }
          : {},
      };
      yield { type: "done" };
      return;
    }
    totalToolCalls += toolCalls.length;

    // Push assistant tool-call message back into history.
    // Some thinking-mode endpoints (Qwen3/DeepSeek-R1/Kimi-K2 with reasoning)
    // require the reasoning_content field be echoed back, otherwise they 400 with
    // "The reasoning_content in the thinking mode must be passed back to the API."
    const assistantMsg: Record<string, unknown> = {
      role: "assistant",
      content: assembledContent || null,
      tool_calls: toolCalls.map((c) => ({
        id: c.id!,
        type: "function" as const,
        function: { name: c.name!, arguments: c.args || "{}" },
      })),
    };
    if (assembledReasoning) {
      assistantMsg.reasoning_content = assembledReasoning;
    }
    messages.push(assistantMsg as unknown as OpenAI.Chat.ChatCompletionMessageParam);

    for (const c of toolCalls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(c.args || "{}");
      } catch {}
      yield { type: "tool_start", name: c.name!, args: parsed };
      const r = runTool(c.name!, parsed, req.locale ?? "zh");
      yield { type: "tool_end", trace: r.trace };
      if (r.action) yield { type: "action", action: r.action };
      messages.push({
        role: "tool",
        tool_call_id: c.id!,
        content: JSON.stringify(r.result).slice(0, 8000),
      });
    }

    if (finishReason && finishReason !== "tool_calls") {
      yield {
        type: "usage",
        model,
        toolCalls: totalToolCalls,
        usage: usageReported
          ? {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens,
            }
          : {},
      };
      yield { type: "done" };
      return;
    }
  }

  yield {
    type: "usage",
    model,
    toolCalls: totalToolCalls,
    usage: usageReported
      ? {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens,
        }
      : {},
  };
  yield { type: "done" };
}

/** Non-streaming legacy entrypoint. Kept for compatibility. */
export async function runChat(req: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, code: "not_configured", error: "OPENAI_API_KEY missing" };
  }
  if (!Array.isArray(req.messages) || req.messages.length === 0) {
    return { ok: false, code: "bad_request", error: "messages is empty" };
  }

  const baseURL = normalizeBaseURL(
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, baseURL });

  const sys = req.locale === "en" ? SYSTEM_EN : SYSTEM_ZH;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sys },
    ...req.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const trace: ToolTrace[] = [];
  const actions: ChatAction[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let usageReported = false;
  let totalToolCalls = 0;

  function buildAudit() {
    return {
      model,
      toolCalls: totalToolCalls,
      usage: usageReported
        ? {
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens,
          }
        : {},
    };
  }

  for (let step = 0; step < 6; step++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        messages,
        tools: toolDefinitions,
        temperature: 0.4,
      });
    } catch (e) {
      const detail = formatUpstreamError(e, baseURL, model);
      return { ok: false, code: "upstream_error", error: detail };
    }

    if (completion.usage) {
      totalPromptTokens += completion.usage.prompt_tokens ?? 0;
      totalCompletionTokens += completion.usage.completion_tokens ?? 0;
      totalTokens += completion.usage.total_tokens ?? 0;
      usageReported = true;
    }

    const choice = completion.choices[0];
    const msg = choice.message;
    messages.push(msg);

    const toolCalls = msg.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        ok: true,
        text: msg.content ?? "",
        actions,
        toolTrace: trace,
        audit: buildAudit(),
      };
    }
    totalToolCalls += toolCalls.length;

    for (const tc of toolCalls) {
      if (tc.type !== "function") continue;
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || "{}");
      } catch {
        parsedArgs = {};
      }
      const r = runTool(tc.function.name, parsedArgs, req.locale ?? "zh");
      trace.push(r.trace);
      if (r.action) actions.push(r.action);
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(r.result).slice(0, 8000),
      });
    }
  }

  return {
    ok: true,
    text: "(stopped: too many tool steps)",
    actions,
    toolTrace: trace,
    audit: buildAudit(),
  };
}

export function isAiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function normalizeBaseURL(raw: string): string {
  try {
    const u = new URL(raw.replace(/\/+$/, ""));
    if (u.pathname === "" || u.pathname === "/") {
      u.pathname = "/v1";
    }
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function formatUpstreamError(e: unknown, baseURL: string, model: string): string {
  type ApiErr = {
    status?: number;
    error?: unknown;
    message?: string;
    code?: string;
  };
  const err = e as ApiErr;
  const status = err.status;
  const message =
    err.message ?? (e instanceof Error ? e.message : String(e));
  const inner =
    err.error && typeof err.error === "object"
      ? JSON.stringify(err.error).slice(0, 400)
      : "";

  let hint = "";
  if (status === 404) {
    hint =
      ` —— 检查：(1) OPENAI_BASE_URL 是否带上 /v1 路径；(2) 模型名 "${model}" 在该端点是否存在。当前 base=${baseURL}`;
  } else if (status === 401 || status === 403) {
    hint = " —— OPENAI_API_KEY 可能无效或无权访问该模型。";
  } else if (status === 429) {
    hint = " —— 调用限频或额度不足。";
  } else if (!status) {
    hint = ` —— 连接失败，请检查 OPENAI_BASE_URL=${baseURL} 是否可达。`;
  }

  const parts = [
    status ? `[${status}]` : "[network]",
    message,
    inner,
    hint,
  ].filter(Boolean);
  return parts.join(" ");
}
