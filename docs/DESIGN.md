# ArcLibrary — Design System

This document is the source of truth for **ArcLibrary**'s visual language.
It exists so that contributors (humans and AI) can add new pages, components,
and content without breaking the look-and-feel of the rest of the site.

The system is intentionally small: a flat token table, a short list of
components, a few typography rules, and one accessibility checklist. If a
choice isn't listed here, prefer the closest existing pattern over inventing
a new one.

---

## 1. Design Principles

| Principle             | What it means in practice                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Editorial first**   | The wiki article is the hero. Everything else (chrome, AI, search) recedes when the user is reading.                     |
| **One-key palette**   | One neutral grey scale per theme. Color is reserved for *meaning* (highlight, callout severity), never decoration.       |
| **Hairline geometry** | Every container edge is a 1px hairline. No drop shadows on content; reserve elevation for floating UI (panel, dialog).   |
| **Mono for metadata** | Sans for prose, mono for *labels about the prose* (eyebrows, taglines, version stamps, tool traces).                     |
| **Calm motion**       | Animations are short (<= 600ms), ease-out, and skipped under `prefers-reduced-motion`.                                   |
| **Keyboard parity**   | Every interactive UI has a visible focus state and a keyboard path. The AI panel and search dialog both close on `Esc`.  |

---

## 2. Color Tokens

Tokens live in `src/app/globals.css` as CSS custom properties on `:root`.
Tailwind aliases them in `tailwind.config.ts` (`bg`, `bg-subtle`, `bg-elevated`,
`fg`, `fg-muted`, `fg-subtle`, `border`, `border-strong`).

### Dark theme (default — `:root`, `:root[data-theme="dark"]`)

| Token                     | Value                          | Used for                                                              |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `--bg`                    | `#0e0e10`                      | Page background                                                       |
| `--bg-subtle`             | `#141416`                      | Card / sidebar / hover                                                |
| `--bg-elevated`           | `#1a1a1d`                      | Inline `code`, popovers                                               |
| `--border`                | `#25252a`                      | Default hairline                                                      |
| `--border-strong`         | `#34343a`                      | Hover / active border                                                 |
| `--fg`                    | `#d8d8dc`                      | Body text, headings                                                   |
| `--fg-muted`              | `#9b9ba3`                      | Paragraph copy, list items                                            |
| `--fg-subtle`             | `#6c6c75`                      | Eyebrows, captions, taglines                                          |
| `--code-bg`               | `#131316`                      | `pre` code blocks                                                     |
| `--highlight-bg`          | `rgba(255, 213, 92, 0.32)`     | Search / AI match background                                          |
| `--highlight-bg-strong`   | `rgba(255, 213, 92, 0.55)`     | The *primary* AI match (the one we scrolled to)                       |
| `--highlight-ring`        | `rgba(255, 213, 92, 0.7)`      | 1px ring around match + pulse color                                   |
| `--highlight-fg`          | `#fff7c2`                      | Text color inside a match                                             |

### Light theme (`:root[data-theme="light"]`)

| Token                     | Value                          |
| ------------------------- | ------------------------------ |
| `--bg`                    | `#ffffff`                      |
| `--bg-subtle`             | `#f4f4f6`                      |
| `--bg-elevated`           | `#ececef`                      |
| `--border`                | `#d4d4d8`                      |
| `--border-strong`         | `#a1a1aa`                      |
| `--fg`                    | `#09090b`                      |
| `--fg-muted`              | `#3f3f46`                      |
| `--fg-subtle`             | `#71717a`                      |
| `--code-bg`               | `#f1f1f3`                      |
| `--highlight-bg`          | `rgba(255, 213, 0, 0.55)`      |
| `--highlight-bg-strong`   | `rgba(255, 196, 0, 0.85)`      |
| `--highlight-ring`        | `rgba(217, 119, 6, 0.6)`       |
| `--highlight-fg`          | `#1a1a00`                      |

### Color usage rules

- **Don't hardcode hex values in components.** Use the Tailwind alias (`text-fg-muted`,
  `border-border`) or a CSS var (`var(--bg-subtle)`).
- **Color carries meaning.** Yellow = "matched / highlighted". The Callout
  component is the only place severity color (info / tip / warn / danger)
  appears, and its variants reuse the neutral border + an icon — they
  intentionally avoid full-bleed colored backgrounds.
- **Theme switches.** `ThemeProvider` toggles `data-theme` on `<html>`;
  every token resolves automatically. Never gate styles on a JS-derived
  `theme === "dark"` boolean — let CSS do the work.

---

## 3. Typography

