// src/app/peer-ballot/page.tsx
import React from "react";
import { prisma } from "@/lib/db";
import PeerBallotClient from "@/components/PeerBallotClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PeerBallotPage() {
  // Fetch only Top 16 competitors registered in the platform
  const competitors = await prisma.contestant.findMany({
    where: { isTop16: true, status: "READY" },
    select: {
      id: true,
      name: true,
      city: true,
      videoUrl: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch all active access codes from database
  const activeCodes = await prisma.accessCode.findMany({
    where: { active: true },
    select: { code: true },
  });

  const validTokens = activeCodes.map((ac: any) => ac.code.toUpperCase());

  return (
    <div className="flex-1 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auditions
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Peer Evaluation Portal</h1>
              <p className="text-sm text-gray-400 mt-1">
                Restricted to authorized peer evaluators and judges. Submit structured MCQs to grade dancers' technical ratings.
              </p>
            </div>
          </div>
        </div>

        <PeerBallotClient competitors={competitors} validTokens={validTokens} />
      </div>
    </div>
  );
}
