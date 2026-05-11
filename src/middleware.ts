import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALES,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from "@/i18n/dict";

/**
 * Ensure every user-facing page is served under a locale prefix.
 *
 * Anything that doesn't already start with `/zh` or `/en` gets rewritten to
 * the visitor's preferred locale (based on `Accept-Language`, falling back to
 * the default). This covers both bare `/` and deep links like
 * `/ai/beginner/rag` that would otherwise hit the `[lang]` segment as
 * `lang="ai"` and 404.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const firstSegment = pathname.split("/", 2)[1];
  if (LOCALES.includes(firstSegment as Locale)) return NextResponse.next();

  const locale = pickLocaleFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  const target = request.nextUrl.clone();
  target.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  target.search = search;
  return NextResponse.redirect(target);
}

export const config = {
  // Exclude API routes, Next internals, and any request for a file with an
  // extension (favicon, og images, sitemap, etc.).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
