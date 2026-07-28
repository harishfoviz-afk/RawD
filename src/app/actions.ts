// src/app/actions.ts
"use server";

import { supabase } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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
      const { data: existing } = await supabase
        .from("Contestant")
        .select("id")
        .eq("publicVotingSlug", publicVotingSlug)
        .maybeSingle();
      if (!existing) break;
      count++;
      publicVotingSlug = `${baseSlug}-${count}-${Math.floor(Math.random() * 1000)}`;
    }

    const { data: contestant, error } = await supabase
      .from("Contestant")
      .insert({
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        videoUrl: formData.videoUrl,
        publicVotingSlug,
        status: "PENDING_AI",
        styleTag: styleTagUpper,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, contestant };
  } catch (error: any) {
    console.error("Onboarding failed:", error);
    return {
      success: false,
      error: error.message || "Onboarding failed",
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
    const { data: scorecard, error: upsertError } = await supabase
      .from("AIScorecard")
      .upsert({
        contestantId: data.contestantId,
        styleGroup: data.styleGroup,
        sharpnessScore: data.sharpnessScore,
        alignmentScore: data.alignmentScore,
        timingScore: data.timingScore,
        stabilityScore: data.stabilityScore,
        overallScore: data.overallScore,
        feedbackSummary: data.feedbackSummary,
      })
      .select()
      .single();

    if (upsertError) throw new Error(upsertError.message);

    // Update contestant status
    const { error: updateError } = await supabase
      .from("Contestant")
      .update({ status: "SCORING_COMPLETE" })
      .eq("id", data.contestantId);

    if (updateError) throw new Error(updateError.message);

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
    const { data: existing } = await supabase
      .from("PublicVote")
      .select("id")
      .eq("contestantId", contestantId)
      .eq("voterIp", voterIp)
      .is("voterIdentifier", null)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "You have already cast a vote for this dancer!" };
    }

    // 2. Create vote
    const { error } = await supabase
      .from("PublicVote")
      .insert({
        id: crypto.randomUUID(),
        contestantId,
        voterIp,
        type: "WA_ANONYMOUS",
        weight: 1.0,
      });

    if (error) throw new Error(error.message);

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
    const { data: activeToken } = await supabase
      .from("AccessCode")
      .select("*")
      .eq("code", data.evaluatorPeerId)
      .eq("active", true)
      .maybeSingle();

    if (!activeToken) {
      return { success: false, error: "Access Denied: Invalid or revoked peer evaluation token" };
    }

    // 2. Save Ballot using conflict handling for the composite constraint
    const { data: ballot, error: upsertError } = await supabase
      .from("PeerBallot")
      .upsert({
        id: crypto.randomUUID(),
        targetContestantId: data.targetContestantId,
        evaluatorPeerId: data.evaluatorPeerId,
        musicalityScore: data.musicalityScore,
        executionScore: data.executionScore,
        energyScore: data.energyScore,
        presenceScore: data.presenceScore,
        compiledPeerScore: data.compiledPeerScore,
      }, {
        onConflict: "targetContestantId,evaluatorPeerId"
      })
      .select()
      .single();

    if (upsertError) throw new Error(upsertError.message);

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
    const { data: existing } = await supabase
      .from("AccessCode")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("AccessCode")
        .update({ active: true })
        .eq("code", code);
    } else {
      await supabase
        .from("AccessCode")
        .insert({ code, active: true });
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
    await supabase
      .from("AccessCode")
      .update({ active: false })
      .eq("code", code);

    revalidatePath("/admin");
    revalidatePath("/peer-ballot");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAccessCodes() {
  try {
    const { data } = await supabase
      .from("AccessCode")
      .select("*")
      .order("createdAt", { ascending: false });
    return data || [];
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
      const { data: existing } = await supabase
        .from("AccessCode")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!existing) {
        await supabase.from("AccessCode").insert({ code, active: true });
      }
    }
  } catch (err) {
    console.error("Token seeding failed:", err);
  }
}

export async function saveSystemConfig(key: string, value: string) {
  try {
    await supabase
      .from("SystemConfig")
      .upsert({ key, value })
      .select()
      .single();

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSystemConfigs() {
  try {
    const { data } = await supabase.from("SystemConfig").select("*");
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function toggleTop16(contestantId: string, isTop16: boolean) {
  try {
    const { data: contestant, error } = await supabase
      .from("Contestant")
      .update({ isTop16 })
      .eq("id", contestantId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If marked as Top 16, automatically generate/seed their peer code
    if (isTop16 && contestant) {
      const code = `${contestant.name.toUpperCase().replace(/\s+/g, "")}-TOP16`;
      const { data: existing } = await supabase
        .from("AccessCode")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!existing) {
        await supabase.from("AccessCode").insert({
          code,
          active: false, // Inactive by default until "Trigger Access" is clicked
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
    const { data: current } = await supabase
      .from("Contestant")
      .select("videoUrl")
      .eq("id", contestantId)
      .single();

    await supabase
      .from("Contestant")
      .update({
        originalVideoUrl: current?.videoUrl || null,
        videoUrl: newVideoUrl,
      })
      .eq("id", contestantId);

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function launchLeague(leagueName: string, leagueDesc: string, launch: boolean) {
  try {
    // Run updates sequentially
    await supabase.from("SystemConfig").upsert({ key: "LEAGUE_LAUNCHED", value: launch ? "true" : "false" });
    await supabase.from("SystemConfig").upsert({ key: "LEAGUE_NAME", value: leagueName });
    await supabase.from("SystemConfig").upsert({ key: "LEAGUE_DESC", value: leagueDesc });

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
    const { data: contestants } = await supabase
      .from("Contestant")
      .select("name")
      .eq("isTop16", true);

    if (contestants) {
      for (const c of contestants) {
        const code = `${c.name.toUpperCase().replace(/\s+/g, "")}-TOP16`;
        await supabase.from("AccessCode").upsert({ code, active });
      }
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
    const { data: c } = await supabase
      .from("Contestant")
      .select("name")
      .eq("id", contestantId)
      .single();

    // Simulate push, return random mock ID
    const youtubeId = `yt-${Math.random().toString(36).substring(2, 11)}`;
    console.log(`[youtubeSync] Pushed ${c?.name || "Unknown contestant"}'s video clip to YouTube with ID: ${youtubeId}`);
    return { success: true, youtubeId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
