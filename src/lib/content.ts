import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/dict";

export type TopicMeta = {
  lang: Locale;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  chapter: string;
  chapterTitle: string;
  chapterOrder: number;
  tags: string[];
  category: string;
  level: string;
};

export type Topic = TopicMeta & {
  content: string;
  raw: string;
  /** Whether the file actually exists in the requested locale, or if we fell back. */
  fallback?: Locale;
};

export type ChapterGroup = {
  chapter: string;
  chapterTitle: string;
  chapterOrder: number;
  topics: TopicMeta[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function safeReadDir(p: string): string[] {
  try {
    if (!fs.existsSync(p)) return [];
    return fs.readdirSync(p);
  } catch {
    return [];
  }
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

export function normaliseLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function readMatter(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return { raw, content: parsed.content, data: parsed.data };
}

function buildMeta(
  data: Record<string, unknown>,
  lang: Locale,
  category: string,
  level: string,
  slug: string,
): TopicMeta {
  const fallbackChapterTitle = lang === "zh" ? "其他" : "Other";
  return {
    lang,
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    icon: (data.icon as string) ?? "circle",
    order: (data.order as number) ?? 999,
    chapter: (data.chapter as string) ?? "_misc",
    chapterTitle: (data.chapterTitle as string) ?? fallbackChapterTitle,
    chapterOrder: (data.chapterOrder as number) ?? 999,
    tags: (data.tags as string[]) ?? [],
    category,
    level,
  };
}

function tryParseTopic(
  lang: Locale,
  category: string,
  level: string,
  slug: string,
): TopicMeta | null {
  const dir = path.join(CONTENT_ROOT, lang, category, level);
  for (const ext of ["md", "mdx"] as const) {
    const filePath = path.join(dir, `${slug}.${ext}`);
    if (fs.existsSync(filePath)) {
      const { data } = readMatter(filePath);
      return buildMeta(data, lang, category, level, slug);
    }
  }
  return null;
}

/**
 * List all topics in `<lang>/<category>/<level>`.
 *
 * If a topic exists in `zh` but not yet in the requested `lang`, we still
 * surface it (with the zh metadata) so the sidebar / index never goes
 * "blank" mid-translation. The `lang` field on the returned meta reflects
 * which locale the metadata actually came from.
 */
export function listTopics(
  lang: Locale,
  category: string,
  level: string,
): TopicMeta[] {
  const out = new Map<string, TopicMeta>();

  const primaryDir = path.join(CONTENT_ROOT, lang, category, level);
  for (const file of safeReadDir(primaryDir)) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.(md|mdx)$/, "");
    const meta = tryParseTopic(lang, category, level, slug);
    if (meta) out.set(slug, meta);
  }

  if (lang !== DEFAULT_LOCALE) {
    const fallbackDir = path.join(CONTENT_ROOT, DEFAULT_LOCALE, category, level);
    for (const file of safeReadDir(fallbackDir)) {
      if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
      const slug = file.replace(/\.(md|mdx)$/, "");
      if (out.has(slug)) continue;
      const fallback = tryParseTopic(DEFAULT_LOCALE, category, level, slug);
      if (fallback) out.set(slug, fallback);
    }
  }

  const list = Array.from(out.values());
  list.sort(
    (a, b) => a.chapterOrder - b.chapterOrder || a.order - b.order,
  );
  return list;
}

export function listTopicsGrouped(
  lang: Locale,
  category: string,
  level: string,
): ChapterGroup[] {
  const all = listTopics(lang, category, level);
  const map = new Map<string, ChapterGroup>();
  for (const t of all) {
    if (!map.has(t.chapter)) {
      map.set(t.chapter, {
        chapter: t.chapter,
        chapterTitle: t.chapterTitle,
        chapterOrder: t.chapterOrder,
        topics: [],
      });
    }
    map.get(t.chapter)!.topics.push(t);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => a.chapterOrder - b.chapterOrder);
  for (const g of groups) g.topics.sort((a, b) => a.order - b.order);
  return groups;
}

/**
 * Load a single topic with content. If the file doesn't exist in `lang`
 * but does in the default locale, returns the default-locale version with
 * `fallback` set so the page can show a "not yet translated" notice.
 */
export function getTopic(
  lang: Locale,
  category: string,
  level: string,
  slug: string,
): Topic | null {
  for (const ext of ["md", "mdx"] as const) {
    const full = path.join(
      CONTENT_ROOT,
      lang,
      category,
      level,
      `${slug}.${ext}`,
    );
    if (fs.existsSync(full)) {
      const { content, data, raw } = readMatter(full);
      const meta = buildMeta(data, lang, category, level, slug);
      return { ...meta, content, raw };
    }
  }

  if (lang !== DEFAULT_LOCALE) {
    for (const ext of ["md", "mdx"] as const) {
      const full = path.join(
        CONTENT_ROOT,
        DEFAULT_LOCALE,
        category,
        level,
        `${slug}.${ext}`,
      );
      if (fs.existsSync(full)) {
        const { content, data, raw } = readMatter(full);
        const meta = buildMeta(data, DEFAULT_LOCALE, category, level, slug);
        return { ...meta, content, raw, fallback: DEFAULT_LOCALE };
      }
    }
  }

  return null;
}

export function listAllTopics(lang: Locale): TopicMeta[] {
  const out: TopicMeta[] = [];
  const root = path.join(CONTENT_ROOT, lang);
  if (!fs.existsSync(root)) return out;
  for (const category of safeReadDir(root)) {
    const catDir = path.join(root, category);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const level of safeReadDir(catDir)) {
      const levelDir = path.join(catDir, level);
      if (!fs.statSync(levelDir).isDirectory()) continue;
      for (const file of safeReadDir(levelDir)) {
        if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
        const slug = file.replace(/\.(md|mdx)$/, "");
        const meta = tryParseTopic(lang, category, level, slug);
        if (meta) out.push(meta);
      }
    }
  }
  return out;
}

