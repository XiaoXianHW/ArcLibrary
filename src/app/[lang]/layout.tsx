import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/dict";
import { LocaleSync } from "@/i18n/LocaleSync";
import {
  SITE_DESCRIPTION_EN,
  SITE_DESCRIPTION_ZH,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site";

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
  const isZh = lang === "zh";
  const title = isZh
    ? `${SITE_NAME} · 个人知识库`
    : `${SITE_NAME} · Personal Knowledge Wiki`;
  const description = isZh ? SITE_DESCRIPTION_ZH : SITE_DESCRIPTION_EN;
  const path = `/${lang}`;
  const alternates: Record<string, string> = {};
  for (const l of LOCALES) alternates[l] = `${SITE_URL}/${l}`;
  alternates["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}`;
  return {
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    alternates: {
      canonical: path,
      languages: alternates,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      title,
      description,
      locale: isZh ? "zh_CN" : "en_US",
      alternateLocale: isZh ? ["en_US"] : ["zh_CN"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!LOCALES.includes(lang as Locale)) notFound();

  return (
    <>
      <LocaleSync lang={lang as Locale} />
      {children}
    </>
  );
}
