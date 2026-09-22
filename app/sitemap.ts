import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { siteConfig } from "@/data/site";

// Required for metadata routes under `output: "export"`.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteConfig.canonicalUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects.map((project) => ({
      url: `${siteConfig.canonicalUrl}/projects/${project.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
