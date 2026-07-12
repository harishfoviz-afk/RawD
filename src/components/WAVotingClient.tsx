// src/components/WAVotingClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Heart, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface WAVotingClientProps {
  contestant: {
    id: string;
    name: string;
    city: string;
    videoUrl: string;
    publicVotingSlug: string;
  };
}

// Simple cookie helper
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, val: string, days: number) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${val}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
}

export default function WAVotingClient({ contestant }: WAVotingClientProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const cookieKey = `voted_${contestant.publicVotingSlug}`;

  useEffect(() => {
    // Check cookie and localStorage for deduplication
    const cookieVoted = getCookie(cookieKey);
    const localVoted = localStorage.getItem(cookieKey);
    if (cookieVoted || localVoted) {
      setHasVoted(true);
      setStatus("success");
      setMsg("Vote Already Recorded");
    }
  }, [cookieKey]);

  const handleVote = async () => {
    if (hasVoted) {
      setMsg("Vote Already Recorded");
      setStatus("success");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestantId: contestant.id,
          type: "WA_ANONYMOUS",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Set cookie and localStorage for 7 days
        setCookie(cookieKey, "true", 7);
        localStorage.setItem(cookieKey, "true");
        setHasVoted(true);
        setStatus("success");
        setMsg("Vote Counted!");
      } else {
        setStatus("error");
        setMsg(data.error || "Unable to save vote.");
      }
    } catch (err) {
      setStatus("error");
      setMsg("Connection failed.");
    }
  };

  const sampleVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4";

  return (
    <div className="flex-1 flex flex-col justify-between p-4 relative h-[calc(100vh-64px)]">
      {/* Video Container - full screen background style on mobile */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={contestant.videoUrl.startsWith("/uploads/") ? sampleVideo : contestant.videoUrl}
          playsInline
          autoPlay
          muted
          loop
          className="w-full h-full object-cover opacity-80"
        />
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07050f] via-transparent to-[#07050f]/60 pointer-events-none"></div>
      </div>

      {/* Info card at top (Z-index 10) */}
      <div className="relative z-10 bg-brand-dark/70 border border-purple-500/10 rounded-xl p-3 backdrop-blur-sm mt-2 max-w-sm">
        <p className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">Contestant</p>
        <h2 className="text-base font-bold text-white leading-tight">{contestant.name}</h2>
        <p className="text-[10px] text-gray-400">Representing {contestant.city}</p>
      </div>

      {/* Voting Floating Area / Status at bottom */}
      <div className="relative z-10 flex items-center justify-between gap-4 mt-auto mb-6 bg-brand-dark/80 border border-purple-500/15 p-4 rounded-2xl backdrop-blur-md max-w-sm w-full mx-auto shadow-lg shadow-purple-500/5">
        <div className="flex-1">
          {status === "idle" && (
            <div>
              <p className="text-xs font-bold text-white">Tap Heart to Vote</p>
              <p className="text-[10px] text-gray-400">No login or verification required.</p>
            </div>
          )}
          {status === "submitting" && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4.5 w-4.5 text-brand-cyan animate-spin" />
              <p className="text-xs text-gray-300 font-medium">Recording vote...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-1.5 text-brand-emerald">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <p className="text-xs font-bold">{msg}</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-1.5 text-red-400">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <p className="text-xs font-semibold truncate max-w-[180px]">{msg}</p>
            </div>
          )}
        </div>

        {/* Large floating thumb-friendly Heart Button */}
        <button
          onClick={handleVote}
          disabled={status === "submitting" || hasVoted}
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
            hasVoted
              ? "bg-brand-emerald text-white border-2 border-brand-emerald shadow-brand-emerald/20"
              : "bg-red-600 text-white border-2 border-red-500 shadow-red-600/30 animate-bounce"
          }`}
        >
          <Heart className={`h-8 w-8 ${hasVoted ? "fill-white" : "fill-white animate-pulse"}`} />
        </button>
      </div>
    </div>
  );
}
