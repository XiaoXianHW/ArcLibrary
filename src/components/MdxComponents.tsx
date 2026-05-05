import type { ReactNode } from "react";
import { Info, Lightbulb, AlertTriangle, ShieldAlert, Quote as QuoteIcon, Sparkles, Wand2 } from "lucide-react";

const calloutVariants = {
  info: { Icon: Info, label: "提示" },
  tip: { Icon: Lightbulb, label: "技巧" },
  warn: { Icon: AlertTriangle, label: "注意" },
  danger: { Icon: ShieldAlert, label: "警告" },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof calloutVariants;
  title?: string;
  children: ReactNode;
}) {
  const v = calloutVariants[type];
  const Icon = v.Icon;
  return (
    <div className="my-7 border-l-2 border-border-strong bg-bg-subtle/40 px-5 py-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-fg">
        <Icon className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
        <span>{title ?? v.label}</span>
      </div>
      <div className="text-[14px] leading-relaxed text-fg-muted [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-1.5">
        {children}
      </div>
    </div>
  );
}

/** "一句话懂" —— 最高优先级的核心定义卡 */
export function KeyIdea({ children }: { children: ReactNode }) {
  return (
    <div className="my-7 flex items-start gap-4 border-l-2 border-fg bg-bg-subtle/40 px-5 py-5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fg" strokeWidth={1.5} />
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
          核心 · Key Idea
        </div>
        <div className="mt-2 text-[15px] font-medium leading-[1.85] text-fg [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

/** "打个比方" —— 通俗类比 */
export function Analogy({ children }: { children: ReactNode }) {
  return (
    <div className="my-7 flex items-start gap-4 border border-dashed border-border px-5 py-4">
      <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.5} />
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-subtle">
          打个比方 · Analogy
        </div>
        <div className="mt-2 text-[14px] leading-[1.85] text-fg-muted [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Pull-quote —— 大字金句 */
export function Quote({ children, source }: { children: ReactNode; source?: string }) {
  return (
    <figure className="my-9 border-l-2 border-fg pl-6">
      <QuoteIcon className="mb-3 h-4 w-4 text-fg-muted" strokeWidth={1.5} />
      <blockquote className="text-[18px] font-medium leading-[1.7] tracking-tight text-fg">
        {children}
      </blockquote>
      {source && (
        <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          —— {source}
        </figcaption>
      )}
    </figure>
  );
}

/** 高亮关键术语 */
export function Term({ children, en }: { children: ReactNode; en?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 border-b border-fg-muted text-fg">
      <span className="font-medium">{children}</span>
      {en && <span className="font-mono text-[11px] text-fg-subtle">{en}</span>}
    </span>
  );
}

/** 关键术语清单 */
export function Terms({
  items,
}: {
  items: Array<{ term: string; en?: string; def: ReactNode }>;
}) {
  return (
    <div className="my-7 grid grid-cols-1 gap-0 border-y border-border sm:grid-cols-2">
      {items.map((it, i) => (
        <div
          key={i}
          className="border-border/60 px-5 py-4 sm:border-r sm:[&:nth-child(2n)]:border-r-0 [&:not(:last-child)]:border-b sm:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[14px] font-semibold text-fg">{it.term}</span>
            {it.en && (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
                {it.en}
              </span>
            )}
          </div>
          <div className="mt-2 text-[13px] leading-[1.75] text-fg-muted">
            {it.def}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Key-Value 卡片网格 */
export function KV({
  items,
}: {
  items: Array<{ k: string; v: ReactNode }>;
}) {
  return (
    <dl className="my-7 grid grid-cols-1 gap-0 border-y border-border sm:grid-cols-2">
      {items.map((it, i) => (
        <div
          key={i}
          className="border-border/60 px-5 py-4 sm:border-r sm:[&:nth-child(2n)]:border-r-0 [&:not(:last-child)]:border-b sm:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
            {it.k}
          </dt>
          <dd className="mt-2 text-[14px] leading-relaxed text-fg">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="mr-1 inline-block rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">
      {children}
    </span>
  );
}

export function Compare({
  left,
  right,
  leftTitle = "传统方案",
  rightTitle = "新方案",
}: {
  left: ReactNode;
  right: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
}) {
  return (
    <div className="my-7 grid grid-cols-1 gap-0 border border-border md:grid-cols-2">
      <div className="border-b border-border md:border-b-0 md:border-r p-5">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          {leftTitle}
        </div>
        <div className="text-[14px] leading-[1.8] text-fg-muted [&_p]:my-1.5">{left}</div>
      </div>
      <div className="p-5">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-fg">
          {rightTitle}
        </div>
        <div className="text-[14px] leading-[1.8] text-fg [&_p]:my-1.5">{right}</div>
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="my-8 ml-0 list-none space-y-5 border-l border-border pl-8 [counter-reset:step]">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="relative ml-2 [counter-increment:step]">
      <span className="absolute -left-[2.65rem] top-0 grid h-6 w-6 place-items-center rounded-full border border-border bg-bg font-mono text-[11px] text-fg-muted before:content-[counter(step)]" />
      <div className="text-[15px] font-semibold text-fg">{title}</div>
      <div className="mt-1.5 text-[14px] leading-[1.8] text-fg-muted [&_p]:my-1.5">
        {children}
      </div>
    </li>
  );
}

/** 一行小事实 / 数字标注 */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="border border-border p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-fg-subtle">{hint}</div>
      )}
    </div>
  );
}

/** 多列 stats 网格 */
export function Stats({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; hint?: string }>;
}) {
  return (
    <div
      className="my-7 grid gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <Stat key={i} {...it} />
      ))}
    </div>
  );
}

export const mdxComponents = {
  Callout,
  KeyIdea,
  Analogy,
  Quote,
  Term,
  Terms,
  KV,
  Tag,
  Compare,
  Steps,
  Step,
  Stat,
  Stats,
};
