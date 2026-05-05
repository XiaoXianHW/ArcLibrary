import type { Locale } from "@/i18n/dict";

type Localised<T> = Record<Locale, T>;

export type Category = {
  slug: string;
  name: Localised<string>;
  shortName: Localised<string>;
  description: Localised<string>;
  /** English label, used as a kicker / SEO tagline regardless of locale. */
  tagline: string;
  accent: string;
  icon: string;
};

export type Level = {
  slug: string;
  name: Localised<string>;
  description: Localised<string>;
};

export const CATEGORIES: Category[] = [
  {
    slug: "ai",
    name: { zh: "人工智能", en: "Artificial Intelligence" },
    shortName: { zh: "AI", en: "AI" },
    description: {
      zh: "大模型 · 智能体 · RAG · 训练与部署",
      en: "LLMs · Agents · RAG · Training & deployment",
    },
    tagline: "Artificial Intelligence",
    accent: "#ededed",
    icon: "brain",
  },
  {
    slug: "network",
    name: { zh: "计算机网络", en: "Computer Networks" },
    shortName: { zh: "网络", en: "Networks" },
    description: {
      zh: "TCP/IP · HTTP · DNS · 路由与安全",
      en: "TCP/IP · HTTP · DNS · routing & security",
    },
    tagline: "Computer Networks",
    accent: "#ededed",
    icon: "network",
  },
  {
    slug: "ops",
    name: { zh: "系统运维", en: "Systems & Ops" },
    shortName: { zh: "运维", en: "Ops" },
    description: {
      zh: "Linux · Docker · K8s · 监控与可观测性",
      en: "Linux · Docker · K8s · observability",
    },
    tagline: "DevOps & SRE",
    accent: "#ededed",
    icon: "server",
  },
];

export const LEVELS: Level[] = [
  {
    slug: "beginner",
    name: { zh: "入门", en: "Beginner" },
    description: {
      zh: "高频常见概念，理解领域的最短路径",
      en: "Foundational concepts — the shortest path into the topic.",
    },
  },
  {
    slug: "advanced",
    name: { zh: "进阶", en: "Advanced" },
    description: {
      zh: "底层原理与训练 / 推理 / 工程实践",
      en: "Internals, engineering practices, and runtime tuning.",
    },
  },
  {
    slug: "ecosystem",
    name: { zh: "生态", en: "Ecosystem" },
    description: {
      zh: "第三方框架、工具与可视化平台",
      en: "Third-party frameworks, tools, and platforms.",
    },
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getLevel(slug: string): Level | undefined {
  return LEVELS.find((l) => l.slug === slug);
}

/** Convenience: pick the right localised value, falling back to English. */
export function pick(value: Localised<string>, lang: Locale): string {
  return value[lang] ?? value.en;
}
