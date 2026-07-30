import VersionOne from "@/components/VersionOne";

// The founding banner and offer section retire themselves once the deadline
// passes. A fully static page would never notice — its HTML is frozen at build
// time — so revalidate keeps the page cached while still letting that check
// re-run. Without this the deadline silently stops working.
export const revalidate = 300;

export default function HomePage() {
  return <VersionOne />;
}
