// src/app/api/contestants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contestants = await prisma.contestant.findMany({
      where: { status: "READY" },
      select: {
        id: true,
        name: true,
        city: true,
        videoUrl: true,
        publicVotingSlug: true,
        styleTag: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, contestants });
  } catch (error: any) {
    console.error("Failed to query contestants list:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