/**
 * All `(lang, category, level, slug)` paths — used by `generateStaticParams`.
 *
 * For every locale, we union "files that exist in this locale" with "files
 * that exist in the default locale" so missing translations still get a
 * page (rendering the default-locale fallback).
 */
export function getAllTopicPaths(): Array<{
  lang: Locale;
  category: string;
  level: string;
  slug: string;
}> {
  const out: Array<{
    lang: Locale;
    category: string;
    level: string;
    slug: string;
  }> = [];

  const seen = new Set<string>();

  for (const lang of LOCALES) {
    for (const category of safeReadDir(path.join(CONTENT_ROOT, DEFAULT_LOCALE))) {
      const catDir = path.join(CONTENT_ROOT, DEFAULT_LOCALE, category);
      if (!fs.statSync(catDir).isDirectory()) continue;
      for (const level of safeReadDir(catDir)) {
        const levelDir = path.join(catDir, level);
        if (!fs.statSync(levelDir).isDirectory()) continue;
        for (const file of safeReadDir(levelDir)) {
          if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
          const slug = file.replace(/\.(md|mdx)$/, "");
          const key = `${lang}/${category}/${level}/${slug}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ lang, category, level, slug });
        }
      }
    }
  }

  return out;
}

/**
 * Locale availability for a single topic, used to render `<link rel="alternate" hreflang>` tags.
 */
export function topicLocales(
  category: string,
  level: string,
  slug: string,
): Locale[] {
  const langs: Locale[] = [];
  for (const lang of LOCALES) {
    for (const ext of ["md", "mdx"] as const) {
      if (
        fs.existsSync(
          path.join(CONTENT_ROOT, lang, category, level, `${slug}.${ext}`),
        )
      ) {
        langs.push(lang);
        break;
      }
    }
  }
  return langs;
}
