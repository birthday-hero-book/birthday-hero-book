import type { Metadata } from "next";
import VersionTwo from "@/components/VersionTwo";

export const metadata: Metadata = { title: "The Birthday Theatre", description: "A theatrical personalised birthday storybook experience." };

export default function VersionTwoPage() {
  return <VersionTwo />;
}
