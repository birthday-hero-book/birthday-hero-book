import type { MetadataRoute } from "next";
import { ORDERS_OPEN } from "@/lib/ordering";

export default function robots(): MetadataRoute.Robots {
  return {
    // /personalise joins the disallow list while the shop is closed — see the
    // matching note in sitemap.ts.
    rules: { userAgent: "*", allow: "/", disallow: ["/partners", "/admin", ...(ORDERS_OPEN ? [] : ["/personalise"])] },
    sitemap: "https://birthdayherobook.com/sitemap.xml",
  };
}
