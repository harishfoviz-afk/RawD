// src/app/admin/page.tsx
import React from "react";
import { getLeaderboardData, getAccessCodes, getSystemConfigs } from "../actions";
import AdminClient from "@/components/AdminClient";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const competitors = await getLeaderboardData();
  const accessCodes = await getAccessCodes();
  const systemConfigs = await getSystemConfigs();

  return (
    <div className="flex-1 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auditions
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-brand-cyan" />
                Admin Cockpit
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Oversee contestant listings, manage settings, toggle brackets, and track rankings.
              </p>
            </div>
          </div>
        </div>

        <AdminClient 
          initialCompetitors={competitors as any} 
          initialCodes={accessCodes as any} 
          initialConfigs={systemConfigs as any} 
        />
      </div>
    </div>
  );
}
