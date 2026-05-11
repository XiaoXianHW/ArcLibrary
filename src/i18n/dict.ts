export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];

export const DEFAULT_LOCALE: Locale = "zh";

type Dict = {
  brand: string;
  nav: {
    categories: string;
    home: string;
    github: string;
    toggleTheme: string;
    toggleLang: string;
    askAi: string;
  };
  search: {
    placeholder: string;
    placeholderShort: string;
    empty: string;
    emptyHint: string;
    upDown: string;
    enter: string;
    esc: string;
    resultsCount: (n: number) => string;
  };
  home: {
    eyebrow: string;
    title1: string;
    title2: string;
    lead: string;
    browseCategories: string;
    startAi: string;
    askAi: string;
  };
  categories: {
    eyebrow: string;
    title: string;
    domains: (n: number) => string;
    listEyebrow: string;
    listTitle: string;
    listLead: string;
    topicsCount: (n: number) => string;
    comingSoon: string;
  };
  level: {
    listLabel: string;
    totalTopics: (n: number, c: number) => string;
    empty: string;
    topics: string;
  };
  topic: {
    onThisPage: string;
    copyMarkdown: string;
    copied: string;
    openInGithub: string;
    untranslated: string;
    untranslatedFallback: string;
    prev: string;
    next: string;
  };
  sidebar: {
    empty: string;
  };
  ai: {
    title: string;
    subtitle: string;
    placeholder: string;
    suggested: string;
    send: string;
    close: string;
    thinking: string;
    error: string;
    notConfigured: string;
    suggestions: string[];
    toolBadge: {
      search_docs: string;
      open_doc: string;
      highlight: string;
      list_chapters: string;
    };
  };
  footer: {
    builtWith: string;
  };
  notFound: {
    code: string;
    title: string;
    description: string;
    home: string;
  };
};

