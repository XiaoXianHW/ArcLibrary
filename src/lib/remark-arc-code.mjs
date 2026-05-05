/**
 * Custom remark plugin:
 *  - ```mermaid``` → <Mermaid code="..." />
 *  - ```ascii``` → <pre class="ascii">...</pre>
 *  - other fenced blocks: wrap in <CodeBlock rawCode="..." lang="..." preview={true|false}>...</CodeBlock>
 *    (preview only enabled when fence info contains "preview", e.g. ```html preview)
 *
 * Output uses MDX flow nodes so they render as React components.
 */

import { visit } from "unist-util-visit";

function strLit(s) {
  return JSON.stringify(s ?? "");
}

export default function remarkArcCode() {
  return (tree) => {
    const replacements = [];

    visit(tree, "code", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const lang = (node.lang || "").toLowerCase();
      const meta = node.meta || "";
      const raw = node.value ?? "";

      if (lang === "mermaid") {
        replacements.push({
          parent,
          index,
          newNode: {
            type: "mdxJsxFlowElement",
            name: "Mermaid",
            attributes: [
              { type: "mdxJsxAttribute", name: "code", value: raw },
            ],
            children: [],
          },
        });
        return;
      }

      if (lang === "ascii" || lang === "txt-art") {
        replacements.push({
          parent,
          index,
          newNode: {
            type: "html",
            value: `<pre class="ascii">${escapeHtml(raw)}</pre>`,
          },
        });
        return;
      }

      // Wrap regular fenced block in <CodeBlock rawCode lang preview>{ original code node }</CodeBlock>
      const preview = /\bpreview\b/.test(meta);
      const cleanedMeta = meta.replace(/\bpreview\b/g, "").trim();
      const inner = { ...node, meta: cleanedMeta || null };

      replacements.push({
        parent,
        index,
        newNode: {
          type: "mdxJsxFlowElement",
          name: "CodeBlock",
          attributes: [
            { type: "mdxJsxAttribute", name: "rawCode", value: raw },
            { type: "mdxJsxAttribute", name: "lang", value: node.lang || "" },
            preview
              ? {
                  type: "mdxJsxAttribute",
                  name: "preview",
                  value: {
                    type: "mdxJsxAttributeValueExpression",
                    value: "true",
                    data: {
                      estree: {
                        type: "Program",
                        body: [
                          {
                            type: "ExpressionStatement",
                            expression: { type: "Literal", value: true },
                          },
                        ],
                        sourceType: "module",
                      },
                    },
                  },
                }
              : null,
          ].filter(Boolean),
          children: [inner],
        },
      });
    });

    // Apply replacements in reverse so indices stay valid
    for (const r of replacements.reverse()) {
      r.parent.children.splice(r.index, 1, r.newNode);
    }
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// keep strLit referenced (for future)
void strLit;
