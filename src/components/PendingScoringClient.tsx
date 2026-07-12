// src/components/PendingScoringClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Activity, Timer } from "lucide-react";

interface PendingScoringClientProps {
  slug: string;
  initialStatus: string;
  name: string;
}

export default function PendingScoringClient({ slug, initialStatus, name }: PendingScoringClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [tickerIndex, setTickerIndex] = useState(0);

  const statusTickers = [
    "Initializing pose estimation and body joint coordinates...",
    "Extracting 3D joint vectors to compute joint angles...",
    "Calculating core stability spine wobble velocity...",
    "Forwarding audio stream to Librosa beat onset correlation...",
    "Determining deceleration slopes for style group autocalibration...",
    "Almost ready! Wrapping up scorecard and leaderboard rankings..."
  ];

  useEffect(() => {
    // Ticker text animator
    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % statusTickers.length);
    }, 4500);

    // Polling function
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/contestant/status?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.status) {
            setStatus(data.status);
            if (data.status === "READY") {
              clearInterval(pollingInterval);
              clearInterval(tickerInterval);
              // Trigger a router refresh or hard reload to display the voter interface
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 15 seconds
    const pollingInterval = setInterval(pollStatus, 15000);

    // Run first check immediately
    pollStatus();

    return () => {
      clearInterval(pollingInterval);
      clearInterval(tickerInterval);
    };
  }, [slug]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-12 space-y-8">
      {/* Pulsing wireframe dancer icon */}
      <div className="relative h-64 w-64 rounded-full border border-purple-500/10 flex items-center justify-center bg-brand-dark/20 backdrop-blur-sm overflow-hidden group">
        <span className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 to-brand-cyan/10 animate-pulse pointer-events-none"></span>

        {/* Custom SVG dancer wireframe outline with pulsing glow */}
        <svg viewBox="0 0 100 100" className="h-44 w-44 text-brand-purple-hover animate-pulse">
          {/* Spine */}
          <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="2" strokeDasharray="3" />
          {/* Shoulders */}
          <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="2.5" />
          {/* Left Arm */}
          <line x1="35" y1="35" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="20" x2="10" y2="35" stroke="currentColor" strokeWidth="1.5" />
          {/* Right Arm */}
          <line x1="65" y1="35" x2="80" y2="25" stroke="currentColor" strokeWidth="2" />
          <line x1="80" y1="25" x2="90" y2="10" stroke="currentColor" strokeWidth="1.5" />
          {/* Hips */}
          <line x1="42" y1="60" x2="58" y2="60" stroke="currentColor" strokeWidth="2.5" />
          {/* Left Leg */}
          <line x1="42" y1="60" x2="35" y2="80" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="80" x2="45" y2="95" stroke="currentColor" strokeWidth="1.5" />
          {/* Right Leg */}
          <line x1="58" y1="60" x2="68" y2="78" stroke="currentColor" strokeWidth="2" />
          <line x1="68" y1="78" x2="60" y2="92" stroke="currentColor" strokeWidth="1.5" />
          {/* Joint Landmarks */}
          <circle cx="50" cy="24" r="5" fill="currentColor" className="text-brand-cyan" />
          <circle cx="35" cy="35" r="3" fill="currentColor" className="text-brand-cyan" />
          <circle cx="65" cy="35" r="3" fill="currentColor" className="text-brand-cyan" />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" className="text-brand-purple" />
          <circle cx="80" cy="25" r="2.5" fill="currentColor" className="text-brand-purple" />
          <circle cx="42" cy="60" r="3" fill="currentColor" className="text-brand-cyan" />
          <circle cx="58" cy="60" r="3" fill="currentColor" className="text-brand-cyan" />
          <circle cx="35" cy="80" r="2.5" fill="currentColor" className="text-brand-purple" />
          <circle cx="68" cy="78" r="2.5" fill="currentColor" className="text-brand-purple" />
        </svg>

        {/* Pulse rings */}
        <span className="absolute h-48 w-48 rounded-full border border-brand-cyan/20 animate-ping pointer-events-none"></span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 text-xs font-bold text-brand-purple">
            <Activity className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            AI Processing Active
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-3">
            Analysing Audition Video: {name}
          </h2>
        </div>

        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Our AI engine is currently mapping your kinematics and aligning tempo sync. Your public voting lane and scorecard will launch shortly!
        </p>

        {/* Status Ticker Box */}
        <div className="glass-panel border-purple-500/10 rounded-xl p-4 max-w-md mx-auto flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 text-brand-cyan animate-spin shrink-0" />
          <p className="text-xs text-gray-300 font-mono text-left select-none">
            {statusTickers[tickerIndex]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 justify-center">
        <Timer className="h-3.5 w-3.5" />
        <span>Current status: <span className="font-bold text-brand-purple uppercase">{status}</span> &bull; Checking every 15s</span>
      </div>
    </div>
  );
}
