#!/usr/bin/env node
/**
 * Walk content/<lang>/ tree, parse frontmatter, and emit one shard per locale
 * to public/search-index/<lang>.json (plus a tiny manifest).
 *
 * The client only fetches the shard for the user's active locale on first
 * search-modal open, which keeps the payload small even when the corpus
 * doubles or triples (e.g. zh + en + ja).
 *
 * Entry shape:
 *   { id, type: "topic"|"heading", title, description, icon,
 *     category, level, chapter, chapterTitle, tags, slug, headingId?, body }
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "public", "search-index");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function stripCode(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]+`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_>#~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(md) {
  const out = [];
  const lines = md.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[#*`_]/g, "").trim();
      out.push({ level, text, id: slugify(text) });
    }
  }
  return out;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

if (!fs.existsSync(CONTENT)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), "{}");
  process.exit(0);
}

const KNOWN_LANGS = new Set(["zh", "en"]);

// Slim per-entry payload: drop fields the client never reads at search time
// (description for headings, icon dup, full body) so each shard is minimal.
// "body" is capped at 800 chars — fuse fuzzy match doesn't benefit from more
// at our corpus size, and the savings compound once the corpus grows.
const BODY_CAP = 800;

const manifest = {};
fs.mkdirSync(OUT_DIR, { recursive: true });

let totalEntries = 0;
let totalBytes = 0;

for (const lang of fs.readdirSync(CONTENT)) {
  if (!KNOWN_LANGS.has(lang)) continue;
  const langDir = path.join(CONTENT, lang);
  if (!isDir(langDir)) continue;

  const entries = [];

  for (const category of fs.readdirSync(langDir)) {
    const catDir = path.join(langDir, category);
    if (!isDir(catDir)) continue;
    for (const level of fs.readdirSync(catDir)) {
      const lvlDir = path.join(catDir, level);
      if (!isDir(lvlDir)) continue;
      for (const file of fs.readdirSync(lvlDir)) {
        if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
        const slug = file.replace(/\.(md|mdx)$/, "");
        const raw = fs.readFileSync(path.join(lvlDir, file), "utf8");
        const { data, content } = matter(raw);
        const body = stripCode(content);

        entries.push({
          id: `${lang}/${category}/${level}/${slug}`,
          type: "topic",
          title: data.title || slug,
          description: data.description || "",
          icon: data.icon || "circle",
          category,
          level,
          chapter: data.chapter || "",
          chapterTitle: data.chapterTitle || "",
          tags: data.tags || [],
          slug,
          body: body.slice(0, BODY_CAP),
        });

        for (const h of extractHeadings(content)) {
          entries.push({
            id: `${lang}/${category}/${level}/${slug}#${h.id}`,
            type: "heading",
            title: h.text,
            // Heading entries don't need description/tags/body — they
            // resolve to the parent topic's metadata client-side via the
            // `slug` field. Keep the payload tiny.
            category,
            level,
            chapter: data.chapter || "",
            chapterTitle: data.chapterTitle || "",
            slug,
            headingId: h.id,
            parentTitle: data.title || slug,
            icon: data.icon || "circle",
          });
        }
      }
    }
  }

  // Stable order by category > level > slug > heading so diffs stay readable.
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const shardPath = path.join(OUT_DIR, `${lang}.json`);
  const json = JSON.stringify(entries);
  fs.writeFileSync(shardPath, json);

  manifest[lang] = {
    entries: entries.length,
    bytes: json.length,
    file: `/search-index/${lang}.json`,
  };
  totalEntries += entries.length;
  totalBytes += json.length;
  console.log(
    `[search-index] ${lang}: ${entries.length} entries, ${(json.length / 1024).toFixed(1)} KB -> ${path.relative(ROOT, shardPath)}`,
  );
}

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(
  `[search-index] total: ${totalEntries} entries across ${Object.keys(manifest).length} locales (${(totalBytes / 1024).toFixed(1)} KB)`,
);

// Backwards-compat: emit a now-empty single-file index so any external
// consumer of /search-index.json gets a clear migration signal instead of a
// 404. Will be removed in a follow-up release.
const legacyOut = path.join(ROOT, "public", "search-index.json");
fs.writeFileSync(legacyOut, "[]");
