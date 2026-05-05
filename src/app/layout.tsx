import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { AiAssistant } from "@/ai/AiAssistant";
import { Analytics } from "@/components/Analytics";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION_ZH,
  SITE_DESCRIPTION_EN,
  TWITTER_HANDLE,
  ogImageUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · 个人知识库`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_ZH,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "ArcLibrary",
    "wiki",
    "knowledge base",
    "MDX",
    "Next.js",
    "personal wiki",
    "documentation",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/zh",
      "en-US": "/en",
      "x-default": "/zh",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION_ZH,
    url: SITE_URL,
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [
      {
        url: ogImageUrl({
          title: SITE_NAME,
          description: SITE_DESCRIPTION_EN,
          kicker: "Personal Knowledge",
        }),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION_EN,
    site: TWITTER_HANDLE || undefined,
    creator: TWITTER_HANDLE || undefined,
    images: [
      ogImageUrl({
        title: SITE_NAME,
        description: SITE_DESCRIPTION_EN,
        kicker: "Personal Knowledge",
      }),
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <Analytics />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <ThemeProvider>
          <LocaleProvider>
            {children}
            <AiAssistant />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
