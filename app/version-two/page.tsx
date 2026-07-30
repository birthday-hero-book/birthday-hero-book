import type { Metadata } from "next";
import VersionTwo from "@/components/VersionTwo";

export const metadata: Metadata = { title: "The Birthday Theatre", description: "A theatrical personalised birthday storybook experience." };

// See app/page.tsx — founding copy needs a revalidate window to retire itself.
export const revalidate = 300;

export default function VersionTwoPage() {
  return <VersionTwo />;
}
