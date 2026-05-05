export type TocItem = { id: string; text: string; level: 2 | 3 };

export function extractToc(md: string): TocItem[] {
  const lines = md.split("\n");
  const out: TocItem[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const level = m[1].length as 2 | 3;
      const text = m[2].replace(/[#*`_]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      out.push({ id, text, level });
    }
  }
  return out;
}
