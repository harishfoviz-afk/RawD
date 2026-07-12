// src/app/vote/wa/[slug]/page.tsx
import React from "react";
import { prisma } from "@/lib/db";
import { Tv, AlertCircle } from "lucide-react";
import Link from "next/link";
import WAVotingClient from "@/components/WAVotingClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function WAVotePage({ params }: PageProps) {
  const { slug } = await params;

  // Retrieve contestant by dynamic slug
  const contestant = await prisma.contestant.findUnique({
    where: { publicVotingSlug: slug },
    select: {
      id: true,
      name: true,
      city: true,
      videoUrl: true,
      publicVotingSlug: true,
    },
  });

  if (!contestant) {
    return (
      <div className="min-h-screen bg-[#07050f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-brand-card/40 border border-red-500/20 p-6 rounded-2xl max-w-xs space-y-4">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Dancer Not Found</h2>
          <p className="text-xs text-gray-400">This voting lane is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050f] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Mini header */}
      <header className="px-4 py-3 border-b border-purple-500/5 flex items-center justify-between bg-brand-dark/50">
        <div>
          <h1 className="text-sm font-black tracking-tight text-white">{contestant.name}</h1>
          <p className="text-[10px] text-gray-400">WhatsApp Live Vote</p>
        </div>
        <span className="text-[9px] bg-brand-purple/20 text-brand-purple-hover px-2 py-0.5 rounded-full border border-brand-purple/10 font-bold uppercase tracking-wider">
          WA View
        </span>
      </header>

      {/* Main client component */}
      <WAVotingClient contestant={contestant} />
    </div>
  );
}
