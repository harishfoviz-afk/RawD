// src/app/api/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contestantId, type, voterIdentifier } = body;

    if (!contestantId || !type) {
      return NextResponse.json({ success: false, error: "Missing contestantId or vote type" }, { status: 400 });
    }

    const allowedTypes = ["WA_ANONYMOUS", "OAUTH_VERIFIED", "SOCIAL_SYNC"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid vote type" }, { status: 400 });
    }

    // Determine weight based on requirements
    let weight = 1.0;
    if (type === "WA_ANONYMOUS") {
      weight = 0.1;
    } else if (type === "OAUTH_VERIFIED") {
      weight = 1.5;
    } else if (type === "SOCIAL_SYNC") {
      weight = 1.0;
    }

    // Extract voter IP
    const headerList = await headers();
    const rawIp = headerList.get("x-forwarded-for") || "127.0.0.1";
    const voterIp = rawIp.split(",")[0].trim();

    // Deduplication rules
    if (type === "OAUTH_VERIFIED") {
      if (!voterIdentifier) {
        return NextResponse.json({ success: false, error: "Missing user email or identifier for verified vote" }, { status: 400 });
      }

      // Check database unique constraint
      const { data: existing, error } = await supabase
        .from("PublicVote")
        .select("id")
        .eq("contestantId", contestantId)
        .eq("voterIdentifier", voterIdentifier)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (existing) {
        return NextResponse.json({ success: false, error: "You have already cast an authenticated vote for this dancer!" }, { status: 400 });
      }
    } else if (type === "WA_ANONYMOUS") {
      // IP throttle (1 vote per IP per contestant every 30 minutes)
      const throttleTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: existing, error } = await supabase
        .from("PublicVote")
        .select("id")
        .eq("contestantId", contestantId)
        .eq("voterIp", voterIp)
        .eq("type", "WA_ANONYMOUS")
        .gte("createdAt", throttleTime)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (existing) {
        return NextResponse.json({ success: false, error: "Duplicate voting detected. Please try again later." }, { status: 429 });
      }
    }

    // Record the vote
    const { data: vote, error: insertError } = await supabase
      .from("PublicVote")
      .insert({
        contestantId,
        voterIp,
        type,
        weight,
        voterIdentifier: voterIdentifier || null,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ success: true, voteId: vote.id });
  } catch (error: any) {
    console.error("Error processing vote:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process vote" }, { status: 500 });
  }
}
