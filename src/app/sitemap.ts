import type { MetadataRoute } from "next";
import { CATEGORIES, LEVELS } from "@/lib/config";
import { getAllTopicPaths, listTopics } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";
import { LOCALES } from "@/i18n/dict";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  entries.push({
    url: absoluteUrl("/"),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1.0,
  });

  for (const lang of LOCALES) {
    entries.push({
      url: absoluteUrl(`/${lang}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    });
    entries.push({
      url: absoluteUrl(`/${lang}/categories`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });

    for (const c of CATEGORIES) {
      entries.push({
        url: absoluteUrl(`/${lang}/${c.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      for (const l of LEVELS) {
        const topics = listTopics(lang, c.slug, l.slug);
        if (topics.length === 0) continue;
        entries.push({
          url: absoluteUrl(`/${lang}/${c.slug}/${l.slug}`),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  // Topic pages — every locale × every slug that exists somewhere.
  for (const p of getAllTopicPaths()) {
    entries.push({
      url: absoluteUrl(`/${p.lang}/${p.category}/${p.level}/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
