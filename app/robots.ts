import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

// Required for metadata routes under `output: "export"`.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.canonicalUrl}/sitemap.xml`,
  };
}
