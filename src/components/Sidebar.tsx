"use client";

import Link from "next/link";
import type { ChapterGroup } from "@/lib/content";
import { useLocale } from "@/i18n/LocaleProvider";

export function Sidebar({
  groups,
  category,
  level,
  activeSlug,
}: {
  groups: ChapterGroup[];
  category: string;
  level: string;
  activeSlug?: string;
}) {
  const { t: i18n, locale } = useLocale();
  return (
    <aside className="scrollbar-hidden sticky top-[calc(4rem+3.5rem)] hidden h-[calc(100vh-4rem-3.5rem)] w-64 shrink-0 overflow-y-auto py-8 pr-6 lg:block">
      {groups.map((group, gi) => (
        <div key={group.chapter} className={gi === 0 ? "" : "mt-10"}>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-mono text-[10px] tabular-nums text-fg-subtle">
              {String(group.chapterOrder).padStart(2, "0")}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
              {group.chapterTitle}
            </span>
          </div>

          <nav className="flex flex-col">
            {group.topics.map((t) => {
              const isActive = activeSlug === t.slug;
              return (
                <Link
                  key={t.slug}
                  href={`/${locale}/${category}/${level}/${t.slug}`}
                  className={`relative flex items-center py-1.5 pl-4 text-[14px] leading-snug transition ${
                    isActive
                      ? "font-medium text-fg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-4 -translate-y-1/2 transition-all ${
                      isActive
                        ? "w-[2px] bg-fg"
                        : "w-[1px] bg-border"
                    }`}
                    aria-hidden
                  />
                  <span className="truncate">{t.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      {groups.length === 0 && (
        <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-fg-subtle">
          {i18n.sidebar.empty}
        </div>
      )}
    </aside>
  );
}
