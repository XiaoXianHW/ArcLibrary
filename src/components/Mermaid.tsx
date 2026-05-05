"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Mermaid measures html label heights with the *currently* loaded
        // fonts. If a custom font (e.g. Inter / PingFang) hasn't finished
        // loading yet, multi-line labels get measured as one line and the
        // lower rows are clipped by the node rect. Wait for fonts first to
        // avoid the well-known htmlLabels clipping bug.
        if (typeof document !== "undefined") {
          const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
          if (fonts?.ready) {
            try {
              await fonts.ready;
            } catch {
              /* font loader can reject in private mode — ignore */
            }
          }
        }

        const mod = await import("mermaid");
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme === "dark" ? "dark" : "default",
          // padding/nodeSpacing widened so wrapped CJK labels don't get
          // their second line cropped by the surrounding rect.
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            padding: 14,
            nodeSpacing: 36,
            rankSpacing: 56,
            curve: "basis",
          },
          sequence: { useMaxWidth: true },
          themeVariables:
            theme === "dark"
              ? {
                  background: "#0f0f0f",
                  primaryColor: "#1c1c1c",
                  primaryTextColor: "#f4f4f5",
                  primaryBorderColor: "#2a2a2a",
                  lineColor: "#a1a1aa",
                }
              : {
                  background: "#f7f7f8",
                  primaryColor: "#ffffff",
                  primaryTextColor: "#0a0a0a",
                  primaryBorderColor: "#d0d0d4",
                  lineColor: "#4a4a52",
                },
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Inter', 'PingFang SC', sans-serif",
        });
        const id = "m-" + Math.random().toString(36).slice(2, 9);
        let rendered: string;
        try {
          const out = await mermaid.render(id, code);
          rendered = out.svg;
        } finally {
          if (typeof document !== "undefined") {
            document
              .querySelectorAll(`#${id}, [id^="d${id}"]`)
              .forEach((el) => el.remove());
          }
        }
        if (!cancelled) {
          setSvg(rendered);
          if (ref.current) ref.current.innerHTML = rendered;
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  const open = useCallback(() => {
    if (svg) setZoomed(true);
  }, [svg]);

  if (error) {
    return (
      <pre className="my-6 overflow-auto rounded border border-dashed border-border bg-bg-subtle p-4 text-[12px] text-fg-muted">
        <code>{code}</code>
        <div className="mt-2 text-fg-subtle">[mermaid] {error}</div>
      </pre>
    );
  }

  return (
    <>
      <div
        className="mermaid-block group relative my-6 cursor-zoom-in overflow-x-auto rounded-md border border-border bg-bg-subtle/40 p-4"
        onClick={open}
        role="button"
        tabIndex={0}
        aria-label="Click to expand diagram"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          aria-label="Expand"
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-bg/80 text-fg-muted opacity-0 backdrop-blur transition hover:border-border-strong hover:text-fg group-hover:opacity-100 sm:right-3 sm:top-3"
        >
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
        <div ref={ref} suppressHydrationWarning />
      </div>
      {zoomed && <MermaidLightbox svg={svg} onClose={() => setZoomed(false)} />}
    </>
  );
}

function MermaidLightbox({
  svg,
  onClose,
}: {
  svg: string;
  onClose: () => void;
}) {
  // Lock scroll on the underlying page while the lightbox is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-md"
        aria-hidden
      />

      <div className="relative z-10 flex items-center justify-between border-b border-border bg-bg/70 px-4 py-2 sm:px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
          Diagram · click outside / esc to close
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition hover:bg-bg-subtle hover:text-fg"
        >
          <X className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      {/* Inner area: pannable + pinch-zoomable on touch devices.
         The SVG itself can grow beyond container width; overflow auto + the
         CSS below makes the diagram readable on any screen. */}
      <div
        className="relative z-10 flex-1 overflow-auto p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: "pinch-zoom", WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="mx-auto flex min-h-full w-fit min-w-full items-center justify-center"
          style={{ minHeight: "calc(100vh - 6rem)" }}
        >
          <div
            className="mermaid-zoomed"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>
  );
}
