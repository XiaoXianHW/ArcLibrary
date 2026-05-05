"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search, Hash, ArrowRight, X, Command } from "lucide-react";
import { Icon } from "./Icon";
import { useLocale } from "@/i18n/LocaleProvider";

import type { Locale } from "@/i18n/dict";

type Entry = {
  id: string;
  type: "topic" | "heading";
  title: string;
  // Topic-only fields. Heading entries omit them to keep the per-locale
  // shard small; the renderer reads `parentTitle` instead when needed.
  description?: string;
  tags?: string[];
  body?: string;
  // Required for both — search filters and result row glyph.
  icon: string;
  category: string;
  level: string;
  chapter: string;
  chapterTitle: string;
  slug: string;
  // Heading-only.
  headingId?: string;
  parentTitle?: string;
};

// Module-level cache so the user only pays the network cost once per locale
// across the whole session, even if they open & close the modal repeatedly.
const SHARD_CACHE = new Map<Locale, Promise<Entry[]>>();
function loadShard(locale: Locale): Promise<Entry[]> {
  const cached = SHARD_CACHE.get(locale);
  if (cached) return cached;
  const p = fetch(`/search-index/${locale}.json`, { cache: "force-cache" })
    .then((r) => (r.ok ? (r.json() as Promise<Entry[]>) : []))
    .catch(() => [] as Entry[]);
  SHARD_CACHE.set(locale, p);
  return p;
}

const CATEGORY_LABEL: Record<string, string> = {
  ai: "人工智能",
  network: "计算机网络",
  ops: "系统运维",
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "新手",
  advanced: "进阶",
};
const CATEGORY_LABEL_EN: Record<string, string> = {
  ai: "Artificial Intelligence",
  network: "Networking",
  ops: "Operations",
};
const LEVEL_LABEL_EN: Record<string, string> = {
  beginner: "Beginner",
  advanced: "Advanced",
};

function buildHref(e: Entry, lang: Locale) {
  const base = `/${lang}/${e.category}/${e.level}/${e.slug}`;
  return e.type === "heading" && e.headingId ? `${base}#${e.headingId}` : base;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const tokens = query
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (tokens.length === 0) return text;
  const re = new RegExp(`(${tokens.join("|")})`, "gi");
  return text.split(re).map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="arc-highlight">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Mobile: icon-only button to keep header room for the brand + actions. */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition hover:bg-bg-subtle hover:text-fg sm:hidden"
        aria-label={t.search.placeholderShort}
      >
        <Search className="h-4 w-4" strokeWidth={1.6} />
      </button>

      {/* Desktop: full search field with ⌘K hint. */}
      <button
        onClick={() => setOpen(true)}
        className="group hidden h-10 w-full items-center gap-3 rounded-lg border border-border bg-bg-subtle px-4 text-[13px] text-fg-subtle transition hover:border-border-strong hover:text-fg-muted sm:inline-flex"
        aria-label={t.search.placeholderShort}
      >
        <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-left">{t.search.placeholderShort}</span>
        <span className="inline-flex items-center gap-0.5 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
          <Command className="h-3 w-3" strokeWidth={2} />K
        </span>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadShard(locale).then((d) => {
      if (!cancelled) setEntries(d);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Heading entries don't carry description/tags/body any more (those keys
  // are filtered out at the indexer level to keep the shard lean), so Fuse
  // safely ignores undefined fields on them.
  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: "title", weight: 5 },
          { name: "description", weight: 3 },
          { name: "chapterTitle", weight: 2 },
          { name: "tags", weight: 2 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
        minMatchCharLength: 1,
      }),
    [entries],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // empty query: show top topics from each category
      return entries.filter((e) => e.type === "topic").slice(0, 20);
    }
    return fuse.search(q, { limit: 24 }).map((r) => r.item);
  }, [query, fuse, entries]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({
      block: "nearest",
    });
  }, [active]);

  const navigate = useCallback(
    (e: Entry) => {
      router.push(buildHref(e, locale));
      onClose();
    },
    [router, onClose, locale],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) navigate(target);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
        style={{ background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}
        aria-hidden
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border-strong bg-bg-elevated shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-fg-subtle transition hover:bg-bg-subtle hover:text-fg"
            aria-label={t.search.esc}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto px-2 py-2"
        >
          {results.length === 0 && query && (
            <div className="px-3 py-12 text-center text-sm text-fg-subtle">
              {t.search.empty}
            </div>
          )}
          {results.length === 0 && !query && (
            <div className="px-3 py-12 text-center text-sm text-fg-subtle">
              {t.search.emptyHint}
            </div>
          )}
          {results.map((e, i) => (
            <Link
              key={e.id}
              href={buildHref(e, locale)}
              onClick={onClose}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                i === active
                  ? "bg-bg-subtle text-fg"
                  : "text-fg-muted hover:bg-bg-subtle"
              }`}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-bg text-fg-muted">
                {e.type === "heading" ? (
                  <Hash className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <Icon name={e.icon} className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">
                    {highlight(e.title, query)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-fg-subtle">
                  {(locale === "en" ? CATEGORY_LABEL_EN : CATEGORY_LABEL)[e.category] ?? e.category} ·{" "}
                  {(locale === "en" ? LEVEL_LABEL_EN : LEVEL_LABEL)[e.level] ?? e.level}
                  {e.chapterTitle ? ` · ${e.chapterTitle}` : ""}
                  {e.type === "heading" && e.parentTitle ? ` · ${e.parentTitle}` : ""}
                </div>
              </div>
              <ArrowRight
                className={`h-3.5 w-3.5 shrink-0 transition ${
                  i === active ? "text-fg" : "text-fg-subtle"
                }`}
                strokeWidth={1.5}
              />
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-bg px-3 py-2 text-[11px] text-fg-subtle">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑↓</kbd> {t.search.upDown}
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> {t.search.enter}
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> {t.search.esc}
            </span>
          </div>
          <span className="font-mono">{t.search.resultsCount(results.length)}</span>
        </div>
      </div>
    </div>
  );
}
