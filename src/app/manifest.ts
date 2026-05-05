import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION_EN } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION_EN,
    start_url: "/",
    display: "standalone",
    background_color: "#0e0e10",
    theme_color: "#0e0e10",
    icons: [
      {
        src: "/api/og?title=ArcLibrary&kicker=Personal%20Knowledge",
        sizes: "1200x630",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
