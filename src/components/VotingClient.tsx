// src/components/VotingClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { castVote } from "@/app/actions";
import { 
  Heart, Sparkles, AlertCircle, CheckCircle2, Play, 
  Tv, Lock, ShieldCheck, MapPin, Award 
} from "lucide-react";
import Link from "next/link";

interface VotingClientProps {
  contestant: {
    id: string;
    name: string;
    city: string;
    videoUrl: string;
    publicVotingSlug: string;
    aiScorecard: {
      overallScore: number;
      styleGroup: string;
      feedbackSummary: string;
    } | null;
  };
  voterIp: string;
}

export default function VotingClient({ contestant, voterIp }: VotingClientProps) {
  const [sliderVal, setSliderVal] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "voted" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSliderVal(val);
    
    if (val >= 100) {
      setIsUnlocked(true);
      triggerVoteSubmit();
    }
  };

  const triggerVoteSubmit = async () => {
    setStatus("submitting");
    setMsg("Verifying connection and casting vote...");

    try {
      const res = await castVote(contestant.id, voterIp);
      if (res.success) {
        setStatus("voted");
        setMsg("Thank you! Your vote has been cast successfully.");
      } else {
        setStatus("error");
        setMsg(res.error || "Unable to submit vote.");
      }
    } catch (err) {
      setStatus("error");
      setMsg("Connection error. Please try again.");
    }
  };

  // Reset slider if it wasn't slid all the way
  const handleSliderRelease = () => {
    if (sliderVal < 100) {
      setSliderVal(0);
    }
  };

  // fallback video url if uploaded is simulated
  const sampleVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Video & Performance Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="relative rounded-2xl overflow-hidden border border-purple-500/10 bg-black aspect-video group">
          <video
            src={contestant.videoUrl.startsWith("/uploads/") ? sampleVideo : contestant.videoUrl}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 rounded-lg bg-brand-dark/85 border border-purple-500/20 px-3.5 py-1.5 text-xs text-white backdrop-blur-sm flex items-center gap-1.5">
            <Tv className="h-4 w-4 text-brand-cyan animate-pulse" />
            <span>Audition Feed</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest block">
            Kinematic AI Review
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Style: {contestant.aiScorecard?.styleGroup === "SHARP" && "SHARP (Street Style)"}
            {contestant.aiScorecard?.styleGroup === "FLUID" && "FLUID (Contemporary)"}
            {contestant.aiScorecard?.styleGroup === "TRACK_INTENSE" && "TRACK INTENSE (Athletic)"}
            {!contestant.aiScorecard && "Awaiting Scoring..."}
          </h3>
          <p className="text-sm text-gray-400 font-light leading-relaxed">
            {contestant.aiScorecard?.feedbackSummary || "Dancer is currently in the queue for kinematic calculations."}
          </p>
        </div>
      </div>

      {/* Voting Station Box */}
      <div className="flex flex-col justify-between rounded-2xl border border-purple-500/10 bg-brand-card/40 p-6 glass-panel relative overflow-hidden">
        {/* Glowing aura */}
        <span className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-purple/10 blur-3xl pointer-events-none"></span>

        <div className="space-y-6">
          <div className="border-b border-purple-500/10 pb-4">
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-4 w-4 fill-brand-cyan" />
              Fan Portal
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">{contestant.name}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              Representing {contestant.city}
            </p>
          </div>

          {contestant.aiScorecard && (
            <div className="rounded-xl bg-brand-dark/50 border border-purple-500/5 p-4 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">AI Scoring Evaluation</span>
              <div className="flex items-center gap-1 text-right">
                <span className="text-lg font-bold text-white">{contestant.aiScorecard.overallScore}</span>
                <span className="text-xs text-gray-500">/ 10</span>
              </div>
            </div>
          )}

          {/* Voting Action Area */}
          <div className="space-y-4 pt-4">
            {status === "idle" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-white">Support {contestant.name}</p>
                  <p className="text-xs text-gray-500">Slide to cast a bot-resistant public vote.</p>
                </div>

                {/* Bot-resistant Slider */}
                <div className="relative rounded-xl bg-brand-dark/80 border border-purple-500/20 p-1 flex items-center h-12 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-brand-purple to-brand-cyan rounded-lg opacity-30 transition-all pointer-events-none"
                    style={{ width: `${sliderVal}%` }}
                  ></div>
                  
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none">
                    Slide to Vote &gt;&gt;&gt;
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVal}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {/* Slider Knob thumb visual */}
                  <div
                    className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow flex items-center justify-center pointer-events-none transition-all"
                    style={{ marginLeft: `calc(${sliderVal}% - ${sliderVal * 0.4}px)` }}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {status === "submitting" && (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent"></div>
                <p className="text-xs text-gray-400 font-medium">{msg}</p>
              </div>
            )}

            {status === "voted" && (
              <div className="text-center py-6 space-y-3">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-white">Vote Counted!</p>
                <p className="text-xs text-gray-400 leading-relaxed px-4">{msg}</p>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-6 space-y-3">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-white">Voting Blocked</p>
                <p className="text-xs text-red-200/80 leading-relaxed px-4">{msg}</p>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setSliderVal(0);
                    setIsUnlocked(false);
                  }}
                  className="mt-2 text-xs text-brand-purple hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-purple-500/10 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
          <ShieldCheck className="h-4 w-4 text-brand-emerald" />
          <span>Secured Voter ID: {voterIp}</span>
        </div>

        <div className="mt-6 border-t border-purple-500/10 pt-4 space-y-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Alternative Channels</span>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/vote/wa/${contestant.publicVotingSlug}`}
              className="text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>📱 WhatsApp</span>
              <span className="text-[8px] opacity-75 font-normal">(0.1x)</span>
            </Link>
            <Link
              href={`/vote/portal/${contestant.publicVotingSlug}`}
              className="text-[10px] bg-brand-purple hover:bg-brand-purple-hover text-white font-bold py-2 px-3 rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🔒 OAuth Portal</span>
              <span className="text-[8px] opacity-75 font-normal">(1.5x)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
