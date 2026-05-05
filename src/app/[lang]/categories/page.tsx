import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CategoryCard } from "@/components/CategoryCard";
import { Icon } from "@/components/Icon";
import { CATEGORIES, LEVELS, pick } from "@/lib/config";
import { listTopicsGrouped, type ChapterGroup } from "@/lib/content";
import { CategoriesHeader, CategoriesListHeader } from "./CategoriesClient";
import { SITE_NAME, ogImageUrl, absoluteUrl } from "@/lib/site";
import { LOCALES, type Locale } from "@/i18n/dict";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!LOCALES.includes(lang as Locale)) return {};
  const localeParam = lang as Locale;
  const path = `/${lang}/categories`;
  const isZh = localeParam === "zh";
  const title = isZh ? "全部分类" : "All categories";
  const description = isZh
    ? "ArcLibrary 全部领域、层级与章节一览。"
    : "Every domain, level, and chapter in the ArcLibrary wiki.";
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = `/${l}/categories`;
  return {
    title,
    description,
    alternates: { canonical: path, languages },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: `${title} · ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: isZh ? "zh_CN" : "en_US",
      images: [
        {
          url: ogImageUrl({
            title,
            description,
            kicker: "All categories",
            lang: localeParam,
          }),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [
        ogImageUrl({
          title,
          description,
          kicker: "All categories",
          lang: localeParam,
        }),
      ],
    },
  };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!LOCALES.includes(lang as Locale)) notFound();
  const localeParam = lang as Locale;

  const overview = CATEGORIES.map((c) => {
    const levels = LEVELS.map((l) => ({
      level: l,
      groups: listTopicsGrouped(localeParam, c.slug, l.slug),
    }));
    const total = levels.reduce(
      (s, lv) => s + lv.groups.reduce((ss, g) => ss + g.topics.length, 0),
      0,
    );
    return { category: c, levels, total };
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section
          id="categories"
          className="mx-auto w-full px-6 pt-20 sm:px-8 sm:pt-24"
        >
          <CategoriesHeader />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {overview.map((o) => (
              <CategoryCard
                key={o.category.slug}
                category={o.category}
                count={o.total}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto w-full px-6 py-24 sm:px-8 sm:py-28">
          <CategoriesListHeader />

          <div className="space-y-20">
            {overview.map((o) => (
              <CategoryOverview
                key={o.category.slug}
                entry={o}
                lang={localeParam}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function CategoryOverview({
  entry,
  lang,
}: {
  entry: {
    category: (typeof CATEGORIES)[number];
    levels: Array<{
      level: (typeof LEVELS)[number];
      groups: ChapterGroup[];
    }>;
    total: number;
  };
  lang: Locale;
}) {
  const { category, levels, total } = entry;
  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded border border-border text-fg">
            <Icon name={category.icon} className="h-4 w-4" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              {category.tagline}
            </div>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-fg">
              {pick(category.name, lang)}
            </h3>
          </div>
        </div>
        <Link
          href={`/${lang}/${category.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle transition hover:text-fg"
        >
          {total} topics →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">
        {levels.map(({ level, groups }, idx) => (
          <div key={level.slug}>
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
                {`L${idx + 1}`}
              </span>
              <span className="text-[15px] font-semibold text-fg">
                {pick(level.name, lang)}
              </span>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-fg-subtle">
                {groups.reduce((s, g) => s + g.topics.length, 0)}
              </span>
            </div>

            {groups.length === 0 ? (
              <div className="rounded border border-dashed border-border px-4 py-6 text-center text-[12px] text-fg-subtle">
                {lang === "zh" ? "敬请期待" : "Coming soon"}
              </div>
            ) : (
              <div className="space-y-7">
                {groups.map((group) => (
                  <div key={group.chapter}>
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="font-mono text-[10px] tabular-nums text-fg-subtle">
                        {String(group.chapterOrder).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
                        {group.chapterTitle}
                      </span>
                    </div>
                    <ul className="flex flex-col">
                      {group.topics.map((t) => (
                        <li key={t.slug}>
                          <Link
                            href={`/${lang}/${category.slug}/${level.slug}/${t.slug}`}
                            className="group flex items-center justify-between border-b border-border/60 py-2 text-[14px] text-fg-muted transition hover:text-fg"
                          >
                            <span>{t.title}</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle opacity-0 transition group-hover:opacity-100">
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
