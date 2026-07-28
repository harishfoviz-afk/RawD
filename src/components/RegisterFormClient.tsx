// src/components/RegisterFormClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { onboardContestant } from "@/app/actions";
import { 
  Sparkles, User, Mail, Phone, MapPin, Video, 
  HelpCircle, Check, Loader2, AlertCircle 
} from "lucide-react";

interface StyleCard {
  tag: string;
  name: string;
  desc: string;
  badge: string;
}

const DANCE_STYLES: StyleCard[] = [
  {
    tag: "BOLLYWOOD",
    name: "Cinematic",
    desc: "Expressive, high-energy dancing to commercial movie tracks. Blends fluid storytelling with theatrical hits.",
    badge: "Cinematic Fusion"
  },
  {
    tag: "FOLK_TEMPO",
    name: "Festive, Folk & Tempo",
    desc: "Fast, bouncy footwork and celebratory jumps like Bhangra, Garba, Dappankuthu, Tap, or Shuffling.",
    badge: "High-Stamina"
  },
  {
    tag: "CLASSICAL",
    name: "Graceful & Semi-Classical",
    desc: "Posture-focused classical or semi-classical forms. Prioritizes graceful arm lines, neat shapes, and clean balance.",
    badge: "Semi-Classical"
  },
  {
    tag: "STREET",
    name: "Street & Popping",
    desc: "Heavy isolations, sudden muscular freezes (hits), locking, popping, or robotic control.",
    badge: "Sharp Popping"
  },
  {
    tag: "FLUID",
    name: "Fluid & Contemporary",
    desc: "Smooth acceleration, slow transitions, wide extensions, and continuous gliding or emotional shapes.",
    badge: "Lyrical Flow"
  }
];

