/**
 * Site-wide metadata helpers.
 *
 * All SEO-related code reads from these constants so that switching
 * the deployment URL only takes one env var (`NEXT_PUBLIC_SITE_URL`).
 */

const fallback = "https://arclibrary.local";

function normalize(input: string | undefined): string {
  if (!input) return fallback;
  let v = input.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  // Drop trailing slash so URL joining stays clean.
  return v.replace(/\/$/, "");
}

export const SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_NAME = "ArcLibrary";

export const SITE_DESCRIPTION_EN =
  "A self-hostable, AI-augmented personal knowledge wiki built with Next.js and MDX.";

export const SITE_DESCRIPTION_ZH =
  "可自托管、内置 AI 助手的个人知识库站点，基于 Next.js 与 MDX。";

export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "";

/**
 * Build a canonical absolute URL from a path. Always returns a fully
 * qualified URL based on `SITE_URL`.
 */
export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}

/**
 * Build the URL for the dynamic OG image route.
 */
export function ogImageUrl(params: {
  title: string;
  description?: string;
  kicker?: string;
  lang?: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("title", params.title);
  if (params.description) qs.set("description", params.description);
  if (params.kicker) qs.set("kicker", params.kicker);
  if (params.lang) qs.set("lang", params.lang);
  return `${SITE_URL}/api/og?${qs.toString()}`;
}
