// src/app/api/contestant/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing slug parameter" }, { status: 400 });
    }

    const { data: contestant, error } = await supabase
      .from("Contestant")
      .select("status")
      .eq("publicVotingSlug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!contestant) {
      return NextResponse.json({ success: false, error: "Contestant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: contestant.status });
  } catch (error: any) {
    console.error("Status query failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to query status" }, { status: 500 });
  }
}
