import type { Metadata } from "next";
import VersionOne from "@/components/VersionOne";

export const metadata: Metadata = { title: "The Living Book", description: "A premium personalised birthday storybook experience." };

export default function VersionOnePage() {
  return <VersionOne />;
}
