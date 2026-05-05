"use client";

import { useEffect } from "react";
import { useLocale } from "./LocaleProvider";
import type { Locale } from "./dict";

/**
 * Keeps the in-memory `LocaleProvider` aligned with the URL `lang` segment.
 *
 * When Next.js renders `/zh/...` we mount this with `lang="zh"`; the
 * component then calls `setLocale("zh")` so all other client components
 * (search dialog, AI panel, lang toggle button, …) read the same value.
 * Without this, the LocaleProvider would always boot to its default and
 * disagree with the URL.
 */
export function LocaleSync({ lang }: { lang: Locale }) {
  const { locale, setLocale } = useLocale();
  useEffect(() => {
    if (locale !== lang) setLocale(lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    }
  }, [lang, locale, setLocale]);
  return null;
}
