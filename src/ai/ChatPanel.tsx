"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Sparkles,
  ArrowUpRight,
  Search,
  Highlighter,
  ListTree,
  X,
  Wrench,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ChatAction, ToolTrace } from "./types";

const HIGHLIGHT_KEY = "arc-pending-highlight";

const TOOL_ICON: Record<ToolTrace["name"], typeof Search> = {
  search_docs: Search,
  open_doc: ArrowUpRight,
  highlight: Highlighter,
  list_chapters: ListTree,
};

type ChatItem =
  | { kind: "user"; content: string }
  | {
      kind: "assistant";
      content: string;
      tools: { name: ToolTrace["name"]; args: Record<string, unknown>; resultPreview?: string; done: boolean }[];
      actions: ChatAction[];
      done: boolean;
      error?: string;
    };

export function ChatPanel({
  open,
  configured,
  onClose,
}: {
  open: boolean;
  configured: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setItems((prev) => [
      ...prev,
      { kind: "user", content: trimmed },
      { kind: "assistant", content: "", tools: [], actions: [], done: false },
    ]);
    setInput("");
    setLoading(true);

    try {
      const history = items
        .map((m) =>
          m.kind === "user"
            ? { role: "user" as const, content: m.content }
            : { role: "assistant" as const, content: m.content },
        )
        .concat([{ role: "user" as const, content: trimmed }]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify({ stream: true, locale, messages: history }),
      });

      if (!res.ok || !res.body) {
        const raw = await res.text().catch(() => "");
        let pretty = raw;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.error === "string") pretty = parsed.error;
        } catch {}
        setItems((prev) =>
          prev.map((it, i) =>
            i === prev.length - 1 && it.kind === "assistant"
              ? { ...it, content: pretty || t.ai.error, done: true, error: pretty }
              : it,
          ),
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const dispatched = new Set<string>();
      let topHit: NonNullable<ToolTrace["topHit"]> | null = null;
      let actionEmitted = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let evt: StreamEventClient;
          try {
            evt = JSON.parse(json);
          } catch {
            continue;
          }
          setItems((prev) => applyEvent(prev, evt));
          if (evt.type === "tool_end" && evt.trace.name === "search_docs" && evt.trace.topHit) {
            topHit = evt.trace.topHit;
          }
          if (evt.type === "action") {
            actionEmitted = true;
            const key = JSON.stringify(evt.action);
            if (!dispatched.has(key)) {
              dispatched.add(key);
              dispatchAction(evt.action, router, locale);
            }
          }
          if (evt.type === "done" && !actionEmitted && topHit) {
            // Safety net: if the model called search_docs but never chained
            // into highlight/open_doc, pick the top hit and auto-highlight
            // using the user's query so the user is still taken to the
            // relevant article without an extra click.
            const fallback: ChatAction = {
              type: "highlight",
              category: topHit.category,
              level: topHit.level,
              slug: topHit.slug,
              query: trimmed,
            };
            const key = JSON.stringify(fallback);
            if (!dispatched.has(key)) {
              dispatched.add(key);
              actionEmitted = true;
              dispatchAction(fallback, router, locale);
            }
          }
        }
      }
    } catch {
      setItems((prev) =>
        prev.map((it, i) =>
          i === prev.length - 1 && it.kind === "assistant"
            ? { ...it, content: t.ai.error, done: true }
            : it,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      role="dialog"
      aria-label={t.ai.title}
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-bg shadow-[-12px_0_32px_-12px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-subtle">
              <Sparkles className="h-4 w-4 text-fg" strokeWidth={1.7} />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-fg">{t.ai.title}</div>
              <div className="text-[11px] text-fg-subtle">{t.ai.subtitle}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-fg-subtle transition hover:bg-bg-subtle hover:text-fg"
            aria-label={t.ai.close}
          >
            <X className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
          {!configured && (
            <div className="rounded border border-dashed border-border px-3 py-3 text-[13px] leading-relaxed text-fg-muted">
              {t.ai.notConfigured}
            </div>
          )}

          {configured && items.length === 0 && <Suggestions onPick={send} />}

          <div className="space-y-5">
            {items.map((m, i) => (
              <Bubble key={i} item={m} router={router} locale={locale} />
            ))}
            {loading && items.length > 0 && items[items.length - 1].kind === "assistant" && (items[items.length - 1] as { content: string }).content === "" && (
              <div className="flex items-center gap-2 text-[12px] text-fg-subtle">
                <span className="h-2 w-2 animate-pulse rounded-full bg-fg-muted" />
                {t.ai.thinking}
              </div>
            )}
          </div>
        </div>

        <form
          className="flex items-end gap-2 border-t border-border bg-bg-subtle/50 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={t.ai.placeholder}
            disabled={!configured || loading}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2.5 text-[14px] leading-relaxed text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!configured || !input.trim() || loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-strong bg-fg text-bg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t.ai.send}
          >
            <Send className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </form>
    </aside>
  );
}

type StreamEventClient =
  | { type: "delta"; text: string }
  | { type: "tool_start"; name: ToolTrace["name"]; args: Record<string, unknown> }
  | { type: "tool_end"; trace: ToolTrace }
  | { type: "action"; action: ChatAction }
  | { type: "done" }
  | { type: "error"; error: string; code?: string };

function applyEvent(prev: ChatItem[], evt: StreamEventClient): ChatItem[] {
  const last = prev[prev.length - 1];
  if (!last || last.kind !== "assistant") return prev;
  const next = prev.slice(0, -1);
  switch (evt.type) {
    case "delta":
      return [...next, { ...last, content: last.content + evt.text }];
    case "tool_start":
      return [
        ...next,
        {
          ...last,
          tools: [...last.tools, { name: evt.name, args: evt.args, done: false }],
        },
      ];
    case "tool_end": {
      const tools = [...last.tools];
      // mark the last matching tool as done
      for (let i = tools.length - 1; i >= 0; i--) {
        if (tools[i].name === evt.trace.name && !tools[i].done) {
          tools[i] = { ...tools[i], done: true, resultPreview: evt.trace.resultPreview };
          break;
        }
      }
      return [...next, { ...last, tools }];
    }
    case "action":
      return [...next, { ...last, actions: [...last.actions, evt.action] }];
    case "done":
      return [...next, { ...last, done: true }];
    case "error":
      return [
        ...next,
        { ...last, content: last.content || evt.error, error: evt.error, done: true },
      ];
    default:
      return prev;
  }
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  const { t } = useLocale();
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        {t.ai.suggested}
      </div>
      <div className="flex flex-col gap-1.5">
        {t.ai.suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-md border border-border px-3 py-2.5 text-left text-[13.5px] text-fg-muted transition hover:border-border-strong hover:bg-bg-subtle hover:text-fg"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({
  item,
  router,
  locale,
}: {
  item: ChatItem;
  router: ReturnType<typeof useRouter>;
  locale: string;
}) {
  if (item.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-border bg-bg-subtle px-3.5 py-2 text-[14px] text-fg">
          {item.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {item.tools.map((tc, i) => (
        <ToolCard key={i} tool={tc} />
      ))}
      {item.content && (
        <div className="ai-md text-[14px] leading-relaxed text-fg">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  onClick={(e) => {
                    if (href && href.startsWith("/")) {
                      e.preventDefault();
                      router.push(href);
                    }
                  }}
                  className="text-fg underline decoration-border-strong underline-offset-2 transition hover:decoration-fg"
                  {...props}
                >
                  {children}
                </a>
              ),
              code: ({ className, children, ...props }) => {
                const inline = !className?.includes("language-");
                if (inline) {
                  return (
                    <code
                      className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[12.5px] text-fg"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-2 overflow-x-auto rounded-md border border-border bg-bg-subtle p-3 font-mono text-[12.5px] leading-relaxed text-fg">
                  {children}
                </pre>
              ),
            }}
          >
            {item.content}
          </ReactMarkdown>
        </div>
      )}
      {item.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.actions.map((a, i) => (
            <ActionButton key={i} action={a} router={router} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({
  tool,
}: {
  tool: { name: ToolTrace["name"]; args: Record<string, unknown>; resultPreview?: string; done: boolean };
}) {
  const { t } = useLocale();
  const Icon = TOOL_ICON[tool.name] ?? Wrench;
  const argsLine = formatArgs(tool.args);
  return (
    <div className="rounded-md border border-border bg-bg-subtle px-3 py-2">
      <div className="flex items-center gap-2 text-[12px]">
        <Icon className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.7} />
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-subtle">
          {t.ai.toolBadge[tool.name]}
        </span>
        {tool.done ? (
          <Check className="h-3 w-3 text-fg-subtle" strokeWidth={2.2} />
        ) : (
          <span className="h-2 w-2 animate-pulse rounded-full bg-fg-muted" />
        )}
      </div>
      {argsLine && (
        <div className="mt-1 truncate font-mono text-[11.5px] text-fg-muted">
          {argsLine}
        </div>
      )}
      {tool.resultPreview && (
        <div className="mt-0.5 truncate font-mono text-[11px] text-fg-subtle">
          → {tool.resultPreview}
        </div>
      )}
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
    .join(" ");
}

function ActionButton({
  action,
  router,
  locale,
}: {
  action: ChatAction;
  router: ReturnType<typeof useRouter>;
  locale: string;
}) {
  if (action.type === "open_doc") {
    return (
      <button
        type="button"
        onClick={() =>
          router.push(
            `/${locale}/${action.category}/${action.level}/${action.slug}`,
          )
        }
        className="inline-flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1 text-[12px] text-fg transition hover:bg-bg-subtle"
      >
        <ArrowUpRight className="h-3 w-3" strokeWidth={1.7} />
        {action.title ?? action.slug}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem(HIGHLIGHT_KEY, action.query);
        } catch {}
        router.push(
          `/${locale}/${action.category}/${action.level}/${action.slug}`,
        );
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border-strong px-2.5 py-1 text-[12px] text-fg transition hover:bg-bg-subtle"
    >
      <Highlighter className="h-3 w-3" strokeWidth={1.7} />
      {action.query}
    </button>
  );
}

function dispatchAction(
  action: ChatAction,
  router: ReturnType<typeof useRouter>,
  locale: string,
) {
  const target = `/${locale}/${action.category}/${action.level}/${action.slug}`;
  if (action.type === "highlight") {
    try {
      sessionStorage.setItem(HIGHLIGHT_KEY, action.query);
    } catch {}
  }
  if (typeof window !== "undefined" && window.location.pathname === target) {
    // Already on the target page — re-fire highlight without a navigation.
    if (action.type === "highlight") {
      window.dispatchEvent(
        new CustomEvent("arc:highlight", { detail: { phrase: action.query } }),
      );
    }
    return;
  }
  router.push(target);
}
