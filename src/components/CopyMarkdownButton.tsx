"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import { useLocale } from "@/i18n/LocaleProvider";

export function CopyMarkdownButton({
  raw,
  githubPath,
}: {
  raw: string;
  githubPath: string;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = raw;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } finally {
        ta.remove();
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={copy}
        title={t.topic.copyMarkdown}
        aria-label={t.topic.copyMarkdown}
        className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted transition hover:border-border-strong hover:text-fg"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        {copied ? t.topic.copied : t.topic.copyMarkdown}
      </button>
      <a
        href={`https://github.com/XiaoXianHW/ArcLibrary/blob/main/${githubPath}`}
        target="_blank"
        rel="noreferrer"
        title={t.topic.openInGithub}
        aria-label={t.topic.openInGithub}
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded border border-border text-fg-muted transition hover:border-border-strong hover:text-fg"
      >
        <GithubIcon className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
