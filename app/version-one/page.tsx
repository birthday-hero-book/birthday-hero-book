import type { Metadata } from "next";
import VersionOne from "@/components/VersionOne";

export const metadata: Metadata = { title: "The Living Book", description: "A premium personalised birthday storybook experience." };

// See app/page.tsx — founding copy needs a revalidate window to retire itself.
export const revalidate = 300;

export default function VersionOnePage() {
  return <VersionOne />;
}
