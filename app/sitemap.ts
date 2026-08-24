import type { MetadataRoute } from "next";
import { ORDERS_OPEN } from "@/lib/ordering";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://birthdayherobook.com";
  // /personalise is the order form. While the shop is closed it shows nothing
  // but the waitlist notice, so keep it out of the index rather than send search
  // traffic to a dead end.
  const paths = ["", "/sample-book", ...(ORDERS_OPEN ? ["/personalise"] : []), "/privacy", "/terms", "/refund-and-corrections", "/cookies"];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/sample-book" ? 0.8 : path.startsWith("/version") ? 0.9 : 0.5,
  }));
}
