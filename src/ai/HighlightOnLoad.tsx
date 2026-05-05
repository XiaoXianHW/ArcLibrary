"use client";

import { useEffect } from "react";

const KEY = "arc-pending-highlight";

export function HighlightOnLoad() {
  useEffect(() => {
    // Always listen for runtime highlight requests dispatched by the AI panel
    // (or anyone else) — including the case where the user is already on the
    // page and we just need to scroll + paint a section.
    const onHighlight = (e: Event) => {
      const detail = (e as CustomEvent<{ phrase: string }>).detail;
      if (detail?.phrase) applyHighlight(detail.phrase);
    };
    window.addEventListener("arc:highlight", onHighlight);

    // If the page was just navigated to with a pending phrase, fire it once
    // the layout has settled.
    let phrase: string | null = null;
    try {
      phrase = sessionStorage.getItem(KEY);
      if (phrase) sessionStorage.removeItem(KEY);
    } catch {}
    let timer: number | undefined;
    if (phrase) {
      timer = window.setTimeout(() => applyHighlight(phrase!), 120);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("arc:highlight", onHighlight);
    };
  }, []);
  return null;
}

/**
 * Find and visually mark the best occurrence(s) of `phrase` inside the article
 * body. Strategy:
 *   1. Try the full phrase (case-insensitive).
 *   2. If nothing matches, fall back to the longest individual word (>= 2
 *      chars) in the phrase. This handles cases where the AI hands us a
 *      paraphrase that doesn't appear verbatim.
 * The first match gets `.arc-highlight--primary` and is scrolled into view.
 */
/** Block-level elements considered "good targets" to wrap with the
 *  paragraph-fill highlight. We walk up from the matched <mark> until we
 *  find one of these. */
const BLOCK_TAGS = new Set([
  "P",
  "LI",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TD",
  "TH",
  "FIGCAPTION",
  "DD",
  "DT",
  "SUMMARY",
]);

function findBlockAncestor(el: HTMLElement, root: HTMLElement): HTMLElement {
  let cur: HTMLElement | null = el;
  while (cur && cur !== root) {
    if (BLOCK_TAGS.has(cur.tagName)) return cur;
    cur = cur.parentElement;
  }
  return el;
}

function applyHighlight(phrase: string) {
  const root = document.querySelector("article.prose-arc") as HTMLElement | null;
  if (!root) return;

  // Clear any prior inline marks.
  root.querySelectorAll("mark.arc-highlight").forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
  // Clear any prior block highlights.
  root
    .querySelectorAll(".arc-highlight-block")
    .forEach((b) =>
      b.classList.remove("arc-highlight-block", "arc-highlight-block--primary"),
    );

  const candidates = buildCandidates(phrase);
  for (const needle of candidates) {
    const first = markOccurrences(root, needle);
    if (first) {
      const block = findBlockAncestor(first, root);
      // Use rAF so the layout settles before we scroll.
      requestAnimationFrame(() => {
        // Re-trigger sweep if the element was already on screen.
        block.classList.remove(
          "arc-highlight-block",
          "arc-highlight-block--primary",
        );
        // force reflow so animation restarts
        void (block as HTMLElement).offsetWidth;
        block.classList.add("arc-highlight-block", "arc-highlight-block--primary");
        first.classList.add("arc-highlight--primary");
        block.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
  }
}

function buildCandidates(phrase: string): string[] {
  const trimmed = phrase.trim();
  if (!trimmed) return [];
  const out: string[] = [trimmed];
  const words = trimmed
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}_-]+/gu, ""))
    .filter((w) => w.length >= 2)
    .sort((a, b) => b.length - a.length);
  for (const w of words) if (!out.includes(w)) out.push(w);
  return out;
}

function markOccurrences(root: HTMLElement, needle: string): HTMLElement | null {
  const lower = needle.toLowerCase();
  if (!lower) return null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (parent && /^(SCRIPT|STYLE|CODE|PRE|MARK)$/.test(parent.tagName))
        return NodeFilter.FILTER_REJECT;
      return node.nodeValue.toLowerCase().includes(lower)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let first: HTMLElement | null = null;
  const matches: Text[] = [];
  let node: Node | null = walker.nextNode();
  while (node) {
    matches.push(node as Text);
    if (matches.length >= 20) break;
    node = walker.nextNode();
  }

  for (const text of matches) {
    const value = text.nodeValue ?? "";
    const lowerValue = value.toLowerCase();
    let cursor = 0;
    const frag = document.createDocumentFragment();
    while (true) {
      const idx = lowerValue.indexOf(lower, cursor);
      if (idx < 0) {
        if (cursor < value.length) {
          frag.appendChild(document.createTextNode(value.slice(cursor)));
        }
        break;
      }
      if (idx > cursor) {
        frag.appendChild(document.createTextNode(value.slice(cursor, idx)));
      }
      const mark = document.createElement("mark");
      mark.className = "arc-highlight";
      mark.textContent = value.slice(idx, idx + lower.length);
      frag.appendChild(mark);
      if (!first) {
        first = mark;
        first.classList.add("arc-highlight--primary");
      }
      cursor = idx + lower.length;
    }
    text.parentNode?.replaceChild(frag, text);
  }

  return first;
}
