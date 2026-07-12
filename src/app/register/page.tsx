// src/app/register/page.tsx
import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import RegisterFormClient from "@/components/RegisterFormClient";

import AuditionGallery from "@/components/AuditionGallery";

export default function RegisterPage() {
  return (
    <div className="flex-1 py-12 bg-[#07050f] text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/15 border border-brand-purple/30 text-brand-purple">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Audition Registration</h1>
              <p className="text-sm text-gray-400 mt-1">
                Enter your details, select your performance style, and upload your audition video.
              </p>
            </div>
          </div>
        </div>

        <RegisterFormClient />

        {/* Auditions Thumbnail Gallery */}
        <AuditionGallery />
      </div>
    </div>
  );
}
