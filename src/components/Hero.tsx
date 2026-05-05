"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

export function HeroSimple() {
  const { t, locale } = useLocale();
  return (
    <section className="flex h-full flex-col">
      <div className="flex w-full flex-1 flex-col items-start justify-center px-10 sm:px-16 lg:px-24 xl:px-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-subtle">
          {t.home.eyebrow}
        </div>

        <h1 className="mt-8 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg sm:text-[64px] md:text-[80px]">
          {t.home.title1}
          <br />
          <span className="text-fg-muted">{t.home.title2}</span>
        </h1>

        <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-[16px]">
          {t.home.lead}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/categories`}
            className="inline-flex items-center gap-2 rounded border border-fg bg-fg px-5 py-2.5 text-[13px] font-medium text-bg transition hover:opacity-90"
          >
            {t.home.browseCategories}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
          </Link>
          <Link
            href={`/${locale}/ai/beginner`}
            className="inline-flex items-center gap-2 rounded border border-border px-5 py-2.5 text-[13px] font-medium text-fg transition hover:border-border-strong"
          >
            {t.home.startAi}
          </Link>
          <span className="ml-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t.home.askAi}
          </span>
        </div>
      </div>

      <footer className="border-t border-border">
        <div className="flex w-full items-center justify-between px-10 py-5 text-[12px] text-fg-subtle sm:px-16 lg:px-24 xl:px-32">
          <span>© {new Date().getFullYear()} ArcLibrary</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
            v0.4 · Built with Next.js &amp; MDX
          </span>
        </div>
      </footer>
    </section>
  );
}
