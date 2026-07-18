import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/partners", "/admin"] },
    sitemap: "https://birthdayherobook.com/sitemap.xml",
  };
}
