"use client";

import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, Languages } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import { useTheme } from "./ThemeProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { LOCALES, type Locale } from "@/i18n/dict";

/**
 * Replace the leading `/{currentLang}` segment in `pathname` with `next`.
 * If the pathname has no recognised lang prefix we just prepend one.
 */
function swapLangSegment(pathname: string, next: Locale): string {
  const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (match && (LOCALES as string[]).includes(match[1])) {
    return `/${next}${match[2] ?? ""}`;
  }
  return `/${next}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function HeaderActions() {
  const { theme, toggle } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const Icon = theme === "dark" ? Sun : Moon;

  const onToggleLang = () => {
    const next: Locale = locale === "zh" ? "en" : "zh";
    setLocale(next);
    router.push(swapLangSegment(pathname || "/", next));
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onToggleLang}
        title={t.nav.toggleLang}
        aria-label={t.nav.toggleLang}
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-fg-muted transition hover:bg-bg-subtle hover:text-fg"
      >
        <Languages className="h-4 w-4" strokeWidth={1.6} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {locale}
        </span>
      </button>
      <button
        type="button"
        onClick={toggle}
        title={t.nav.toggleTheme}
        aria-label={t.nav.toggleTheme}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition hover:bg-bg-subtle hover:text-fg"
      >
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </button>
      <a
        href="https://github.com/XiaoXianHW/ArcLibrary"
        target="_blank"
        rel="noreferrer"
        title={t.nav.github}
        aria-label={t.nav.github}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition hover:bg-bg-subtle hover:text-fg"
      >
        <GithubIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
