import { redirect, notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/config";
import { LOCALES, type Locale } from "@/i18n/dict";

export function generateStaticParams() {
  const out: Array<{ lang: string; category: string }> = [];
  for (const lang of LOCALES) {
    for (const c of CATEGORIES) {
      out.push({ lang, category: c.slug });
    }
  }
  return out;
}

export default async function CategoryRoot({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}) {
  const { lang, category } = await params;
  if (!LOCALES.includes(lang as Locale)) notFound();
  const cat = getCategory(category);
  if (!cat) notFound();
  redirect(`/${lang}/${cat.slug}/beginner`);
}