export const dict: Record<Locale, Dict> = {
  zh: {
    brand: "ArcLibrary",
    nav: {
      categories: "知识库",
      home: "首页",
      github: "GitHub",
      toggleTheme: "切换主题",
      toggleLang: "切换语言",
      askAi: "向 AI 提问",
    },
    search: {
      placeholder: "搜索知识库 —— 输入概念、章节或关键词…",
      placeholderShort: "搜索知识库…",
      empty: "没找到相关内容",
      emptyHint: "输入关键词开始搜索 · 或浏览下方常见入口",
      upDown: "选择",
      enter: "跳转",
      esc: "关闭",
      resultsCount: (n) => `${n} 个结果`,
    },
    home: {
      eyebrow: "ArcLibrary · Personal Knowledge Wiki",
      title1: "一座可读、可分享、可演进的",
      title2: "个人知识库",
      lead: "覆盖 AI 大模型、计算机网络与系统运维。每一个知识点都是一篇可单独阅读的 markdown。",
      browseCategories: "浏览知识库",
      startAi: "从 AI 入门开始",
      askAi: "或直接问 AI",
    },
    categories: {
      eyebrow: "01 · 选一个领域开始",
      title: "大分类",
      domains: (n) => `${n} domains`,
      listEyebrow: "02 · 全部知识点速览",
      listTitle: "知识列表",
      listLead: "所有大分类下的知识章节与子节点。点击任意条目直达详情。",
      topicsCount: (n) => `${n} topics →`,
      comingSoon: "敬请期待",
    },
    level: {
      listLabel: "知识点列表",
      totalTopics: (n, c) => `当前共 ${n} 个知识点，分布在 ${c} 个章节。`,
      empty: "这个分类下还没有内容，敬请期待。",
      topics: "topics",
    },
    topic: {
      onThisPage: "On this page",
      copyMarkdown: "复制本页",
      copied: "已复制",
      openInGithub: "在 GitHub 打开",
      untranslated: "本文尚未翻译",
      untranslatedFallback: "下方展示原始中文版本。",
      prev: "上一篇",
      next: "下一篇",
    },
    sidebar: {
      empty: "暂无内容",
    },
    ai: {
      title: "AI 助手",
      subtitle: "可以帮你查找文档、跳转页面、解释概念",
      placeholder: "问点什么…例如「什么是 RAG?」",
      suggested: "试试这些",
      send: "发送",
      close: "关闭",
      thinking: "思考中…",
      error: "出错了，请稍后再试",
      notConfigured:
        "AI 助手未配置。请在环境变量中设置 OPENAI_API_KEY（可选 OPENAI_BASE_URL / OPENAI_MODEL）。",
      suggestions: [
        "什么是 RAG？",
        "Transformer 与 Attention 机制",
        "如何选择 Embedding 模型？",
        "Function Calling 怎么用？",
      ],
      toolBadge: {
        search_docs: "搜索文档",
        open_doc: "打开文档",
        highlight: "高亮内容",
        list_chapters: "列出章节",
      },
    },
    footer: {
      builtWith: "Built with Next.js & MDX",
    },
    notFound: {
      code: "404",
      title: "页面不存在",
      description: "没有找到你要访问的内容，可能它还没被收录到 ArcLibrary 中。",
      home: "回到首页",
    },
  },
  en: {
    brand: "ArcLibrary",
    nav: {
      categories: "Wiki",
      home: "Home",
      github: "GitHub",
      toggleTheme: "Toggle theme",
      toggleLang: "Switch language",
      askAi: "Ask AI",
    },
    search: {
      placeholder: "Search the wiki — concepts, chapters, keywords…",
      placeholderShort: "Search…",
      empty: "Nothing found",
      emptyHint: "Type to search, or browse the entries below.",
      upDown: "Navigate",
      enter: "Open",
      esc: "Close",
      resultsCount: (n) => `${n} result${n === 1 ? "" : "s"}`,
    },
    home: {
      eyebrow: "ArcLibrary · Personal Knowledge Wiki",
      title1: "A readable, shareable, evolving",
      title2: "personal knowledge base.",
      lead: "Covers LLMs, networking, and ops. Every topic is a single, self-contained markdown article.",
      browseCategories: "Browse the wiki",
      startAi: "Start with AI basics",
      askAi: "Or just ask the AI",
    },
    categories: {
      eyebrow: "01 · Pick a domain",
      title: "Categories",
      domains: (n) => `${n} domains`,
      listEyebrow: "02 · Full index",
      listTitle: "All topics",
      listLead: "Every chapter and topic across the wiki. Click any entry to open it.",
      topicsCount: (n) => `${n} topics →`,
      comingSoon: "Coming soon",
    },
    level: {
      listLabel: "Topic list",
      totalTopics: (n, c) => `${n} topics across ${c} chapters.`,
      empty: "Nothing here yet. Stay tuned.",
      topics: "topics",
    },
    topic: {
      onThisPage: "On this page",
      copyMarkdown: "Copy page",
      copied: "Copied",
      openInGithub: "Open in GitHub",
      untranslated: "Not yet translated",
      untranslatedFallback: "Showing the original Chinese version below.",
      prev: "Previous",
      next: "Next",
    },
    sidebar: {
      empty: "Empty",
    },
    ai: {
      title: "AI assistant",
      subtitle: "Search the docs, jump to pages, explain concepts.",
      placeholder: "Ask anything… e.g. \"What is RAG?\"",
      suggested: "Try these",
      send: "Send",
      close: "Close",
      thinking: "Thinking…",
      error: "Something went wrong. Try again.",
      notConfigured:
        "AI is not configured. Set OPENAI_API_KEY (optionally OPENAI_BASE_URL / OPENAI_MODEL) in your env.",
      suggestions: [
        "What is RAG?",
        "Explain attention in Transformers",
        "How do I pick an embedding model?",
        "How does Function Calling work?",
      ],
      toolBadge: {
        search_docs: "Search docs",
        open_doc: "Open page",
        highlight: "Highlight",
        list_chapters: "List chapters",
      },
    },
    footer: {
      builtWith: "Built with Next.js & MDX",
    },
    notFound: {
      code: "404",
      title: "Page not found",
      description: "We couldn't find that page. It may not be in ArcLibrary yet.",
      home: "Back to home",
    },
  },
};

export function getDict(locale: string | undefined | null): Dict {
  if (locale === "en") return dict.en;
  return dict.zh;
}

/**
 * Parse an `Accept-Language` header and return the best supported locale.
 * Falls back to {@link DEFAULT_LOCALE} when no tag matches.
 */
export function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? Number(qPart.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of wanted) {
    for (const locale of LOCALES) {
      if (tag === locale || tag.startsWith(`${locale}-`)) return locale;
    }
  }
  return DEFAULT_LOCALE;
}
