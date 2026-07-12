// src/components/PortalVotingClient.tsx
"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, 
  Loader2, Tv, MapPin, LogIn, LogOut, Heart
} from "lucide-react";

interface PortalVotingClientProps {
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

interface OAuthUser {
  name: string;
  email: string;
  provider: "GOOGLE" | "TIKTOK";
  avatar: string;
}

export default function PortalVotingClient({ contestant, voterIp }: PortalVotingClientProps) {
  const [authStep, setAuthStep] = useState<"unauthenticated" | "popup" | "authenticated">("unauthenticated");
  const [authProvider, setAuthProvider] = useState<"GOOGLE" | "TIKTOK" | null>(null);
  const [user, setUser] = useState<OAuthUser | null>(null);

  // Voting states
  const [voteStatus, setVoteStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [voteMsg, setVoteMsg] = useState("");

  const handleOAuthLogin = (provider: "GOOGLE" | "TIKTOK") => {
    setAuthStep("popup");
    setAuthProvider(provider);

    // Simulate standard OAuth authorization redirect popup
    setTimeout(() => {
      if (provider === "GOOGLE") {
        setUser({
          name: "Aisha Patel",
          email: "aisha.patel.dance@gmail.com",
          provider: "GOOGLE",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100",
        });
      } else {
        setUser({
          name: "choreo_jay_official",
          email: "choreo_jay@tiktok.com",
          provider: "TIKTOK",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100",
        });
      }
      setAuthStep("authenticated");
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthProvider(null);
    setAuthStep("unauthenticated");
    setVoteStatus("idle");
    setVoteMsg("");
  };

  const handleCastVerifiedVote = async () => {
    if (!user) return;
    setVoteStatus("submitting");
    setVoteMsg("Encrypting voter signature and casting 1.5x weight vote...");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestantId: contestant.id,
          type: "OAUTH_VERIFIED",
          voterIdentifier: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVoteStatus("success");
        setVoteMsg(`Verified Vote Cast Successfully! Evaluated with 1.5x weight. Unique ID registered to: ${user.email}`);
      } else {
        setVoteStatus("error");
        setVoteMsg(data.error || "Unable to register vote.");
      }
    } catch (err) {
      setVoteStatus("error");
      setVoteMsg("Network connection error. Please try again.");
    }
  };

  const sampleVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Video element */}
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
            <Tv className="h-4 w-4 text-brand-purple animate-pulse" />
            <span>Audition Feed</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2">
          <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest block">
            Dancer articulation profile
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Style Group: {contestant.aiScorecard?.styleGroup || "Skeletal Processing..."}
          </h3>
          <p className="text-sm text-gray-400 font-light leading-relaxed">
            {contestant.aiScorecard?.feedbackSummary || "AI dynamic feedback summary is loading."}
          </p>
        </div>
      </div>

      {/* Verified voting container */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/10 flex flex-col justify-between relative overflow-hidden bg-brand-card/30">
        <span className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-cyan/5 blur-3xl pointer-events-none"></span>

        <div className="space-y-6">
          <div className="border-b border-purple-500/10 pb-4">
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-cyan" />
              Verified Vote Lane
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">{contestant.name}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              Representing {contestant.city}
            </p>
          </div>

          {/* Authentication flow */}
          {authStep === "unauthenticated" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-brand-dark/50 p-4 border border-purple-500/5 text-center">
                <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                  Sign in via an OAuth partner to unlock the high-influence 1.5x vote.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleOAuthLogin("GOOGLE")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-2.5 text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.85 3C6.31 7.57 8.94 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.85c2.15-1.98 3.38-4.89 3.38-8.51z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.35 10.5C5.07 11.43 4.9 12.43 4.9 13.5s.17 2.07.45 3l-3.85 3C.56 17.58 0 15.6 0 13.5s.56-4.08 1.5-6l3.85 3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.67-2.85c-1.02.68-2.33 1.09-3.95 1.09-3.06 0-5.69-2.53-6.65-5.46l-3.85 3C3.39 20.35 7.35 23 12 23z"
                    />
                  </svg>
                  Sign in with Google
                </button>

                <button
                  onClick={() => handleOAuthLogin("TIKTOK")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black text-white py-2.5 text-xs font-bold border border-purple-500/20 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <span className="font-black text-brand-cyan tracking-wider">TikTok</span>
                  Sign in with TikTok
                </button>
              </div>
            </div>
          )}

          {authStep === "popup" && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 text-brand-cyan animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Opening Authorization Popup...</p>
                <p className="text-[10px] text-gray-500">Connecting to {authProvider === "GOOGLE" ? "Google Account Services" : "TikTok Developer APIs"}</p>
              </div>
            </div>
          )}

          {authStep === "authenticated" && user && (
            <div className="space-y-6">
              {/* Authenticated user card */}
              <div className="flex items-center justify-between rounded-xl bg-brand-dark/50 border border-purple-500/10 p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full border border-brand-cyan/20 object-cover"
                  />
                  <div>
                    <span className="block text-xs font-bold text-white">{user.name}</span>
                    <span className="block text-[9px] text-gray-400 font-mono">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Voting actions */}
              <div className="space-y-4">
                {voteStatus === "idle" && (
                  <button
                    onClick={handleCastVerifiedVote}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan py-3 text-xs font-bold text-white shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <Heart className="h-4.5 w-4.5 fill-white" />
                    Cast Verified Vote (1.5x Weight)
                  </button>
                )}

                {voteStatus === "submitting" && (
                  <div className="text-center py-4 space-y-2">
                    <Loader2 className="h-6 w-6 text-brand-cyan animate-spin mx-auto" />
                    <p className="text-[10px] text-gray-400 font-medium">{voteMsg}</p>
                  </div>
                )}

                {voteStatus === "success" && (
                  <div className="text-center py-4 space-y-3 bg-brand-dark/40 border border-brand-emerald/20 p-4 rounded-xl">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-bold text-white">Vote Accepted</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{voteMsg}</p>
                  </div>
                )}

                {voteStatus === "error" && (
                  <div className="text-center py-4 space-y-3 bg-brand-dark/40 border border-red-500/20 p-4 rounded-xl">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-bold text-white">Submission Failed</p>
                    <p className="text-[10px] text-red-200/80 leading-relaxed">{voteMsg}</p>
                    <button
                      onClick={() => setVoteStatus("idle")}
                      className="text-[10px] text-brand-purple hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-purple-500/10 pt-4 flex items-center justify-center gap-1.5 text-[9px] text-gray-500">
          <ShieldAlert className="h-4 w-4 text-brand-cyan" />
          <span>Voter Network IP logged: {voterIp}</span>
        </div>
      </div>
    </div>
  );
}
