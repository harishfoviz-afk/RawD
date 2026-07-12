// src/app/actions.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to generate a unique voting slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .substring(0, 50);
}

export async function onboardContestant(formData: {
  name: string;
  email: string;
  phone: string;
  city: string;
  videoUrl: string;
  styleTag: string;
}) {
  try {
    // Validate styleTag
    const allowedTags = ["BOLLYWOOD", "FOLK_TEMPO", "CLASSICAL", "STREET", "FLUID"];
    const styleTagUpper = (formData.styleTag || "").toUpperCase();
    if (!allowedTags.includes(styleTagUpper)) {
      return { success: false, error: "Invalid dance style selected. Must be one of: Bollywood, Folk, Classical, Street, or Fluid." };
    }

    // Generate unique slug
    let baseSlug = slugify(formData.name);
    let publicVotingSlug = baseSlug;
    let count = 0;

    // Ensure uniqueness of slug
    while (true) {
      const existing = await prisma.contestant.findUnique({
        where: { publicVotingSlug },
      });
      if (!existing) break;
      count++;
      publicVotingSlug = `${baseSlug}-${count}-${Math.floor(Math.random() * 1000)}`;
    }

    const contestant = await prisma.contestant.create({
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        videoUrl: formData.videoUrl,
        publicVotingSlug,
        status: "PENDING_AI",
        styleTag: styleTagUpper,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, contestant };
  } catch (error: any) {
    console.error("Onboarding failed:", error);
    return {
      success: false,
      error: error.code === "P2002" ? "Email already registered for this competition" : error.message || "Onboarding failed",
    };
  }
}

export async function saveAIScorecard(data: {
  contestantId: string;
  styleGroup: string;
  sharpnessScore: number;
  alignmentScore: number;
  timingScore: number;
  stabilityScore: number;
  overallScore: number;
  feedbackSummary: string;
}) {
  try {
    const scorecard = await prisma.aIScorecard.upsert({
      where: { contestantId: data.contestantId },
      update: {
        styleGroup: data.styleGroup,
        sharpnessScore: data.sharpnessScore,
        alignmentScore: data.alignmentScore,
        timingScore: data.timingScore,
        stabilityScore: data.stabilityScore,
        overallScore: data.overallScore,
        feedbackSummary: data.feedbackSummary,
      },
      create: {
        contestantId: data.contestantId,
        styleGroup: data.styleGroup,
        sharpnessScore: data.sharpnessScore,
        alignmentScore: data.alignmentScore,
        timingScore: data.timingScore,
        stabilityScore: data.stabilityScore,
        overallScore: data.overallScore,
        feedbackSummary: data.feedbackSummary,
      },
    });

    // Update contestant status
    await prisma.contestant.update({
      where: { id: data.contestantId },
      data: { status: "SCORING_COMPLETE" },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/vote/${data.contestantId}`);
    return { success: true, scorecard };
  } catch (error: any) {
    console.error("Failed to save AI Scorecard:", error);
    return { success: false, error: error.message };
  }
}

export async function castVote(contestantId: string, voterIp: string) {
  try {
    // 1. Check if voter already voted for this dancer
    const existing = await prisma.publicVote.findFirst({
      where: {
        contestantId,
        voterIp,
        voterIdentifier: null,
      },
    });

    if (existing) {
      return { success: false, error: "You have already cast a vote for this dancer!" };
    }

    // 2. Create vote
    await prisma.publicVote.create({
      data: {
        contestantId,
        voterIp,
        type: "WA_ANONYMOUS",
        weight: 1.0,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Voting failed:", error);
    return { success: false, error: "Unable to submit vote. Please try again." };
  }
}

export async function submitPeerBallot(data: {
  targetContestantId: string;
  evaluatorPeerId: string;
  musicalityScore: string;
  executionScore: string;
  energyScore: string;
  presenceScore: number;
  compiledPeerScore: number;
}) {
  try {
    // 1. Validate Token Checkpoint
    const activeToken = await prisma.accessCode.findFirst({
      where: {
        code: data.evaluatorPeerId,
        active: true,
      },
    });

    if (!activeToken) {
      return { success: false, error: "Access Denied: Invalid or revoked peer evaluation token" };
    }

    // 2. Save Ballot
    const ballot = await prisma.peerBallot.upsert({
      where: {
        targetContestantId_evaluatorPeerId: {
          targetContestantId: data.targetContestantId,
          evaluatorPeerId: data.evaluatorPeerId,
        },
      },
      update: {
        musicalityScore: data.musicalityScore,
        executionScore: data.executionScore,
        energyScore: data.energyScore,
        presenceScore: data.presenceScore,
        compiledPeerScore: data.compiledPeerScore,
      },
      create: {
        targetContestantId: data.targetContestantId,
        evaluatorPeerId: data.evaluatorPeerId,
        musicalityScore: data.musicalityScore,
        executionScore: data.executionScore,
        energyScore: data.energyScore,
        presenceScore: data.presenceScore,
        compiledPeerScore: data.compiledPeerScore,
      },
    });

    revalidatePath("/admin");
    return { success: true, ballot };
  } catch (error: any) {
    console.error("Ballot submission failed:", error);
    return { success: false, error: error.message || "Failed to submit ballot" };
  }
}

// Token Administration
export async function issueAccessCode(code: string) {
  try {
    const existing = await prisma.accessCode.findUnique({ where: { code } });
    if (existing) {
      await prisma.accessCode.update({
        where: { code },
        data: { active: true },
      });
    } else {
      await prisma.accessCode.create({
        data: { code, active: true },
      });
    }
    revalidatePath("/admin");
    revalidatePath("/peer-ballot");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revokeAccessCode(code: string) {
  try {
    await prisma.accessCode.update({
      where: { code },
      data: { active: false },
    });
    revalidatePath("/admin");
    revalidatePath("/peer-ballot");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAccessCodes() {
  try {
    return await prisma.accessCode.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    return [];
  }
}

// Retrieve leaderboard rankings and contestants data
export async function getLeaderboardData() {
  try {
    const { compileLeaderboard } = await import("@/lib/scoringAggregator");
    return await compileLeaderboard();
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }
}

// Seed helper for evaluation tokens
export async function seedInitialTokens() {
  try {
    const defaultCodes = ["JUDGE-SHARP", "JUDGE-FLUID", "JUDGE-LIVE", "PEER-BALLOT-2026"];
    for (const code of defaultCodes) {
      const existing = await prisma.accessCode.findUnique({ where: { code } });
      if (!existing) {
        await prisma.accessCode.create({ data: { code, active: true } });
      }
    }
  } catch (err) {
    console.error("Token seeding failed:", err);
  }
}

export async function saveSystemConfig(key: string, value: string) {
  try {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSystemConfigs() {
  try {
    return await prisma.systemConfig.findMany();
  } catch (error) {
    return [];
  }
}

export async function toggleTop16(contestantId: string, isTop16: boolean) {
  try {
    const contestant = await prisma.contestant.update({
      where: { id: contestantId },
      data: { isTop16 },
    });
    
    // If marked as Top 16, automatically generate/seed their peer code
    if (isTop16) {
      const code = `${contestant.name.toUpperCase().replace(/\s+/g, "")}-TOP16`;
      const existing = await prisma.accessCode.findUnique({ where: { code } });
      if (!existing) {
        await prisma.accessCode.create({
          data: {
            code,
            active: false, // Inactive by default until "Trigger Access" is clicked
          }
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/peer-ballot");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function overrideVideo(contestantId: string, newVideoUrl: string) {
  try {
    const current = await prisma.contestant.findUnique({
      where: { id: contestantId },
      select: { videoUrl: true }
    });
    
    await prisma.contestant.update({
      where: { id: contestantId },
      data: {
        originalVideoUrl: current?.videoUrl,
        videoUrl: newVideoUrl,
      }
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function launchLeague(leagueName: string, leagueDesc: string, launch: boolean) {
  try {
    await prisma.$transaction([
      prisma.systemConfig.upsert({
        where: { key: "LEAGUE_LAUNCHED" },
        update: { value: launch ? "true" : "false" },
        create: { key: "LEAGUE_LAUNCHED", value: launch ? "true" : "false" },
      }),
      prisma.systemConfig.upsert({
        where: { key: "LEAGUE_NAME" },
        update: { value: leagueName },
        create: { key: "LEAGUE_NAME", value: leagueName },
      }),
      prisma.systemConfig.upsert({
        where: { key: "LEAGUE_DESC" },
        update: { value: leagueDesc },
        create: { key: "LEAGUE_DESC", value: leagueDesc },
      })
    ]);

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function triggerPeerAccess(active: boolean) {
  try {
    // Find all Top 16 access codes and activate/deactivate them
    const contestants = await prisma.contestant.findMany({
      where: { isTop16: true },
      select: { name: true }
    });

    for (const c of contestants) {
      const code = `${c.name.toUpperCase().replace(/\s+/g, "")}-TOP16`;
      await prisma.accessCode.upsert({
        where: { code },
        update: { active },
        create: { code, active },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/peer-ballot");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pushVideoToYouTube(contestantId: string) {
  try {
    const c = await prisma.contestant.findUnique({
      where: { id: contestantId },
      select: { name: true }
    });
    // Simulate push, return random mock ID
    const youtubeId = `yt-${Math.random().toString(36).substring(2, 11)}`;
    console.log(`[youtubeSync] Pushed ${c?.name}'s video clip to YouTube with ID: ${youtubeId}`);
    return { success: true, youtubeId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
