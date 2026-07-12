// src/app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Trophy, Users, ShieldAlert, Award, FileText } from "lucide-react";
import { seedInitialTokens } from "./actions";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "DanceHeuristics | Kinematic AI Dance Competition Platform",
  description:
    "Evaluate physical articulation, timing, stability, and range of motion with Google MediaPipe and Librosa audio onset syncing. Join the community dance tournament now!",
  keywords: "dance competition, pose tracking, computer vision, kinematic AI, librosa audio sync, tournament bracket",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed default tokens on application boot if they do not exist
  await seedInitialTokens();

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-brand-dark text-foreground font-sans">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-purple-500/10 bg-brand-dark/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow-md">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <span className="bg-gradient-to-r from-white via-purple-200 to-brand-cyan bg-clip-text text-transparent">
                    DanceHeuristics
                  </span>
                </Link>
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    href="/peer-ballot"
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Award className="h-4 w-4 text-brand-purple" />
                    Peer Ballot
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-purple-500/5 bg-brand-darker py-8 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">DanceHeuristics © 2026</span>
                <span>•</span>
                <span>Kinematic Articulation Engine v1.0.0</span>
              </div>
              <div className="flex gap-6">
                <Link href="/" className="hover:text-white transition-colors">Register</Link>
                <Link href="/peer-ballot" className="hover:text-white transition-colors">Peer Ballot</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
