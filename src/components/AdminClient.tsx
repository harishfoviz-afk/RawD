// src/components/AdminClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { 
  issueAccessCode, revokeAccessCode, saveSystemConfig, 
  toggleTop16, overrideVideo, launchLeague, triggerPeerAccess, 
  pushVideoToYouTube, getLeaderboardData 
} from "@/app/actions";
import { 
  Users, Key, Trophy, Play, Video, Sparkles, CheckCircle2, 
  ShieldCheck, XCircle, Plus, Trash2, ShieldAlert, Award, 
  Globe, RefreshCw, Settings, Upload, Ban
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  videoUrl: string;
  originalVideoUrl: string | null;
  publicVotingSlug: string;
  status: string;
  styleTag: string;
  isAiGenerated: boolean;
  isTop16: boolean;
  aiScore: number;
  peerScore: number;
  votesCount: number;
  waVotesCount: number;
  portalVotesCount: number;
  socialLikesCount: number;
  totalFanScore: number;
  normalizedFanScore: number;
  phase1Score: number;
  phase2Score: number;
  aiScorecard: {
    styleGroup: string;
    sharpnessScore: number;
    stabilityScore: number;
    alignmentScore: number;
    timingScore: number;
    feedbackSummary: string;
  } | null;
}

interface AccessCode {
  code: string;
  active: boolean;
  createdAt: Date;
}

interface AdminClientProps {
  initialCompetitors: Competitor[];
  initialCodes: AccessCode[];
  initialConfigs: { key: string; value: string }[];
}

