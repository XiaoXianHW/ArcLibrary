import { listAllTopics, getTopic, type TopicMeta } from "@/lib/content";
import type { Locale } from "@/i18n/dict";
import { DEFAULT_LOCALE } from "@/i18n/dict";
import type { ChatAction, ToolTrace } from "./types";

export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "search_docs",
      description:
        "Search the ArcLibrary wiki for topics matching a free-text query. Returns up to 8 best-matching topics with title, slug, chapter, description and a content excerpt.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search query (concept name, keyword, or natural-language question).",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_chapters",
      description:
        "List all chapters and topic slugs in the wiki, grouped by domain (ai/network/ops) and level (beginner/advanced/ecosystem).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_doc",
      description:
        "Tell the user's browser to navigate to a specific topic page. Use this AFTER you have located the right slug via search_docs. Returns confirmation.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["ai", "network", "ops"] },
          level: {
            type: "string",
            enum: ["beginner", "advanced", "ecosystem"],
          },
          slug: { type: "string" },
        },
        required: ["category", "level", "slug"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "highlight",
      description:
        "Tell the user's browser to highlight a phrase on a topic page (also navigating there if needed). Use this when the user asks to find a specific phrase or sentence within an article.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["ai", "network", "ops"] },
          level: {
            type: "string",
            enum: ["beginner", "advanced", "ecosystem"],
          },
          slug: { type: "string" },
          query: {
            type: "string",
            description: "The exact phrase to highlight on the page.",
          },
        },
        required: ["category", "level", "slug", "query"],
      },
    },
  },
];

function score(topic: TopicMeta, body: string, q: string): number {
  const ql = q.toLowerCase();
  let s = 0;
  if (topic.title.toLowerCase().includes(ql)) s += 100;
  if (topic.description.toLowerCase().includes(ql)) s += 30;
  if (topic.tags.some((t) => t.toLowerCase().includes(ql))) s += 25;
  if (topic.chapterTitle.toLowerCase().includes(ql)) s += 12;
  if (body.toLowerCase().includes(ql)) s += 8;
  // word-level fallback
  const words = ql.split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) {
    if (topic.title.toLowerCase().includes(w)) s += 6;
    if (body.toLowerCase().includes(w)) s += 1;
  }
  return s;
}

export function tool_search_docs(
  args: { query: string },
  lang: Locale = DEFAULT_LOCALE,
) {
  const all = listAllTopics(lang);
  const scored = all.map((t) => {
    const full = getTopic(lang, t.category, t.level, t.slug);
    const body = full?.content ?? "";
    return { topic: t, body, s: score(t, body, args.query) };
  });
  scored.sort((a, b) => b.s - a.s);
  const hits = scored.filter((s) => s.s > 0).slice(0, 8);
  return {
    query: args.query,
    count: hits.length,
    results: hits.map((h) => ({
      title: h.topic.title,
      category: h.topic.category,
      level: h.topic.level,
      slug: h.topic.slug,
      chapter: h.topic.chapterTitle,
      description: h.topic.description,
      excerpt: extractExcerpt(h.body, args.query),
      url: `/${lang}/${h.topic.category}/${h.topic.level}/${h.topic.slug}`,
    })),
  };
}

function extractExcerpt(body: string, query: string, around = 120): string {
  const ql = query.toLowerCase();
  const idx = body.toLowerCase().indexOf(ql);
  if (idx < 0) return body.slice(0, 200).replace(/\s+/g, " ").trim();
  const start = Math.max(0, idx - around);
  const end = Math.min(body.length, idx + ql.length + around);
  return (
    (start > 0 ? "…" : "") +
    body.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < body.length ? "…" : "")
  );
}

export function tool_list_chapters(lang: Locale = DEFAULT_LOCALE) {
  const all = listAllTopics(lang);
  const groups: Record<
    string,
    Record<string, Record<string, { title: string; slug: string }[]>>
  > = {};
  for (const t of all) {
    groups[t.category] ??= {};
    groups[t.category][t.level] ??= {};
    groups[t.category][t.level][t.chapterTitle] ??= [];
    groups[t.category][t.level][t.chapterTitle].push({
      title: t.title,
      slug: t.slug,
    });
  }
  return groups;
}

export function tool_open_doc(
  args: { category: string; level: string; slug: string },
  lang: Locale = DEFAULT_LOCALE,
): { ok: boolean; action: ChatAction; message: string } {
  const topic = getTopic(lang, args.category, args.level, args.slug);
  if (!topic) {
    return {
      ok: false,
      action: { type: "open_doc", ...args },
      message: `No topic found at /${lang}/${args.category}/${args.level}/${args.slug}`,
    };
  }
  return {
    ok: true,
    action: { type: "open_doc", ...args, title: topic.title },
    message: `Navigating to "${topic.title}" (${args.category}/${args.level}/${args.slug}).`,
  };
}

export function tool_highlight(
  args: { category: string; level: string; slug: string; query: string },
  lang: Locale = DEFAULT_LOCALE,
): { ok: boolean; action: ChatAction; message: string } {
  const topic = getTopic(lang, args.category, args.level, args.slug);
  if (!topic) {
    return {
      ok: false,
      action: { type: "highlight", ...args },
      message: `No topic found at /${lang}/${args.category}/${args.level}/${args.slug}`,
    };
  }
  const found = topic.content.toLowerCase().includes(args.query.toLowerCase());
  return {
    ok: true,
    action: { type: "highlight", ...args },
    message: found
      ? `Highlighting "${args.query}" in "${topic.title}".`
      : `Note: phrase "${args.query}" not found in body, will still scroll user there.`,
  };
}

export type ToolResult = {
  trace: ToolTrace;
  result: unknown;
  action?: ChatAction;
};

export function runTool(
  name: string,
  args: Record<string, unknown>,
  lang: Locale = DEFAULT_LOCALE,
): ToolResult {
  switch (name) {
    case "search_docs": {
      const r = tool_search_docs({ query: String(args.query ?? "") }, lang);
      const top = r.results[0];
      return {
        result: r,
        trace: {
          name: "search_docs",
          args,
          resultPreview: `${r.count} results`,
          topHit: top
            ? {
                category: top.category,
                level: top.level,
                slug: top.slug,
                title: top.title,
              }
            : undefined,
        },
      };
    }
    case "list_chapters": {
      const r = tool_list_chapters(lang);
      return {
        result: r,
        trace: { name: "list_chapters", args, resultPreview: "chapters loaded" },
      };
    }
    case "open_doc": {
      const r = tool_open_doc(
        args as { category: string; level: string; slug: string },
        lang,
      );
      return {
        result: { ok: r.ok, message: r.message },
        action: r.action,
        trace: { name: "open_doc", args, resultPreview: r.message },
      };
    }
    case "highlight": {
      const r = tool_highlight(
        args as {
          category: string;
          level: string;
          slug: string;
          query: string;
        },
        lang,
      );
      return {
        result: { ok: r.ok, message: r.message },
        action: r.action,
        trace: { name: "highlight", args, resultPreview: r.message },
      };
    }
    default:
      return {
        result: { error: `Unknown tool: ${name}` },
        trace: {
          name: name as ToolTrace["name"],
          args,
          resultPreview: "unknown tool",
        },
      };
  }
}
