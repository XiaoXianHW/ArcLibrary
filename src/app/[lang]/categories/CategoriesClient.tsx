"use client";

import { CATEGORIES } from "@/lib/config";
import { useLocale } from "@/i18n/LocaleProvider";

export function CategoriesHeader() {
  const { t } = useLocale();
  return (
    <div className="mb-10 flex items-end justify-between">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-subtle">
          {t.categories.eyebrow}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg">
          {t.categories.title}
        </h2>
      </div>
      <div className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle sm:block">
        {t.categories.domains(CATEGORIES.length)}
      </div>
    </div>
  );
}

export function CategoriesListHeader() {
  const { t } = useLocale();
  return (
    <div className="mb-12">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-subtle">
        {t.categories.listEyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg">
        {t.categories.listTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-fg-muted">
        {t.categories.listLead}
      </p>
    </div>
  );
}
