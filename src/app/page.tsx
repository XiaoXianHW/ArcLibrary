import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/dict";

/**
 * The root path serves no content of its own; it just routes the visitor
 * into one of the localised trees. We sniff `Accept-Language` and prefer
 * any locale ArcLibrary actually has content for; otherwise we land on
 * the default. The Vercel CDN does not vary on Accept-Language by default
 * which means CDN caching of `/` is per-locale-after-first-visit safe.
 */
export const dynamic = "force-dynamic";

function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? Number(qPart.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of wanted) {
    for (const locale of LOCALES) {
      if (tag === locale || tag.startsWith(`${locale}-`)) return locale;
    }
  }
  return DEFAULT_LOCALE;
}

export default async function RootRedirect() {
  const h = await headers();
  const locale = pickLocaleFromAcceptLanguage(h.get("accept-language"));
  redirect(`/${locale}`);
}
