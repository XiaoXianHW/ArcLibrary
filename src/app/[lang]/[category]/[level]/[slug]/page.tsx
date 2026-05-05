import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { LevelTabs } from "@/components/LevelTabs";
import { Sidebar } from "@/components/Sidebar";
import { MdxRenderer } from "@/components/MdxRenderer";
import { Toc } from "@/components/Toc";
import { CopyMarkdownButton } from "@/components/CopyMarkdownButton";
import { extractToc } from "@/lib/toc";
import { getCategory, getLevel, pick } from "@/lib/config";
import {
  getAllTopicPaths,
  getTopic,
  listTopics,
  listTopicsGrouped,
  topicLocales,
} from "@/lib/content";
import { HighlightOnLoad } from "@/ai/HighlightOnLoad";
import { SITE_NAME, ogImageUrl, absoluteUrl } from "@/lib/site";
import { LOCALES, type Locale } from "@/i18n/dict";

export function generateStaticParams() {
  return getAllTopicPaths();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; level: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, category, level, slug } = await params;
  if (!LOCALES.includes(lang as Locale)) return {};
  const t = getTopic(lang as Locale, category, level, slug);
  if (!t) return {};
  const cat = getCategory(category);
  const lvl = getLevel(level);

  const path = `/${lang}/${category}/${level}/${slug}`;
  const url = absoluteUrl(path);

  const kicker = [
    cat?.tagline ?? (cat ? pick(cat.name, lang as Locale) : undefined),
    lvl ? pick(lvl.name, lang as Locale) : undefined,
    t.chapterTitle,
  ]
    .filter(Boolean)
    .join(" · ");

  const description =
    t.description ||
    `${t.title} · ${cat ? pick(cat.name, lang as Locale) : category} · ${
      lvl ? pick(lvl.name, lang as Locale) : level
    }`;

  const ogImage = ogImageUrl({
    title: t.title,
    description,
    kicker,
    lang: lang as Locale,
  });

  // hreflang alternates: link to every locale where this slug actually exists.
  const langs = topicLocales(category, level, slug);
  const languages: Record<string, string> = {};
  for (const l of langs) languages[l] = `/${l}/${category}/${level}/${slug}`;
  if (langs.includes("zh")) languages["x-default"] = `/zh/${category}/${level}/${slug}`;

  return {
    title: t.title,
    description,
    keywords: [
      t.title,
      cat ? pick(cat.name, lang as Locale) : undefined,
      cat ? pick(cat.shortName, lang as Locale) : undefined,
      lvl ? pick(lvl.name, lang as Locale) : undefined,
      t.chapterTitle,
      ...(t.tags ?? []),
    ].filter(Boolean) as string[],
    alternates: { canonical: path, languages },
    openGraph: {
      type: "article",
      url,
      title: t.title,
      description,
      siteName: SITE_NAME,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      alternateLocale: lang === "zh" ? ["en_US"] : ["zh_CN"],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
      tags: t.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ lang: string; category: string; level: string; slug: string }>;
}) {
  const { lang, category, level, slug } = await params;
  if (!LOCALES.includes(lang as Locale)) notFound();
  const localeParam = lang as Locale;

  const cat = getCategory(category);
  const lvl = getLevel(level);
  if (!cat || !lvl) notFound();
  const topic = getTopic(localeParam, cat.slug, lvl.slug, slug);
  if (!topic) notFound();

  const flat = listTopics(localeParam, cat.slug, lvl.slug);
  const groups = listTopicsGrouped(localeParam, cat.slug, lvl.slug);
  const idx = flat.findIndex((t) => t.slug === topic.slug);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const tocItems = extractToc(topic.content);

  // GitHub source path always reflects where the file actually lives on disk.
  const sourceLang = topic.fallback ?? topic.lang;
  const githubPath = `content/${sourceLang}/${cat.slug}/${lvl.slug}/${topic.slug}.md`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: topic.title,
    description: topic.description,
    inLanguage: localeParam === "zh" ? "zh-CN" : "en-US",
    keywords: topic.tags,
    articleSection: topic.chapterTitle,
    mainEntityOfPage: absoluteUrl(
      `/${localeParam}/${cat.slug}/${lvl.slug}/${topic.slug}`,
    ),
    image: ogImageUrl({
      title: topic.title,
      description: topic.description,
      kicker: `${cat.tagline} · ${pick(lvl.name, localeParam)}`,
      lang: localeParam,
    }),
  };

  const fallbackNotice = topic.fallback;

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <SiteHeader />
      <LevelTabs category={cat.slug} active={lvl.slug} />

      <div className="mx-auto flex w-full gap-8 px-6 sm:px-8">
        <Sidebar
          groups={groups}
          category={cat.slug}
          level={lvl.slug}
          activeSlug={topic.slug}
        />

        <main className="min-w-0 flex-1 py-14">
          <HighlightOnLoad />
          <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
            <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
              <Link href={`/${localeParam}/${cat.slug}`} className="hover:text-fg">
                {cat.tagline}
              </Link>
              <span> · </span>
              <Link
                href={`/${localeParam}/${cat.slug}/${lvl.slug}`}
                className="hover:text-fg"
              >
                {pick(lvl.name, localeParam)}
              </Link>
              <span> · </span>
              <span className="text-fg-muted">{topic.chapterTitle}</span>
            </nav>
            <CopyMarkdownButton raw={topic.raw} githubPath={githubPath} />
          </div>

          <header className="mb-10">
            <h1 className="wiki-title">{topic.title}</h1>
            <div className="wiki-rule" />
            {topic.description && (
              <p className="wiki-lead">{topic.description}</p>
            )}
            {topic.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {topic.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {fallbackNotice && fallbackNotice !== localeParam && (
              <FallbackBanner lang={localeParam} />
            )}
          </header>

          <MdxRenderer source={topic.content} lang={localeParam} />

          <nav className="mt-16 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/${localeParam}/${cat.slug}/${lvl.slug}/${prev.slug}`}
                className="group flex items-center gap-4 rounded border border-border p-5 transition hover:border-border-strong"
              >
                <ArrowLeft
                  className="h-4 w-4 text-fg-subtle transition group-hover:-translate-x-0.5 group-hover:text-fg"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Prev
                  </div>
                  <div className="mt-0.5 truncate text-sm text-fg">
                    {prev.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/${localeParam}/${cat.slug}/${lvl.slug}/${next.slug}`}
                className="group flex items-center justify-end gap-4 rounded border border-border p-5 text-right transition hover:border-border-strong"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                    Next
                  </div>
                  <div className="mt-0.5 truncate text-sm text-fg">
                    {next.title}
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-fg"
                  strokeWidth={1.5}
                />
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </main>

        <Toc items={tocItems} />
      </div>
    </div>
  );
}

function FallbackBanner({ lang }: { lang: Locale }) {
  const text =
    lang === "en"
      ? "This article hasn't been translated to English yet. The original Chinese version is shown below."
      : "本文尚未翻译，下方展示原始中文版本。";
  return (
    <div className="mt-6 rounded border border-dashed border-border bg-bg-subtle px-4 py-3 text-[12px] text-fg-muted">
      {text}
    </div>
  );
}