export default function RegisterFormClient() {
  const router = useRouter();
  
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [styleTag, setStyleTag] = useState("FLUID");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Statuses
  const [status, setStatus] = useState<"idle" | "uploading" | "registering" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !city || !videoFile) {
      setErrorMsg("Please fill out all fields and select a video file.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    try {
      // 1. Upload video file via API route
      const uploadData = new FormData();
      uploadData.append("file", videoFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || "Video upload failed.");
      }

      setStatus("registering");

      // 2. Create contestant record
      const result = await onboardContestant({
        name,
        email,
        phone,
        city,
        videoUrl: uploadResult.filePath,
        styleTag,
      });

      if (result.success && result.contestant) {
        setStatus("success");
        // Trigger the background scoring worker asynchronously in the background
        fetch("/api/worker/process", {
          method: "POST",
          headers: {
            "x-admin-secret": "DANCE_HEURISTICS_SECRET_KEY_2026",
          },
        }).catch((err) => console.error("Auto trigger worker failed:", err));

        // Redirect to voting profile to poll AI progress
        router.push(`/vote/${result.contestant.publicVotingSlug}`);
      } else {
        throw new Error(result.error || "Onboarding database record failed.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Registration failed. Please check network and file size.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Grid: Dancer Profile Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-card/45 border border-purple-500/5 rounded-2xl p-6 backdrop-blur-sm">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-brand-purple" /> Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aisha Patel"
            className="w-full bg-brand-dark/65 border border-purple-500/15 focus:border-brand-purple/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 text-brand-purple" /> Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aisha.patel@gmail.com"
            className="w-full bg-brand-dark/65 border border-purple-500/15 focus:border-brand-purple/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 text-brand-purple" /> Contact Number
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-brand-dark/65 border border-purple-500/15 focus:border-brand-purple/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand-purple" /> Performance City
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Mumbai, IN"
            className="w-full bg-brand-dark/65 border border-purple-500/15 focus:border-brand-purple/50 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
          />
        </div>
      </div>

      {/* Style Selector Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-brand-purple" />
            Performance Style Class
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Select the style category that best fits your routine. The scoring engine evaluates key dimensions based on your choice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DANCE_STYLES.map((style) => {
            const isSelected = styleTag === style.tag;
            
            // Define style-specific color tokens
            let colors = {
              bg: isSelected ? "bg-brand-purple/10" : "bg-brand-card/30",
              border: isSelected ? "border-brand-purple" : "border-purple-500/10 hover:border-purple-500/25",
              text: isSelected ? "text-brand-purple-hover" : "text-white",
              badge: isSelected ? "bg-brand-purple text-white" : "bg-purple-500/10 text-brand-purple-hover",
              checkBg: "bg-brand-purple",
              hoverText: "group-hover:text-brand-purple-hover"
            };

            if (style.tag === "BOLLYWOOD") {
              colors = {
                bg: isSelected ? "bg-pink-500/10" : "bg-brand-card/30",
                border: isSelected ? "border-pink-500" : "border-pink-500/10 hover:border-pink-500/25",
                text: isSelected ? "text-pink-400" : "text-white",
                badge: isSelected ? "bg-pink-500 text-white" : "bg-pink-500/10 text-pink-400",
                checkBg: "bg-pink-500",
                hoverText: "group-hover:text-pink-400"
              };
            } else if (style.tag === "FOLK_TEMPO") {
              colors = {
                bg: isSelected ? "bg-amber-500/10" : "bg-brand-card/30",
                border: isSelected ? "border-amber-500" : "border-amber-500/10 hover:border-amber-500/25",
                text: isSelected ? "text-amber-400" : "text-white",
                badge: isSelected ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-400",
                checkBg: "bg-amber-500",
                hoverText: "group-hover:text-amber-400"
              };
            } else if (style.tag === "CLASSICAL") {
              colors = {
                bg: isSelected ? "bg-emerald-500/10" : "bg-brand-card/30",
                border: isSelected ? "border-emerald-500" : "border-emerald-500/10 hover:border-emerald-500/25",
                text: isSelected ? "text-emerald-400" : "text-white",
                badge: isSelected ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-400",
                checkBg: "bg-emerald-500",
                hoverText: "group-hover:text-emerald-400"
              };
            } else if (style.tag === "STREET") {
              colors = {
                bg: isSelected ? "bg-cyan-500/10" : "bg-brand-card/30",
                border: isSelected ? "border-cyan-500" : "border-cyan-500/10 hover:border-cyan-500/25",
                text: isSelected ? "text-cyan-400" : "text-white",
                badge: isSelected ? "bg-cyan-500 text-white" : "bg-cyan-500/10 text-cyan-400",
                checkBg: "bg-cyan-500",
                hoverText: "group-hover:text-cyan-400"
              };
            }

            return (
              <div
                key={style.tag}
                onClick={() => setStyleTag(style.tag)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between h-40 group ${colors.bg} ${colors.border}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors.badge}`}>
                      {style.badge}
                    </span>
                    {isSelected && (
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${colors.checkBg}`}>
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold tracking-tight mt-2 transition-colors ${colors.text} ${colors.hoverText}`}>
                    {style.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-normal mt-1.5 line-clamp-3">
                    {style.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Upload Dropzone */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="h-4.5 w-4.5 text-brand-purple" />
            Upload Audition Clip
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Ensure the dancer is fully visible inside the frame. MP4 file formats under 50MB are recommended.
          </p>
        </div>

        <div className="relative border-2 border-dashed border-purple-500/15 rounded-2xl bg-brand-card/30 hover:bg-brand-card/50 transition-colors p-8 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group">
          <input
            type="file"
            accept="video/*"
            required
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple group-hover:scale-105 transition-transform">
            <Video className="h-6 w-6" />
          </span>
          <div>
            {videoFile ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-cyan">Selected: {videoFile.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Click or drag video file here to upload</p>
                <p className="text-[10px] text-gray-500">MP4, MOV, or WEBM format allowed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Controls */}
      <div className="flex items-center justify-end border-t border-purple-500/5 pt-6">
        {status === "idle" && (
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan px-8 py-3 text-xs font-bold text-white hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
          >
            Submit Audition for AI Processing
          </button>
        )}

        {status === "uploading" && (
          <button
            disabled
            type="button"
            className="rounded-xl bg-brand-purple/20 border border-brand-purple/30 px-8 py-3 text-xs font-bold text-brand-purple flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
            Uploading High-Definition Video Clip...
          </button>
        )}

        {status === "registering" && (
          <button
            disabled
            type="button"
            className="rounded-xl bg-brand-purple/20 border border-brand-purple/30 px-8 py-3 text-xs font-bold text-brand-purple flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
            Enrolling in Leaderboard Database...
          </button>
        )}

        {status === "success" && (
          <button
            disabled
            type="button"
            className="rounded-xl bg-brand-emerald/20 border border-brand-emerald/30 px-8 py-3 text-xs font-bold text-brand-emerald flex items-center gap-1.5"
          >
            <Check className="h-4.5 w-4.5" />
            Audition Registered! Redirecting...
          </button>
        )}
      </div>

      {/* Dynamic Progress/Error Modal Overlay */}
      {status !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/20 bg-[#0c081d] p-8 space-y-6 text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-200">
            <span className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-purple/5 blur-3xl pointer-events-none"></span>
            
            {status === "uploading" && (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple/10 text-brand-cyan">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">Uploading Dance Clip</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Uploading your video file to Supabase Storage. Please do not close or refresh this page.
                  </p>
                </div>
                {/* Simulated Progress bar */}
                <div className="w-full bg-brand-dark/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-purple to-brand-cyan h-full w-[45%] animate-pulse rounded-full"></div>
                </div>
              </div>
            )}

            {status === "registering" && (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">Registering Audition</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Enrolling your dancer profile in the tournament database and queueing for Kinematic AI analysis.
                  </p>
                </div>
                <div className="w-full bg-brand-dark/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-cyan to-brand-purple h-full w-[85%] animate-pulse rounded-full"></div>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-emerald/10 text-brand-emerald">
                  <Check className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">Audition Registered!</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Redirecting you to your public voting profile...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-red-400">Submission Failed</h3>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed bg-red-500/5 border border-red-500/10 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {errorMsg}
                  </p>
                  
                  {/* Context-aware suggestions */}
                  <p className="text-[10px] text-gray-400 leading-normal pt-2">
                    {errorMsg.toLowerCase().includes("jws") || errorMsg.toLowerCase().includes("jwt") ? (
                      <span className="text-brand-cyan">
                        💡 <strong>Suggestion:</strong> This error is usually caused by an <strong>invalid Supabase Anon Key</strong>. Please log into the Admin Cockpit settings and check your Supabase credentials.
                      </span>
                    ) : errorMsg.toLowerCase().includes("bucket") ? (
                      <span className="text-brand-cyan">
                        💡 <strong>Suggestion:</strong> This means the 'auditions' bucket does not exist. Please create a public bucket named 'auditions' in your Supabase storage console.
                      </span>
                    ) : (
                      "Please double-check your network connection and Supabase credentials and try again."
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="w-full rounded-xl bg-brand-dark hover:bg-brand-dark/80 border border-purple-500/15 py-3 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Close & Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
