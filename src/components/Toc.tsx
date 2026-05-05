"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

export function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0.1 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="scrollbar-hidden sticky top-[calc(4rem+3.5rem)] hidden h-[calc(100vh-4rem-3.5rem)] w-44 shrink-0 overflow-y-auto py-12 pl-4 text-[12px] xl:block">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
        On this page
      </div>
      <ul className="space-y-0 border-l border-border">
        {items.map((it) => {
          const active = it.id === activeId;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={`block border-l-2 py-1.5 transition ${
                  it.level === 3 ? "pl-6" : "pl-4"
                } ${
                  active
                    ? "border-fg text-fg"
                    : "border-transparent text-fg-subtle hover:text-fg"
                }`}
                style={{ marginLeft: -1 }}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
