import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://birthdayherobook.com";
  // /birthday-quest is a public traffic page, so it carries the same weight as
  // the sample book rather than the default given to the legal pages.
  const promoted = new Set(["/sample-book", "/birthday-quest"]);
  return ["", "/sample-book", "/birthday-quest", "/personalise", "/privacy", "/terms", "/refund-and-corrections", "/cookies"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : promoted.has(path) ? 0.8 : path.startsWith("/version") ? 0.9 : 0.5,
  }));
}
