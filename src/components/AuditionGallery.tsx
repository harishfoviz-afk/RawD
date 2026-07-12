// src/components/AuditionGallery.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Video } from "lucide-react";

interface ContestantSummary {
  id: string;
  name: string;
  city: string;
  videoUrl: string;
  publicVotingSlug: string;
  styleTag: string;
}

export default function AuditionGallery() {
  const [contestants, setContestants] = useState<ContestantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadContestants() {
      try {
        const response = await fetch("/api/contestants");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.contestants) {
            setContestants(data.contestants);
          }
        }
      } catch (err) {
        console.error("Error loading gallery contestants:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContestants();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 300 : scrollLeft + 300;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Loading Auditions Gallery...</h4>
        <div className="flex gap-4 overflow-hidden px-4 justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 w-32 bg-brand-card/20 animate-pulse rounded-2xl border border-purple-500/5 shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (contestants.length === 0) {
    return null; // Don't render anything if no contestants are active/ready yet
  }

  const sampleVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4";

  return (
    <div className="w-full py-10 space-y-6 border-t border-purple-500/5 bg-brand-darker/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Video className="h-4.5 w-4.5 text-brand-cyan" />
            Active Auditions Gallery
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Click any dancer to watch their performance and cast your vote.</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-brand-card/45 border border-purple-500/10 hover:border-brand-purple/40 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-brand-card/45 border border-purple-500/10 hover:border-brand-purple/40 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {contestants.map((c) => {
            let styleBadgeColor = "bg-brand-purple/20 text-brand-purple-hover";
            if (c.styleTag === "BOLLYWOOD") styleBadgeColor = "bg-pink-500/20 text-pink-400";
            if (c.styleTag === "FOLK_TEMPO") styleBadgeColor = "bg-amber-500/20 text-amber-400";
            if (c.styleTag === "CLASSICAL") styleBadgeColor = "bg-emerald-500/20 text-emerald-400";
            if (c.styleTag === "STREET") styleBadgeColor = "bg-cyan-500/20 text-cyan-400";

            return (
              <Link
                key={c.id}
                href={`/vote/${c.publicVotingSlug}`}
                className="group flex-shrink-0 w-36 h-52 rounded-2xl overflow-hidden border border-purple-500/10 bg-brand-card/20 flex flex-col justify-between p-2.5 relative hover:border-brand-purple/45 hover:scale-[1.02] active:scale-98 transition-all shadow-md shadow-black/40"
              >
                {/* Moving Video Thumbnail */}
                <div className="absolute inset-0 z-0 bg-black">
                  <video
                    src={c.videoUrl.startsWith("/uploads/") ? sampleVideo : c.videoUrl}
                    muted
                    playsInline
                    loop
                    onMouseEnter={(e) => {
                      try { e.currentTarget.play(); } catch(err){}
                    }}
                    onMouseLeave={(e) => {
                      try { e.currentTarget.pause(); e.currentTarget.currentTime = 0; } catch(err){}
                    }}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/90 via-transparent to-black/30 pointer-events-none"></div>
                </div>

                {/* Badge top */}
                <div className="relative z-10 flex justify-between items-center">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${styleBadgeColor}`}>
                    {c.styleTag === "BOLLYWOOD" ? "Cinematic" : c.styleTag === "FOLK_TEMPO" ? "Folk" : c.styleTag === "CLASSICAL" ? "Classical" : c.styleTag === "STREET" ? "Street" : "Fluid"}
                  </span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-2.5 w-2.5 fill-white" />
                  </span>
                </div>

                {/* Name bottom */}
                <div className="relative z-10">
                  <h4 className="text-[11px] font-extrabold text-white truncate leading-tight group-hover:text-brand-cyan transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-[8px] text-gray-400 mt-0.5">{c.city}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
