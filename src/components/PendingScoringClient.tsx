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

const posters = [
  {
    name: "Michael Jackson",
    dance: "Billie Jean / Moonwalk",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    gradient: "from-purple-950/90 to-black/95",
    accentColor: "#a855f7" // purple
  },
  {
    name: "Hrithik Roshan",
    dance: "Bollywood / Dhoom Again",
    imageUrl: "https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80",
    gradient: "from-cyan-950/90 to-black/95",
    accentColor: "#06b6d4" // cyan
  },
  {
    name: "Madhuri Dixit",
    dance: "Kathak / Devdas",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    gradient: "from-pink-950/90 to-black/95",
    accentColor: "#ec4899" // pink
  },
  {
    name: "John Travolta",
    dance: "Disco / Saturday Night Fever",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
    gradient: "from-amber-950/90 to-black/95",
    accentColor: "#f59e0b" // amber
  }
];

export default function PendingScoringClient({ slug, initialStatus, name }: PendingScoringClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [posterIndex, setPosterIndex] = useState(0);

  const statusTickers = [
    "Initializing pose estimation and body joint coordinates...",
    "Extracting 3D joint vectors to compute joint angles...",
    "Calculating core stability spine wobble velocity...",
    "Forwarding audio stream to Librosa beat onset correlation...",
    "Determining deceleration slopes for style group autocalibration...",
    "Almost ready! Wrapping up scorecard and leaderboard rankings..."
  ];

  // Poster loop animator
  useEffect(() => {
    const posterInterval = setInterval(() => {
      setPosterIndex((prev) => (prev + 1) % posters.length);
    }, 3500);
    return () => clearInterval(posterInterval);
  }, []);

  useEffect(() => {
    // Ticker text animator
    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % statusTickers.length);
    }, 4500);

    // Worker process trigger function
    const triggerProcessing = async () => {
      try {
        console.log("[client] Triggering background worker processing...");
        await fetch("/api/worker/process", {
          method: "POST",
          headers: {
            "x-admin-secret": "DANCE_HEURISTICS_SECRET_KEY_2026",
          },
        });
      } catch (err) {
        console.error("Worker trigger failed:", err);
      }
    };

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
            } else if (data.status === "PENDING_AI") {
              // If still pending after polling, trigger worker process to ensure active queue processing
              triggerProcessing();
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 15 seconds
    const pollingInterval = setInterval(pollStatus, 15000);

    // Run first check and process trigger immediately
    pollStatus();
    triggerProcessing();

    return () => {
      clearInterval(pollingInterval);
      clearInterval(tickerInterval);
    };
  }, [slug]);

  const displayStatus = status === "PENDING_AI" ? "PENDING" : status;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-12 space-y-8">
      {/* Pulsing celebrity poster loop circle */}
      <div 
        className="relative h-64 w-64 rounded-full border flex items-center justify-center bg-brand-dark/20 backdrop-blur-sm overflow-hidden group transition-all duration-1000"
        style={{ borderColor: `${posters[posterIndex].accentColor}33` }}
      >
        {posters.map((poster, index) => {
          const isActive = index === posterIndex;
          return (
            <div
              key={poster.name}
              className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-1000 ease-in-out ${
                isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"
              }`}
            >
              {/* Poster Image */}
              <img
                src={poster.imageUrl}
                alt={poster.name}
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:scale-110 transition-transform duration-[4000ms] ease-out"
              />
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${poster.gradient} mix-blend-multiply`} />
              <div className="absolute inset-0 bg-black/40" />

              {/* Poster Content */}
              <div className="relative z-10 flex flex-col items-center justify-center space-y-2 mt-4">
                <span 
                  className="text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-1000"
                  style={{ color: poster.accentColor }}
                >
                  Dance Poster Loop
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight uppercase leading-none drop-shadow-md">
                  {poster.name}
                </h3>
                <span className="h-[2px] w-8 rounded-full transition-colors duration-1000" style={{ backgroundColor: poster.accentColor }} />
                <p className="text-xs text-gray-300 font-medium italic drop-shadow-sm mt-1">
                  {poster.dance}
                </p>
              </div>
            </div>
          );
        })}

        {/* Pulse rings */}
        <span 
          className="absolute h-48 w-48 rounded-full border animate-ping pointer-events-none transition-all duration-1000"
          style={{ borderColor: `${posters[posterIndex].accentColor}44` }}
        ></span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 text-xs font-bold text-brand-purple">
            <Activity className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            Processing Active
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-3">
            Analysing Audition Video: {name}
          </h2>
        </div>

        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Our engine is currently mapping your kinematics and aligning tempo sync. Your public voting lane and scorecard will launch shortly!
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
        <span>Current status: <span className="font-bold text-brand-purple uppercase">{displayStatus}</span> &bull; Checking every 15s</span>
      </div>
    </div>
  );
}
