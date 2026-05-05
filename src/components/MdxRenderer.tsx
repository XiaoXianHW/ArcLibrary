import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeKatex from "rehype-katex";
import remarkArcCode from "@/lib/remark-arc-code.mjs";
import remarkArcLinks from "@/lib/remark-arc-links.mjs";
import { mdxComponents } from "./MdxComponents";
import { CodeBlock } from "./CodeBlock";
import { Mermaid } from "./Mermaid";
import type { Locale } from "@/i18n/dict";
import { DEFAULT_LOCALE } from "@/i18n/dict";

export function MdxRenderer({
  source,
  lang = DEFAULT_LOCALE,
}: {
  source: string;
  lang?: Locale;
}) {
  return (
    <article className="prose-arc">
      <MDXRemote
        source={source}
        components={{ ...mdxComponents, CodeBlock, Mermaid }}
        // Content is authored locally and read from disk at build time, so we
        // trust it and keep JSX attribute expressions like
        // `<Terms items={[...]}>`. With the default `blockJS: true`,
        // next-mdx-remote strips them and components render with `undefined`
        // props.
        options={{
          blockJS: false,
          mdxOptions: {
            format: "mdx",
            remarkPlugins: [
              remarkGfm,
              remarkMath,
              remarkArcCode,
              [remarkArcLinks, { lang }],
            ],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "append",
                  properties: { className: ["anchor"], ariaLabel: "Link to section" },
                  content: { type: "text", value: "#" },
                },
              ],
              [
                rehypePrettyCode,
                {
                  theme: {
                    dark: "github-dark-default",
                    light: "github-light",
                  },
                  keepBackground: false,
                },
              ],
              rehypeKatex,
            ],
          },
        }}
      />
    </article>
  );
}
