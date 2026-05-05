"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

export function CodeBlock({
  children,
  rawCode,
  lang,
  preview = false,
}: {
  children: ReactNode;
  rawCode: string;
  lang?: string;
  preview?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  const canPreview = preview && !!lang && /^(html|svg)$/i.test(lang);

  return (
    <div className="code-block">
      <div className="code-toolbar">
        {canPreview && (
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            title={showPreview ? "隐藏预览" : "显示预览"}
          >
            {showPreview ? (
              <EyeOff className="h-3 w-3" strokeWidth={1.7} />
            ) : (
              <Eye className="h-3 w-3" strokeWidth={1.7} />
            )}
            {showPreview ? "Hide" : "Preview"}
          </button>
        )}
        <button type="button" onClick={copy} title="复制代码">
          {copied ? (
            <Check className="h-3 w-3" strokeWidth={1.8} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={1.6} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {children}
      {canPreview && showPreview && (
        <div className="mt-2 overflow-hidden rounded border border-border">
          <div className="border-b border-border bg-bg-subtle px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
            Live preview
          </div>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            srcDoc={
              lang?.toLowerCase() === "svg"
                ? `<!doctype html><html><body style="margin:0;padding:12px;background:transparent">${rawCode}</body></html>`
                : rawCode
            }
            className="block h-64 w-full bg-white text-black"
            title="code preview"
          />
        </div>
      )}
    </div>
  );
}
