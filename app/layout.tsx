import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./responsive.css";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL("https://birthdayherobook.com"),
  title: { default: "Birthday Hero Book | Their Birthday. Their Adventure.", template: "%s | Birthday Hero Book" },
  description: "A beautifully illustrated personalised birthday adventure featuring your child’s name, appearance and favourite things.",
  keywords: ["personalised children’s book", "birthday gift for child", "custom storybook", "printable story book"],
  openGraph: {
    title: "Make Your Child the Hero of Their Own Birthday Story",
    description: "A one-of-a-kind illustrated birthday adventure, created around them.",
    url: "https://birthdayherobook.com",
    siteName: "Birthday Hero Book",
    images: [{ url: "/illustrations/adventure-world.png", width: 1536, height: 864, alt: "A child hero in a magical birthday storybook world" }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f1e8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
