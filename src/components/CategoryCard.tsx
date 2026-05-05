"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "./Icon";
import type { Category } from "@/lib/config";
import { pick } from "@/lib/config";
import { useLocale } from "@/i18n/LocaleProvider";

export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  const { locale, t } = useLocale();
  return (
    <Link
      href={`/${locale}/${category.slug}`}
      className="group relative flex flex-col rounded border border-border p-8 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded border border-border text-fg">
          <Icon name={category.icon} className="h-[18px] w-[18px]" />
        </div>
        <ArrowUpRight
          className="h-5 w-5 text-fg-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
          strokeWidth={1.5}
        />
      </div>

      <div className="mt-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-subtle">
          {category.tagline}
        </div>
        <h3 className="mt-2 text-3xl font-semibold tracking-tight text-fg">
          {pick(category.name, locale)}
        </h3>
        <p className="mt-4 text-[14px] leading-relaxed text-fg-muted">
          {pick(category.description, locale)}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5 text-[12px] text-fg-subtle">
        <span>
          <span className="font-mono tabular-nums text-fg">{count}</span>
          <span className="ml-1">{t.level.topics}</span>
        </span>
        <span className="font-mono uppercase tracking-[0.18em]">
          {pick(category.shortName, locale)}
        </span>
      </div>
    </Link>
  );
}
