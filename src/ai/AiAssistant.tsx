"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { ChatPanel } from "./ChatPanel";

export function AiAssistant() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => setConfigured(false));
  }, []);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // toggle a body attribute that CSS uses to shift main content
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.documentElement.setAttribute("data-ai-open", "true");
    } else {
      document.documentElement.removeAttribute("data-ai-open");
    }
    return () => {
      document.documentElement.removeAttribute("data-ai-open");
    };
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.nav.askAi}
          title={t.nav.askAi}
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-border-strong bg-fg px-5 text-[13px] font-medium text-bg shadow-lg transition hover:scale-[1.03]"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          <span>{t.ai.title}</span>
        </button>
      )}

      <ChatPanel
        open={open}
        configured={configured ?? false}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