| Role             | Font stack                                                                                                | Size / weight                                | Notes                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Body / UI        | `Inter, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`      | 14–16.5px / 400–500                          | Set on `html, body` in `globals.css`               |
| Headings (page)  | Same sans, 600                                                                                            | h1 36–80px (Hero), h2 1.55rem, h3 1.15rem    | `letter-spacing: -0.01em` for h1                   |
| Wiki article H1  | `"Source Han Serif", "Noto Serif SC", "Songti SC", Georgia, serif`                                       | 2.6rem / 600                                 | Class: `.wiki-title`                               |
| Mono / labels    | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`                                             | 10–12px, `letter-spacing: 0.18–0.28em`, UPPERCASE | Eyebrows, footer version, tool badges              |
| Code (inline)    | Mono, 0.88em, `--bg-elevated` background, 1px border                                                      | —                                            | Inside `.prose-arc`                                |
| Code (block)     | Mono, 0.875rem, `--code-bg` background, 1px border, 8px radius                                            | —                                            | `pre` blocks; syntax via `rehype-pretty-code`      |

### Headings inside articles (`.prose-arc`)

- `h2` always renders with a top hairline (`border-top: 1px solid var(--border)`,
  `padding-top: 2rem`), except the first which is borderless. This is the
  "section divider" rhythm.
- All headings have `scroll-margin-top: 100px` so anchor jumps clear the
  sticky header.

### Numbers

- Tabular figures aren't enforced; if you need columns to align, wrap the
  number block in mono.

---

## 4. Spacing & Layout

- The site is laid out on the body by default (no global container). Pages
  set their own padding (`px-10 sm:px-16 lg:px-24 xl:px-32` is the canonical
  Hero pattern).
- Article body width is unconstrained (`max-w-none`) — the surrounding column
  (`<article class="prose-arc">`) enforces line length via line-height + base
  font size, not via a width clamp. Reading line is roughly 72ch.
- Vertical rhythm in `.prose-arc`:
  - paragraphs `1.15rem` top/bottom
  - h2 `3.25rem 0 1.1rem` (huge breathing room above sections)
  - h3 `2rem 0 0.75rem`
  - code blocks `1.5rem 0`
- Sticky header is `h-16` and uses `bg-bg/85 backdrop-blur-md`. Anything
  fixed (AI launcher, dialogs) sits above with explicit `z-40`/`z-50`.

---

## 5. Borders, Radii, Elevation

| Property            | Value(s)                                                  |
| ------------------- | --------------------------------------------------------- |
| Hairline            | `1px solid var(--border)` (utility class `.hairline`)     |
| Strong border       | `1px solid var(--border-strong)` (interactive states)     |
| Radius — small      | `2–4px` (inline tags, badges)                             |
| Radius — medium     | `6–8px` (buttons, panels, code blocks)                    |
| Radius — full       | `9999px` (avatar dot, AI launcher)                        |
| Shadow — panel only | `-12px 0 32px -12px rgba(0,0,0,0.18)` (AI side panel)     |
| Shadow — content    | None. Use a hairline instead.                             |

---

## 6. Motion

Defined in `tailwind.config.ts` and `globals.css`.

| Animation                | Duration / easing     | When                                    |
| ------------------------ | --------------------- | --------------------------------------- |
| `fade-in`                | 500ms ease-out        | Cards / categories on first paint       |
| `arc-reveal`             | 550ms ease-out        | Reveal-on-scroll utility                |
| `arc-highlight-pulse`    | 1800ms ease-out, 1×   | The primary AI / search match           |
| `shine`                  | 8s linear infinite    | Eyebrow accent (decorative)             |
| Panel slide              | 300ms ease-out        | AI panel `translate-x` enter / exit     |

All custom animations are wrapped in `@media (prefers-reduced-motion: reduce)`
fallbacks that disable them.

---

## 7. Components

Located in `src/components/`. Each one is a thin Tailwind composition over
the tokens above — they are **not** parameterized variants of a shared
primitive on purpose. Add new components the same way.

| Component                | Role                                                                 | Notes                                                          |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `SiteHeader`             | Sticky header with brand, search trigger, header actions             | `sticky top-0 z-40`, blurred bg                                |
| `Sidebar`                | Per-category nav drawer                                              | Hairline borders, mono section labels                          |
| `Hero` (`HeroSimple`)    | Landing screen                                                       | Big serif-feel sans h1, mono eyebrow, two CTAs                 |
| `CategoryCard`           | Grid card on `/categories`                                           | Icon + title + description + count                             |
| `LevelTabs`              | beginner / advanced / ecosystem switcher                             | Pill-shaped, `border-border-strong` active state               |
| `Toc`                    | Right-rail table of contents                                         | Mono labels, scroll-spy                                        |
| `MdxComponents`          | The MDX surface (`<Callout>`, `<KV>`, `<Compare>`, `<Steps>`, `<Tag>`) | All rendered with hairlines, no shadows                       |
| `CodeBlock`              | Wraps `pre` to add the copy button + language label                  | Uses Shiki via `rehype-pretty-code`                            |
| `Mermaid`                | Client-side diagram                                                  | Theme-aware via `data-theme` attribute                         |
| `SearchDialog`           | ⌘K palette, Fuse.js-backed                                           | Reuses `.arc-highlight` for matches                            |
| `ThemeProvider`          | Sets `data-theme` on `<html>`                                        | Persists choice in `localStorage`                              |
| `AiAssistant` + `ChatPanel` | Right-side AI panel                                               | Token-buffered streaming, tool-trace cards                     |
| `HighlightOnLoad`        | Reads `sessionStorage["arc-pending-highlight"]` and marks the article | Also listens for `arc:highlight` `CustomEvent` (re-fire)      |

### Buttons

There is no `<Button>` primitive. Buttons are inline Tailwind compositions
that follow these conventions:

- **Primary** — solid `bg-fg text-bg`, 1px `border-border-strong`,
  `hover:scale-[1.03]` (used on the AI launcher and Hero CTAs).
- **Secondary** — `border-border` → `hover:border-border-strong`,
  `hover:bg-bg-subtle`. No fill change at rest.
- **Icon-only** — `rounded-md p-1.5 text-fg-subtle hover:bg-bg-subtle hover:text-fg`.
- All buttons have an explicit `aria-label` when they don't render visible text.

### Cards

- Always 1px `border border-border`.
- Padding scale: `px-3 py-2` (compact), `px-5 py-4` (header), `p-6` or
  `p-8` (content card on grids).
- Hover: bump border to `border-border-strong` and optionally swap bg to
  `bg-bg-subtle`. Never animate a shadow on a content card.

---

## 8. Highlight & Search Affordance

This is the one place color leaves the neutral palette, so it gets explicit
rules:

- All matches get `mark.arc-highlight`: `--highlight-bg` background,
  `--highlight-fg` text, 1px `--highlight-ring` shadow, `font-weight: 600`,
  3px radius. This must be visible on **both** themes — verified in the
  Light/Dark token tables above.
- The single match the user was navigated to gets an **additional**
  `.arc-highlight--primary` class that swaps in `--highlight-bg-strong` and
  runs the `arc-highlight-pulse` keyframe once. The pulse is a ring + a 4%
  scale bump that decays back to flat.
- `HighlightOnLoad` is responsible for finding occurrences, applying both
  classes, and scrolling the primary match into view (`block: "center"`).
  It also exposes a runtime `window.dispatchEvent(new CustomEvent("arc:highlight", { detail: { phrase } }))`
  hook so the AI panel can re-fire on the same page without a navigation.

---

## 9. Theming

- The default theme is **dark** (matches the chosen editorial aesthetic
  — high contrast, low chroma, dense type).
- `ThemeProvider` writes `data-theme="light" | "dark"` on `<html>` and saves
  the user choice in `localStorage["arc-theme"]`. It also honors
  `prefers-color-scheme` on first load.
- Mermaid diagrams re-render when the theme changes (see `Mermaid.tsx`).
- shiki / `rehype-pretty-code` ships dual themes; CSS variables overlay the
  background/borders so blocks stay consistent across modes.

---

## 10. Internationalization

- Locale flips with `<html lang>` and a body class. Strings live in
  `src/i18n/dict.ts`.
- The Chinese stack uses **PingFang SC / Hiragino Sans GB / Microsoft YaHei**
  for UI, and **Source Han Serif / Noto Serif SC / Songti SC** for the
  article H1.
- Don't hardcode user-facing strings in components — extend `Dict` instead.

---

## 11. Accessibility

| Area               | Requirement                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Color contrast     | Body copy ≥ 4.5:1 (`fg-muted` on `bg`, both themes pass). Headings ≥ 7:1 (`fg` on `bg`).               |
| Focus              | Visible focus ring on every interactive element. Don't `outline: none` without replacing it.            |
| Keyboard           | All overlays close on `Esc`. SearchDialog is fully arrow-key navigable.                                 |
| Motion             | Every keyframe has a `prefers-reduced-motion: reduce` opt-out.                                          |
| Landmarks          | `<header>`, `<aside role="dialog">` (AI panel), `<main>`, `<footer>`.                                  |
| Alt text           | All `img` in MDX must include `alt`. Decorative icons use `aria-hidden`.                                |
| Live regions       | The streaming AI response is rendered into a live `aside` — screen readers announce on `delta` events. |

---

## 12. Iconography

- Library: [`lucide-react`](https://lucide.dev/). Don't import other icon
  packs.
- Default size 4 (16px), stroke width `1.7` (UI) or `2` (primary buttons).
  Stroke `1.5` is reserved for "decorative" icons inside copy.

---

## 13. Tone of Voice

- UI labels are imperative and short ("Browse categories", "Ask AI", "Copy
  Markdown"). No marketing fluff.
- Empty states explain what the user sees and what to do next, never just
  "No data".
- Error messages name the cause when known ("OPENAI_BASE_URL invalid"),
  generic only as a last resort.

---

## 14. When in doubt

1. Open an existing page that solves the closest problem and copy its
   structure.
2. Use Tailwind aliases (`bg-bg-subtle`, `text-fg-muted`, `border-border`)
   instead of hex.
3. Prefer hairlines over shadows.
4. Prefer one shared token over inventing a new variant.
5. If you find yourself wanting a new color, double-check whether you
   actually want a new *meaning* (in which case extend §2) or just a one-off
   (in which case use a transparent overlay of an existing token).
