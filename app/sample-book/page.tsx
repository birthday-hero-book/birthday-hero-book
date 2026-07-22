import type { Metadata } from "next";
import { SampleBookReader } from "@/components/SampleBookReader";
import { SiteFooter } from "@/components/SiteFooter";
import { sampleBook, sampleBookPages } from "@/lib/sample-book";
import { siteConfig } from "@/lib/site-config";
import "./sample-book.css";

const fromPrice = Math.min(...siteConfig.packages.map((item) => item.price));
const cover = sampleBookPages[0];

const description =
  "A complete example Birthday Hero Book we made ourselves, free to read in full, so you can see exactly " +
  "what your child’s personalised story will look like.";

export const metadata: Metadata = {
  title: "Read a sample Birthday Hero Book — free, in full",
  description,
  alternates: { canonical: "/sample-book" },
  openGraph: {
    title: "Read a sample Birthday Hero Book — free, in full",
    description,
    url: "/sample-book",
    type: "article",
    images: [{ url: cover.src, width: sampleBook.pageWidth, height: sampleBook.pageHeight, alt: cover.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Read a sample Birthday Hero Book — free, in full",
    description,
    images: [cover.src],
  },
};

export default function SampleBookPage() {
  return (
    <>
      <SampleBookReader fromPrice={fromPrice} />
      <SiteFooter inverse />
    </>
  );
}
