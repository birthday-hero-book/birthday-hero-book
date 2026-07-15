import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://birthdayherobook.com";
  return ["", "/personalise", "/privacy", "/terms", "/refund-and-corrections"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/version") ? 0.9 : 0.5,
  }));
}
