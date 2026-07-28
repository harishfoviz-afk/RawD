// src/app/api/contestants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: contestants, error } = await supabase
      .from("Contestant")
      .select("id, name, city, videoUrl, publicVotingSlug, styleTag")
      .eq("status", "READY")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, contestants: contestants || [] });
  } catch (error: any) {
    console.error("Failed to query contestants list:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
