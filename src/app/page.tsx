// src/app/page.tsx
import React from "react";
import { 
  Award, Sparkles, Video, Play, CheckCircle2, 
  UserCheck, ShieldAlert, Activity, DollarSign, Upload, Share2
} from "lucide-react";
import Link from "next/link";
import AuditionGallery from "@/components/AuditionGallery";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative bg-[#07050f] text-white">
      {/* Background Looping Video */}
      <div className="absolute inset-0 z-0 opacity-20 overflow-hidden pointer-events-none">
        <video
          src="https://assets.mixkit.co/videos/preview/mixkit-hip-hop-dancer-performing-under-neon-lights-42280-large.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07050f]/60 via-[#07050f]/90 to-[#07050f] pointer-events-none"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 border-b border-brand-neongreen/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="mx-auto max-w-fit flex items-center gap-1.5 rounded-full bg-brand-neongreen/10 border border-brand-neongreen/30 px-3.5 py-1 text-xs font-bold text-brand-neongreen tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5 text-brand-neongreen" />
            <span>Grand cash prize season open</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl leading-tight">
            Know Dance? <br />
            <span className="bg-gradient-to-r from-brand-neongreen to-brand-cyan bg-clip-text text-transparent">
              Win Cash Prizes!
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-gray-300 font-light leading-relaxed">
            Submit your raw performance clip, lock in your cinematic style, and get graded by our technical analysis engine. Earn public votes to progress to the tournament brackets!
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-brand-neongreen to-brand-cyan px-8 py-4 text-sm font-black text-black transition-all cursor-pointer"
            >
              Upload Audition Now
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step Competition Path */}
      <section className="py-20 bg-brand-darker/40 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] font-bold text-brand-neongreen uppercase tracking-widest block">Competition Journey</span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              The 4-Step Tournament Path
            </h2>
            <p className="text-sm text-gray-400">
              Here is how dancers qualify and compete to walk away with grand cash rewards:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Upload",
                desc: "Register your details and upload your raw 10-15s audition dance clip under your selected Cinematic style.",
                icon: <Upload className="h-6 w-6 text-brand-neongreen" />,
              },
              {
                step: "02",
                title: "Share for Votes",
                desc: "Dancers scoring above the 50% technical threshold receive their short url to share with new & dear ones for public scoring.",
                icon: <Share2 className="h-6 w-6 text-brand-cyan" />,
              },
              {
                step: "03",
                title: "Live Dances of Top 16",
                desc: "Top 16 performers progress to the tournament brackets, receiving custom alphanumeric voting codes.",
                icon: <Award className="h-6 w-6 text-brand-neongreen" />,
              },
              {
                step: "04",
                title: "Win Cash Prizes",
                desc: "Judges view aired episodes side-by-side with MCQ peer ballots. Top rated contestants win grand cash rewards!",
                icon: <DollarSign className="h-6 w-6 text-brand-cyan" />,
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-brand-neongreen/10 bg-brand-card/25 p-6 transition-all hover:border-brand-neongreen/30 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/50 border border-brand-neongreen/10">
                    {card.icon}
                  </span>
                  <span className="text-2xl font-black text-brand-neongreen/20">{card.step}</span>
                </div>
                <h3 className="mt-5 text-base font-extrabold text-white tracking-tight">{card.title}</h3>
                <p className="mt-2.5 text-xs text-gray-400 font-light leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Auditions Gallery */}
      <AuditionGallery />
    </div>
  );
}
