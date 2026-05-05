import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { LevelTabs } from "@/components/LevelTabs";
import { Sidebar } from "@/components/Sidebar";
import {
  CATEGORIES,
  LEVELS,
  getCategory,
  getLevel,
  pick,
} from "@/lib/config";
import { listTopicsGrouped } from "@/lib/content";
import { SITE_NAME, ogImageUrl, absoluteUrl } from "@/lib/site";
import { LOCALES, type Locale } from "@/i18n/dict";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; level: string }>;
}): Promise<Metadata> {
  const { lang, category, level } = await params;
  if (!LOCALES.includes(lang as Locale)) return {};
  const cat = getCategory(category);
  const lvl = getLevel(level);
  if (!cat || !lvl) return {};
  const localeParam = lang as Locale;
  const path = `/${lang}/${cat.slug}/${lvl.slug}`;
  const title = `${pick(cat.name, localeParam)} · ${pick(lvl.name, localeParam)}`;
  const description =
    localeParam === "zh"
      ? `${pick(cat.description, localeParam)}（${pick(lvl.name, localeParam)}）`
      : `${pick(cat.description, localeParam)} (${pick(lvl.name, localeParam)})`;
  const ogImage = ogImageUrl({
    title,
    description,
    kicker: cat.tagline,
    lang: localeParam,
  });
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `/${l}/${cat.slug}/${lvl.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path, languages },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title,
      description,
      siteName: SITE_NAME,
      locale: localeParam === "zh" ? "zh_CN" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function generateStaticParams() {
  const out: Array<{ lang: string; category: string; level: string }> = [];
  for (const lang of LOCALES) {
    for (const c of CATEGORIES) {
      for (const l of LEVELS) {
        out.push({ lang, category: c.slug, level: l.slug });
      }
    }
  }
  return out;
}

export default async function LevelIndex({
  params,
}: {
  params: Promise<{ lang: string; category: string; level: string }>;
}) {
  const { lang, category, level } = await params;
  if (!LOCALES.includes(lang as Locale)) notFound();
  const localeParam = lang as Locale;
  const cat = getCategory(category);
  const lvl = getLevel(level);
  if (!cat || !lvl) notFound();
  const groups = listTopicsGrouped(localeParam, cat.slug, lvl.slug);
  const totalTopics = groups.reduce((s, g) => s + g.topics.length, 0);

  const labels = (() => {
    if (localeParam === "zh") {
      return {
        eyebrow: `知识点列表 · ${pick(lvl.name, localeParam)}`,
        lead: (
          <>
            {pick(lvl.description, localeParam)}。当前共{" "}
            <strong>{totalTopics}</strong> 个知识点，分布在{" "}
            <strong>{groups.length}</strong> 个章节。
          </>
        ),
        empty: "这个分类下还没有内容，敬请期待。",
      };
    }
    return {
      eyebrow: `Topic list · ${pick(lvl.name, localeParam)}`,
      lead: (
        <>
          {pick(lvl.description, localeParam)} <strong>{totalTopics}</strong>{" "}
          topics across <strong>{groups.length}</strong> chapters.
        </>
      ),
      empty: "Nothing in this category yet. Stay tuned.",
    };
  })();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <CategoryBanner
        cat={cat}
        lvl={lvl}
        count={totalTopics}
        lang={localeParam}
      />
      <LevelTabs category={cat.slug} active={lvl.slug} />

      <div className="mx-auto flex w-full gap-12 px-8">
        <Sidebar groups={groups} category={cat.slug} level={lvl.slug} />
        <main className="min-w-0 flex-1 py-14">
          <header className="mb-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-subtle">
              {labels.eyebrow}
            </div>
            <h2 className="wiki-title mt-4">{pick(cat.name, localeParam)}</h2>
            <div className="wiki-rule" />
            <p className="wiki-lead">{labels.lead}</p>
          </header>

          {groups.length === 0 ? (
            <div className="rounded border border-dashed border-border p-12 text-center">
              <div className="text-[13px] text-fg-muted">{labels.empty}</div>
            </div>
          ) : (
            <div className="space-y-16">
              {groups.map((group) => (
                <section key={group.chapter}>
                  <div className="mb-6 flex items-baseline gap-3 border-b border-border pb-3">
                    <span className="font-mono text-[11px] tabular-nums text-fg-subtle">
                      {String(group.chapterOrder).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight text-fg">
                      {group.chapterTitle}
                    </h3>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
                      {group.topics.length} topics
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2">
                    {group.topics.map((t) => (
                      <li key={t.slug}>
                        <Link
                          href={`/${localeParam}/${cat.slug}/${lvl.slug}/${t.slug}`}
                          className="group flex items-start justify-between gap-4 border-b border-border/60 py-4 pr-2 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[15px] font-medium text-fg group-hover:text-fg">
                              {t.title}
                            </h4>
                            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-fg-muted">
                              {t.description}
                            </p>
                          </div>
                          <ArrowRight
                            className="mt-1 h-4 w-4 shrink-0 text-fg-subtle opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                            strokeWidth={1.5}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CategoryBanner({
  cat,
  lvl,
  count,
  lang,
}: {
  cat: ReturnType<typeof getCategory> & object;
  lvl: ReturnType<typeof getLevel> & object;
  count: number;
  lang: Locale;
}) {
  const c = cat as NonNullable<ReturnType<typeof getCategory>>;
  const l = lvl as NonNullable<ReturnType<typeof getLevel>>;
  const summary =
    lang === "zh"
      ? `${pick(c.description, lang)} · 当前查看 ${pick(l.name, lang)} · ${count} 个知识点`
      : `${pick(c.description, lang)} · viewing ${pick(l.name, lang)} · ${count} topics`;
  return (
    <section className="border-b border-border">
      <div className="mx-auto w-full px-8 py-12">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-subtle">
          <Link href={`/${lang}`} className="hover:text-fg">
            ArcLibrary
          </Link>
          <span> · </span>
          <span className="text-fg-muted">{c.tagline}</span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          {pick(c.name, lang)}
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-fg-muted">
          {summary}
        </p>
      </div>
    </section>
  );
}
