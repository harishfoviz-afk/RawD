// src/app/vote/portal/[slug]/page.tsx
import React from "react";
import { supabase } from "@/lib/db";
import { headers } from "next/headers";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import PortalVotingClient from "@/components/PortalVotingClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function PortalVotePage({ params }: PageProps) {
  const { slug } = await params;

  // Retrieve contestant by dynamic slug
  const { data: contestantRaw } = await supabase
    .from("Contestant")
    .select("*, aiScorecard:AIScorecard(*)")
    .eq("publicVotingSlug", slug)
    .maybeSingle();

  const contestant = contestantRaw ? {
    ...contestantRaw,
    aiScorecard: Array.isArray(contestantRaw.aiScorecard) ? contestantRaw.aiScorecard[0] : contestantRaw.aiScorecard
  } : null;

  if (!contestant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel rounded-2xl p-8 max-w-md space-y-6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Dancer Not Found</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              We couldn't find a competitor registered with the voting slug &ldquo;{slug}&rdquo;.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-purple hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auditions
          </Link>
        </div>
      </div>
    );
  }

  // Retrieve voter IP
  const headerList = await headers();
  const rawIp = headerList.get("x-forwarded-for") || "127.0.0.1";
  const voterIp = rawIp.split(",")[0].trim();

  return (
    <div className="flex-1 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Platform Hub
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Verified Voter Portal</h1>
              <p className="text-sm text-gray-400 mt-1">
                Authenticate your account via Google or TikTok to cast a high-influence vote with **1.5x multiplier weight**.
              </p>
            </div>
          </div>
        </div>

        <PortalVotingClient contestant={contestant} voterIp={voterIp} />
      </div>
    </div>
  );
}
