"use client";

import Link from "next/link";
import { SearchTrigger } from "./SearchDialog";
import { HeaderActions } from "./HeaderActions";
import { useLocale } from "@/i18n/LocaleProvider";

export function SiteHeader() {
  const { locale } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center gap-2 px-3 sm:gap-6 sm:px-8">
        <Link
          href={`/${locale}`}
          className="shrink-0 text-[14px] font-semibold tracking-[0.02em] text-fg transition hover:text-fg-muted"
        >
          ArcLibrary
        </Link>

        {/* On mobile this collapses to an icon button so brand + lang + theme + GitHub stay visible. */}
        <div className="ml-auto flex flex-1 items-center justify-end sm:ml-0 sm:justify-center">
          <div className="w-auto sm:w-full sm:max-w-[640px]">
            <SearchTrigger />
          </div>
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}
