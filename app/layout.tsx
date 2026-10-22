import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Maven Signal | Research before you reach out",
  description:
    "Audience intelligence, prospect research, and thoughtful outreach for The Maven Digital.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
