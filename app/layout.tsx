import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "SignalDesk - Project Team Collaboration",
  description: "Modern project-based team collaboration platform",
  keywords: [
    "chat",
    "collaboration",
    "project management",
    "team communication",
  ],
  authors: [{ name: "SignalDesk Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0B0B0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
