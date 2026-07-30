import type { Metadata } from "next";
import { BirthdayQuest } from "@/components/BirthdayQuest";
import "./quest.css";

export const metadata: Metadata = {
  title: "The Birthday Quest — a free puzzle game",
  description:
    "Three impossible places, three candles to light. A free browser puzzle game about a child who becomes the hero of their own birthday story.",
  openGraph: {
    title: "The Birthday Quest",
    description:
      "Three impossible places, three candles to light. A free browser puzzle game.",
    type: "website",
  },
};

export default function BirthdayQuestPage() {
  return <BirthdayQuest />;
}
