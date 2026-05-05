"use client";

import Link from "next/link";
import { LEVELS, pick } from "@/lib/config";
import { useLocale } from "@/i18n/LocaleProvider";

export function LevelTabs({
  category,
  active,
}: {
  category: string;
  active: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="sticky top-16 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full items-center justify-center gap-1 px-4 sm:h-14 sm:justify-start sm:gap-2 sm:px-8">
        {LEVELS.map((l, i) => {
          const isActive = l.slug === active;
          return (
            <Link
              key={l.slug}
              href={`/${locale}/${category}/${l.slug}`}
              className={`relative inline-flex h-12 items-center gap-2 px-3 text-[13px] transition sm:h-14 sm:px-4 ${
                isActive ? "text-fg" : "text-fg-subtle hover:text-fg"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
                {`L${i + 1}`}
              </span>
              <span>{pick(l.name, locale)}</span>
              {isActive && (
                <span className="absolute inset-x-3 bottom-[-1px] h-[2px] bg-fg sm:inset-x-4" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
