"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocale } from "@/i18n/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-32 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle">
          {t.notFound.code}
        </div>
        <h1 className="mt-2 text-5xl font-semibold tracking-tight text-fg">
          {t.notFound.title}
        </h1>
        <p className="mt-4 text-fg-muted">{t.notFound.description}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded border border-fg bg-fg px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
        >
          {t.notFound.home}
        </Link>
      </main>
    </div>
  );
}
