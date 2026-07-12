// src/components/ShareBanner.tsx
"use client";

import React from "react";

export default function ShareBanner({ slug }: { slug: string }) {
  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/vote/${slug}`);
      alert("Shortlink copied to clipboard!");
    }
  };

  return (
    <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider block">Shortlisted Contender</span>
        <p className="text-xs text-gray-300 mt-0.5">
          Congratulations! This performance is shortlisted. Copy this link to share it with your new and dear ones:
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={typeof window !== "undefined" ? `${window.location.origin}/vote/${slug}` : `http://localhost:3000/vote/${slug}`}
          className="bg-brand-dark/80 border border-purple-500/15 rounded-xl px-3 py-1.5 text-xs text-brand-cyan select-all outline-none font-mono min-w-[220px]"
        />
        <button
          onClick={handleCopy}
          className="bg-brand-purple hover:bg-brand-purple-hover text-white font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
