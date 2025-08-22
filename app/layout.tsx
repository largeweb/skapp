import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpawnKit - Persistent AI Agents",
  description: "Digital workers that think, learn & act autonomously",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-gray-900 text-gray-100 min-h-screen font-sans"
      >
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