export default function AdminClient({ initialCompetitors, initialCodes, initialConfigs }: AdminClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"applicants" | "tokens" | "leaderboard" | "top16" | "settings">("applicants");
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
  const [codes, setCodes] = useState<AccessCode[]>(initialCodes);
  const [configs, setConfigs] = useState(initialConfigs);
  const [isPending, startTransition] = useTransition();

  const configMap = new Map((configs || []).map(c => [c.key, c.value]));

  // Settings states
  const [weightWA, setWeightWA] = useState(configMap.get("WEIGHT_WA_ANONYMOUS") || "0.1");
  const [weightPortal, setWeightPortal] = useState(configMap.get("WEIGHT_OAUTH_VERIFIED") || "1.5");
  const [weightSocial, setWeightSocial] = useState(configMap.get("WEIGHT_SOCIAL_SYNC") || "1.0");
  const [leagueName, setLeagueName] = useState(configMap.get("LEAGUE_NAME") || "Season 1 Arena");
  const [leagueDesc, setLeagueDesc] = useState(configMap.get("LEAGUE_DESC") || "Standard League active for voting.");
  const [leagueLaunched, setLeagueLaunched] = useState(configMap.get("LEAGUE_LAUNCHED") === "true");
  const [supabaseUrl, setSupabaseUrl] = useState(configMap.get("SUPABASE_URL") || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(configMap.get("SUPABASE_ANON_KEY") || "");

  // Token Form State
  const [newToken, setNewToken] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "KUNTA") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "KUNTA") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_auth", "KUNTA");
      }
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect access key.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-brand-neongreen/15 bg-brand-card/35 backdrop-blur-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-brand-neongreen uppercase tracking-widest block">Security Authentication</span>
            <h2 className="text-xl font-black tracking-tight">Admin Key Verification</h2>
            <p className="text-xs text-gray-400">Enter the administration access key to unlock the cockpit.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && <p className="text-xs text-red-400 font-bold text-center">{authError}</p>}
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Access Key"
              className="w-full bg-brand-dark/85 border border-purple-500/15 focus:border-brand-neongreen/40 rounded-2xl px-4 py-3 text-xs text-center text-white outline-none font-mono"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-neongreen to-brand-cyan hover:scale-[1.02] text-black font-black py-3 rounded-2xl text-xs cursor-pointer transition-all"
            >
              Verify Key
            </button>
          </form>
        </div>
      </div>
    );
  }

  const refreshData = async () => {
    const updated = await getLeaderboardData();
    setCompetitors(updated as any);
  };

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    const cleanToken = newToken.trim().toUpperCase();

    startTransition(async () => {
      const res = await issueAccessCode(cleanToken);
      if (res.success) {
        setCodes(prev => [{ code: cleanToken, active: true, createdAt: new Date() }, ...prev]);
        setNewToken("");
        setTokenError("");
      } else {
        setTokenError(res.error || "Unable to issue code.");
      }
    });
  };

  const handleRevokeToken = async (code: string) => {
    startTransition(async () => {
      const res = await revokeAccessCode(code);
      if (res.success) {
        setCodes(prev => prev.map(c => c.code === code ? { ...c, active: false } : c));
      }
    });
  };

  const handleSaveConfigs = async () => {
    startTransition(async () => {
      await saveSystemConfig("WEIGHT_WA_ANONYMOUS", weightWA);
      await saveSystemConfig("WEIGHT_OAUTH_VERIFIED", weightPortal);
      await saveSystemConfig("WEIGHT_SOCIAL_SYNC", weightSocial);
      await saveSystemConfig("SUPABASE_URL", supabaseUrl);
      await saveSystemConfig("SUPABASE_ANON_KEY", supabaseAnonKey);
      
      // Update local configs state
      setConfigs([
        { key: "WEIGHT_WA_ANONYMOUS", value: weightWA },
        { key: "WEIGHT_OAUTH_VERIFIED", value: weightPortal },
        { key: "WEIGHT_SOCIAL_SYNC", value: weightSocial },
        { key: "SUPABASE_URL", value: supabaseUrl },
        { key: "SUPABASE_ANON_KEY", value: supabaseAnonKey },
        { key: "LEAGUE_LAUNCHED", value: leagueLaunched ? "true" : "false" },
        { key: "LEAGUE_NAME", value: leagueName },
        { key: "LEAGUE_DESC", value: leagueDesc }
      ]);
      await refreshData();
      alert("System configurations saved successfully!");
    });
  };

  const handleLaunchLeague = async () => {
    startTransition(async () => {
      const nextLaunchState = !leagueLaunched;
      const res = await launchLeague(leagueName, leagueDesc, nextLaunchState);
      if (res.success) {
        setLeagueLaunched(nextLaunchState);
        alert(nextLaunchState ? "DanceHeuristics League Launched Live!" : "League Paused.");
      }
    });
  };

  const handleToggleTop16 = async (contestantId: string, currentVal: boolean) => {
    startTransition(async () => {
      const nextVal = !currentVal;
      const res = await toggleTop16(contestantId, nextVal);
      if (res.success) {
        setCompetitors(prev => prev.map(c => c.id === contestantId ? { ...c, isTop16: nextVal } : c));
      }
    });
  };

  const handleTriggerPeerAccess = async (active: boolean) => {
    startTransition(async () => {
      const res = await triggerPeerAccess(active);
      if (res.success) {
        alert(active ? "Access codes triggered! Top 16 peer evaluation portals are unlocked." : "Peer access codes locked.");
      }
    });
  };

  const handleOverrideVideo = async (contestantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const uploadResult = await uploadResponse.json();

          if (uploadResponse.ok && uploadResult.success) {
            const res = await overrideVideo(contestantId, uploadResult.filePath);
            if (res.success) {
              await refreshData();
              alert("Dancer video overridden with edited version. Raw file archived.");
            }
          }
        } catch (err) {
          alert("Override upload failed.");
        }
      });
    }
  };

  const handlePushToYouTube = async (contestantId: string) => {
    startTransition(async () => {
      const res = await pushVideoToYouTube(contestantId);
      if (res.success) {
        alert(`Successfully pushed to YouTube Shorts! Simulated ID registered: ${res.youtubeId}`);
      }
    });
  };

  const handleTriggerWorker = async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/worker/process", {
          method: "POST",
          headers: {
            "x-admin-secret": "DANCE_HEURISTICS_SECRET_KEY_2026",
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await refreshData();
          alert(`Scoring success: processed "${data.name}"! Rating: ${data.overallScore}/10.`);
        } else {
          alert(`Worker response: ${data.error || "No pending jobs."}`);
        }
      } catch (err) {
        alert("Failed to communicate with worker.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex border-b border-purple-500/10 gap-2 pb-px overflow-x-auto scrollbar-none">
        {[
          { id: "applicants", label: "Contestants Panel", icon: <Users className="h-4 w-4" /> },
          { id: "settings", label: "League Settings", icon: <Settings className="h-4 w-4" /> },
          { id: "leaderboard", label: "Live Standings", icon: <Trophy className="h-4 w-4" /> },
          { id: "top16", label: "Top 16 Arena", icon: <Award className="h-4 w-4" /> },
          { id: "tokens", label: "Access Tokens", icon: <Key className="h-4 w-4" /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-brand-purple text-white bg-brand-purple/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* APPLICANTS TAB */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-brand-card/20 border border-purple-500/5 rounded-2xl p-4">
            <h2 className="text-base font-bold text-white">Registered Auditions Registry</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerWorker}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs text-brand-purple-hover hover:underline cursor-pointer font-bold bg-brand-purple/10 px-3 py-1.5 rounded-lg border border-brand-purple/20 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} /> Run Scoring Worker
              </button>
              <button
                onClick={refreshData}
                className="flex items-center gap-1.5 text-xs text-brand-cyan hover:underline cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reload List
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-500/10 bg-brand-dark/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-purple-500/10 bg-brand-card/30 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                  <th className="py-4 px-6">Dancer Info</th>
                  <th className="py-4 px-6 text-center">Style</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Technical Score</th>
                  <th className="py-4 px-6 text-center">Dynamic Votes (WA / Portal / Social)</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                  <th className="py-4 px-6 text-center">Top 16</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5 text-xs text-gray-300">
                {competitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 font-light">
                      No dancers registered in the SQLite database yet.
                    </td>
                  </tr>
                ) : (
                  competitors.map((c) => (
                    <tr key={c.id} className="hover:bg-brand-card/10 transition-colors">
                      <td className="py-4 px-6 space-y-1.5">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-[10px] text-gray-400 block">{c.city} • {c.email}</span>
                        {c.status === "READY" && (
                          <div className="flex flex-wrap gap-2 pt-1 text-[9px] font-bold">
                            <a
                              href={`/vote/${c.publicVotingSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-cyan hover:underline hover:text-cyan-300"
                            >
                              Public Page
                            </a>
                            <span className="text-gray-600">|</span>
                            <a
                              href={`/vote/wa/${c.publicVotingSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-400 hover:underline hover:text-green-300"
                            >
                              WA View
                            </a>
                            <span className="text-gray-600">|</span>
                            <a
                              href={`/vote/portal/${c.publicVotingSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-purple-hover hover:underline hover:text-purple-300"
                            >
                              OAuth Portal
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-[10px] bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 text-brand-purple-hover font-bold">
                          {c.styleTag === "BOLLYWOOD" ? "Cinematic" : c.styleTag}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          c.status === "READY"
                            ? "bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald"
                            : c.status === "PROCESSING"
                            ? "bg-brand-amber/10 border border-brand-amber/20 text-brand-amber animate-pulse"
                            : c.status === "PENDING_AI"
                            ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                            : "bg-red-950/20 border border-red-500/20 text-red-400"
                        }`}>
                          {c.status}
                        </span>
                        {c.isAiGenerated && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold bg-red-600/20 border border-red-500/30 text-red-400 ml-1.5 animate-pulse">
                            <Ban className="h-3 w-3 shrink-0" />
                            Synthetic
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-brand-cyan">
                        {c.aiScore > 0 ? `${c.aiScore}/10` : "N/A"}
                      </td>
                      <td className="py-4 px-6 text-center text-[11px] font-mono">
                        <span className="text-green-400">{c.waVotesCount}w</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-brand-purple-hover">{c.portalVotesCount}p</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-cyan-400">{c.socialLikesCount}s</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Raw Dance */}
                          <a
                            href={c.originalVideoUrl || c.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold bg-brand-dark hover:bg-brand-card/50 text-white px-2 py-1 rounded border border-purple-500/25 transition-colors cursor-pointer"
                          >
                            <Video className="h-3.5 w-3.5 text-brand-cyan" />
                            Raw Dance
                          </a>
                          {/* Override Video */}
                          <div className="relative">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleOverrideVideo(c.id, e)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <button className="flex items-center gap-1 text-[10px] font-bold bg-brand-purple/20 hover:bg-brand-purple text-white px-2 py-1 rounded border border-brand-purple/30 transition-colors cursor-pointer">
                              <Upload className="h-3.5 w-3.5" />
                              Edited
                            </button>
                          </div>
                          {/* Push YouTube */}
                          <button
                            onClick={() => handlePushToYouTube(c.id)}
                            className="flex items-center gap-1 text-[10px] font-bold bg-red-600/10 hover:bg-red-600 text-white px-2 py-1 rounded border border-red-500/20 transition-colors cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                            YouTube
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={c.isTop16}
                          disabled={c.status !== "READY" || c.isAiGenerated}
                          onChange={() => handleToggleTop16(c.id, c.isTop16)}
                          className="h-4.5 w-4.5 rounded border-purple-500/20 text-brand-purple bg-brand-dark/50 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAGUE SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Multipliers */}
          <div className="glass-panel rounded-2xl p-6 border border-purple-500/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Channel Weights</h3>
              <p className="text-xs text-gray-400 mt-1">Determine the influence multiplier of each channel on public standings.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">WhatsApp Anonymous Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightWA}
                  onChange={(e) => setWeightWA(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">OAuth Verified Portal Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightPortal}
                  onChange={(e) => setWeightPortal(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Social Media Likes Sync Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightSocial}
                  onChange={(e) => setWeightSocial(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <button
                onClick={handleSaveConfigs}
                className="bg-brand-purple hover:bg-brand-purple-hover text-white rounded-xl px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer"
              >
                Save Multipliers
              </button>
            </div>
          </div>

          {/* League Launcher */}
          <div className="glass-panel rounded-2xl p-6 border border-purple-500/10 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">League Launcher</h3>
              <p className="text-xs text-gray-400 mt-1">Configure parameters and launch the competition brackets live.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">League Name</label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">League Description</label>
                <textarea
                  value={leagueDesc}
                  rows={2}
                  onChange={(e) => setLeagueDesc(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-purple-500/10 pt-4">
                <div>
                  <span className="text-xs font-bold text-white">Current Status</span>
                  <span className="text-[10px] text-gray-400 block">
                    {leagueLaunched ? "Live Voting Active" : "Registration Setup Mode"}
                  </span>
                </div>
                <button
                  onClick={handleLaunchLeague}
                  className={`rounded-xl px-6 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    leagueLaunched
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-brand-emerald text-white hover:bg-brand-emerald/90"
                  }`}
                >
                  {leagueLaunched ? "Pause League" : "Launch League Live"}
                </button>
              </div>
            </div>
          </div>

          {/* Supabase API Configuration */}
          <div className="glass-panel rounded-2xl p-6 border border-purple-500/10 space-y-6 md:col-span-2">
            <div>
              <h3 className="text-base font-bold text-white">Supabase Storage Configuration</h3>
              <p className="text-xs text-gray-400 mt-1">Configure your Supabase Project URL and Published API Key (Anon Key) to enable video uploads directly to Supabase Storage.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://your-project-ref.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSaveConfigs}
              className="bg-brand-cyan hover:bg-brand-cyan/85 text-black rounded-xl px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer"
            >
              Save Supabase Settings
            </button>
          </div>
        </div>
      )}

      {/* STANDINGS TAB */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="bg-brand-card/25 border border-purple-500/10 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Live normalised Standings Leaderboard</h2>
              <p className="text-xs text-gray-400">Formula: 50% Technical Review + 50% Normalized Fan Score</p>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center gap-1 text-xs text-brand-cyan hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-purple-500/10 bg-brand-dark/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 bg-brand-card/30 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                  <th className="py-4 px-6 text-center">Rank</th>
                  <th className="py-4 px-6">Competitor</th>
                  <th className="py-4 px-6 text-center">Style Class</th>
                  <th className="py-4 px-6 text-center">Technical Score</th>
                  <th className="py-4 px-6 text-center">Fan Votes Rating</th>
                  <th className="py-4 px-6 text-center">Consolidated Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5 text-xs text-gray-300">
                {competitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 font-light">
                      No scored competitors found.
                    </td>
                  </tr>
                ) : (
                  competitors.map((c, index) => (
                    <tr key={c.id} className="hover:bg-brand-card/10 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-brand-cyan">
                        #{index + 1}
                      </td>
                      <td className="py-4 px-6 space-y-0.5">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-[10px] text-gray-400 block">{c.city}</span>
                      </td>
                      <td className="py-4 px-6 text-center uppercase font-bold text-[10px] text-purple-300">
                        {c.styleTag === "BOLLYWOOD" ? "Cinematic" : c.styleTag}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold">
                        {c.aiScore > 0 ? `${c.aiScore} / 10` : "N/A"}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-brand-purple-hover">
                        {c.normalizedFanScore} / 10
                      </td>
                      <td className="py-4 px-6 text-center font-extrabold text-white text-sm">
                        {c.phase1Score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP 16 TAB */}
      {activeTab === "top16" && (
        <div className="space-y-6">
          <div className="bg-brand-card/25 border border-purple-500/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Top 16 Tournament Bracket Arena</h2>
              <p className="text-xs text-gray-400 mt-1">Oversee candidates moved to the elimination brackets and trigger peer access codes.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleTriggerPeerAccess(true)}
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-black rounded-xl px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Trigger Access (Unlock Forms)
              </button>
              <button
                onClick={() => handleTriggerPeerAccess(false)}
                className="bg-brand-dark border border-purple-500/20 text-gray-300 hover:text-white rounded-xl px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Lock Peer Ballot Forms
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.filter(c => c.isTop16).length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-purple-500/15 rounded-2xl">
                No contestants added to Top 16 Arena yet. Check boxes in the applicants list to move them.
              </div>
            ) : (
              competitors.filter(c => c.isTop16).map((c) => {
                const code = `${c.name.toUpperCase().replace(/\s+/g, "")}-TOP16`;
                return (
                  <div key={c.id} className="glass-panel border-purple-500/10 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-brand-cyan/15 text-brand-cyan px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          Top 16 Contestant
                        </span>
                        <button
                          onClick={() => handleToggleTop16(c.id, true)}
                          className="text-[10px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2 leading-tight">{c.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-1">{c.city} &bull; {c.styleTag === "BOLLYWOOD" ? "Cinematic" : c.styleTag}</p>
                    </div>

                    <div className="bg-brand-dark/50 border border-purple-500/5 rounded-xl p-3 space-y-1.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Peer Access Code</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-brand-cyan font-bold select-all">{code}</span>
                        <span className="text-[9px] text-gray-500">MCQ access enabled</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ACCESS CODES TAB */}
      {activeTab === "tokens" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-panel border-purple-500/10 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Generate Evaluation Tokens</h3>
              <p className="text-xs text-gray-400 mt-1">Issue unique codes to lock/unlock peer voting.</p>
            </div>
            <form onSubmit={handleIssueToken} className="space-y-4">
              {tokenError && <p className="text-xs text-red-400 font-semibold">{tokenError}</p>}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Access Token Key</label>
                <input
                  type="text"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="E.g., JUDGE-LIVE-2026"
                  className="w-full bg-brand-dark/50 border border-purple-500/15 focus:border-brand-purple/40 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-purple hover:bg-brand-purple-hover text-white rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                Issue Token
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-purple-500/10 bg-brand-dark/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 bg-brand-card/30 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                  <th className="py-4 px-6">Access Code</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5 text-xs text-gray-300">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 font-light">
                      No active evaluation tokens found.
                    </td>
                  </tr>
                ) : (
                  codes.map((c) => (
                    <tr key={c.code} className="hover:bg-brand-card/10 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white tracking-wide">
                        {c.code}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          c.active
                            ? "bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald"
                            : "bg-red-950/20 border border-red-500/20 text-red-400"
                        }`}>
                          {c.active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {c.active ? (
                          <button
                            onClick={() => handleRevokeToken(c.code)}
                            className="text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-gray-500">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
