// src/app/vote/[slug]/page.tsx
import React from "react";
import { supabase } from "@/lib/db";
import { headers } from "next/headers";
import VotingClient from "@/components/VotingClient";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import PendingScoringClient from "@/components/PendingScoringClient";
import ShareBanner from "@/components/ShareBanner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VotePage({ params }: PageProps) {
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

  // If contestant doesn't exist, display a clean 404 alert page
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

  // If status is PENDING_AI or PROCESSING, display the AI Analysis Pending screen
  if (contestant.status === "PENDING_AI" || contestant.status === "PROCESSING") {
    return (
      <div className="flex-1 py-12">
        <PendingScoringClient 
          slug={slug} 
          initialStatus={contestant.status} 
          name={contestant.name} 
        />
      </div>
    );
  }

  // Retrieve voter IP from server headers for bot prevention and deduplication
  const headerList = await headers();
  const rawIp = headerList.get("x-forwarded-for") || "127.0.0.1";
  // Extract first IP in list if proxy-chained
  const voterIp = rawIp.split(",")[0].trim();

  const technicalScore = contestant.aiScorecard ? contestant.aiScorecard.overallScore : 0;
  const isShortlisted = technicalScore >= 5.0 && !contestant.isAiGenerated;

  // We import AuditionGallery dynamically
  const AuditionGallery = (await import("@/components/AuditionGallery")).default;
  const { Ban, Award, Mail, Send } = await import("lucide-react");

  if (!isShortlisted) {
    return (
      <div className="flex-1 py-12 bg-[#07050f] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-black tracking-tight mt-4 text-white">Audition Review Complete</h1>
            <p className="text-sm text-gray-400 mt-1">Technical analysis has been processed for this competitor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side: Video */}
            <div className="md:col-span-2 space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/10 bg-black aspect-video">
                <video
                  src={contestant.videoUrl.startsWith("/uploads/") ? "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4" : contestant.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Positive feedback card */}
              {contestant.aiScorecard && (
                <div className="glass-panel rounded-2xl p-6 space-y-3">
                  <span className="text-xs font-semibold text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-brand-cyan" />
                    Performance Feedback Profile
                  </span>
                  <p className="text-sm text-gray-300 font-light leading-relaxed">
                    {contestant.aiScorecard.feedbackSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Right side: Rejection Panel */}
            <div className="glass-panel rounded-2xl p-6 border border-purple-500/10 flex flex-col justify-between bg-brand-card/30 relative overflow-hidden">
              <span className="absolute top-0 right-0 h-40 w-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none"></span>

              <div className="space-y-6">
                <div className="border-b border-purple-500/10 pb-4">
                  {contestant.isAiGenerated ? (
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <Ban className="h-4 w-4 shrink-0" />
                      Disqualified Clip
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-brand-amber uppercase tracking-wider">
                      Technical Threshold
                    </span>
                  )}
                  <h2 className="text-2xl font-black text-white mt-2">Better luck next time!</h2>
                  <p className="text-xs text-gray-400 leading-normal mt-2">
                    {contestant.isAiGenerated
                      ? "This video was identified as synthetic or AI-generated. The competition rules require raw, organic physical footage."
                      : "This performance technical score did not meet the 50% (5.0/10.0) threshold required to activate the public fan voting lane this season."}
                  </p>
                </div>

                {/* Positive Season Subscription form */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-brand-dark/50 p-4 border border-purple-500/5">
                    <p className="text-[11px] text-gray-400 leading-normal">
                      We appreciate your passion for dance! Subscribe below to receive updates for upcoming seasons, workshops, and tutorials.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Subscribe for Future Seasons</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="dancer@gmail.com"
                        className="flex-1 bg-brand-dark/80 border border-purple-500/15 focus:border-brand-purple/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => alert("Thank you for subscribing!")}
                        className="bg-brand-purple hover:bg-brand-purple-hover text-white rounded-xl px-3 flex items-center justify-center cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-purple-500/10 pt-4 text-center">
                <p className="text-[10px] text-gray-500 font-medium">Explore and support other dancers in the gallery below!</p>
              </div>
            </div>
          </div>

          {/* Active Auditions Gallery */}
          <AuditionGallery />
        </div>
      </div>
    );
  }

  // Shortlisted view
  return (
    <div className="flex-1 py-12 bg-[#07050f] text-white">
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
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Public Fan Ballot</h1>
              <p className="text-sm text-gray-400 mt-1">
                Help your favorite dancer climb the leaderboard. Every unique vote affects the tournament rankings.
              </p>
            </div>
          </div>
        </div>

        {/* Shortlink Share Alert for Shortlisted Contenders */}
        <ShareBanner slug={slug} />

        <VotingClient contestant={contestant} voterIp={voterIp} />

        {/* Site-wide Auditions Gallery */}
        <AuditionGallery />
      </div>
    </div>
  );
}
