/**
 * Remark plugin: prefix absolute internal markdown links with the current locale.
 *
 * Articles authored in zh/en use links like `[RAG](/ai/beginner/rag)`.
 * After the i18n routing change, real pages live at `/zh/ai/...` or `/en/ai/...`.
 * Rather than rewriting every cross-link inside content files, we transparently
 * rewrite any `/ai/...`, `/network/...`, `/ops/...`, or `/categories` link to
 * include the current `lang` prefix when rendering.
 *
 * Links that already start with `/zh/` or `/en/` are left alone, as are
 * external (`http(s)://`) and anchor (`#…`) links.
 */
import { visit } from "unist-util-visit";

const LOCALE_PREFIXES = new Set(["/zh", "/en"]);
const REWRITE_PREFIXES = ["/ai", "/network", "/ops", "/categories"];

function rewriteUrl(url, lang) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("//")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return url;
  if (url.startsWith("#")) return url;
  if (!url.startsWith("/")) return url;

  // Already locale-prefixed?
  for (const p of LOCALE_PREFIXES) {
    if (url === p || url.startsWith(`${p}/`)) return url;
  }

  for (const p of REWRITE_PREFIXES) {
    if (url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}#`) || url.startsWith(`${p}?`)) {
      return `/${lang}${url}`;
    }
  }

  return url;
}

export default function remarkArcLinks(opts = {}) {
  const lang = opts.lang || "zh";
  return (tree) => {
    visit(tree, "link", (node) => {
      node.url = rewriteUrl(node.url, lang);
    });
    visit(tree, "definition", (node) => {
      node.url = rewriteUrl(node.url, lang);
    });
    // MDX JSX `<a href="...">` written by hand inside MDX
    visit(tree, "mdxJsxTextElement", (node) => {
      if (node.name !== "a") return;
      for (const attr of node.attributes ?? []) {
        if (attr.type === "mdxJsxAttribute" && attr.name === "href" && typeof attr.value === "string") {
          attr.value = rewriteUrl(attr.value, lang);
        }
      }
    });
    visit(tree, "mdxJsxFlowElement", (node) => {
      if (node.name !== "a") return;
      for (const attr of node.attributes ?? []) {
        if (attr.type === "mdxJsxAttribute" && attr.name === "href" && typeof attr.value === "string") {
          attr.value = rewriteUrl(attr.value, lang);
        }
      }
    });
  };
}
