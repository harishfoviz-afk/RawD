// src/app/api/contestant/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "Missing slug parameter" }, { status: 400 });
    }

    const contestant = await prisma.contestant.findUnique({
      where: { publicVotingSlug: slug },
      select: { status: true },
    });

    if (!contestant) {
      return NextResponse.json({ success: false, error: "Contestant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: contestant.status });
  } catch (error: any) {
    console.error("Status query failed:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to query status" }, { status: 500 });
  }
}
