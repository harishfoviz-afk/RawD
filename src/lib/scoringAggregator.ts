// src/lib/scoringAggregator.ts
import { supabase } from "./db";

export interface AggregatedContestant {
  id: string;
  name: string;
  email: string;
  city: string;
  videoUrl: string;
  publicVotingSlug: string;
  status: string;
  styleTag: string;
  aiScore: number;
  peerScore: number;
  votesCount: number;
  waVotesCount: number;
  portalVotesCount: number;
  socialLikesCount: number;
  totalFanScore: number;
  normalizedFanScore: number;
  phase1Score: number; // 50% AI + 50% Normalized Fan
  phase2Score: number; // 50% Peer + 50% Normalized Fan
  aiScorecard: {
    styleGroup: string;
    sharpnessScore: number;
    stabilityScore: number;
    alignmentScore: number;
    timingScore: number;
    overallScore: number;
    feedbackSummary: string;
  } | null;
}

export async function compileLeaderboard(): Promise<AggregatedContestant[]> {
  try {
    // Read dynamic settings and weights from system config table
    const { data: configs, error: configError } = await supabase.from("SystemConfig").select("*");
    if (configError) throw new Error(configError.message);
    const configMap = new Map((configs || []).map(c => [c.key, c.value]));

    const weightWA = parseFloat(configMap.get("WEIGHT_WA_ANONYMOUS") || "0.1");
    const weightOAuth = parseFloat(configMap.get("WEIGHT_OAUTH_VERIFIED") || "1.5");
    const weightSocial = parseFloat(configMap.get("WEIGHT_SOCIAL_SYNC") || "1.0");

    const { data: contestants, error: contestantsError } = await supabase
      .from("Contestant")
      .select("*, aiScorecard:AIScorecard(*), votes:PublicVote(*), peerBallots:PeerBallot(*)");

    if (contestantsError) throw new Error(contestantsError.message);

    const contestantsWithWeightedVotes = (contestants || []).map((c: any) => {
      // Normalize relation properties to handle array or object return formats
      const aiScorecardRaw = Array.isArray(c.aiScorecard) ? c.aiScorecard[0] : c.aiScorecard;
      const aiScore = aiScorecardRaw ? aiScorecardRaw.overallScore : 0;
      
      const votes = Array.isArray(c.votes) ? c.votes : [];
      const peerBallots = Array.isArray(c.peerBallots) ? c.peerBallots : [];

      // Categorize votes
      const waVotes = votes.filter((v: any) => v.type === "WA_ANONYMOUS");
      const portalVotes = votes.filter((v: any) => v.type === "OAUTH_VERIFIED");
      const socialVotes = votes.filter((v: any) => v.type === "SOCIAL_SYNC");

      // Calculate weighted fan score dynamically based on admin configurations
      const totalFanScore = 
        (waVotes.length * weightWA) + 
        (portalVotes.length * weightOAuth) + 
        (socialVotes.length * weightSocial);

      // Average peer ballot score
      const peerScore = peerBallots.length > 0
        ? peerBallots.reduce((sum: number, b: any) => sum + b.compiledPeerScore, 0) / peerBallots.length
        : 0;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        city: c.city,
        videoUrl: c.videoUrl,
        publicVotingSlug: c.publicVotingSlug,
        status: c.status,
        styleTag: c.styleTag,
        aiScore,
        peerScore,
        votesCount: votes.length,
        waVotesCount: waVotes.length,
        portalVotesCount: portalVotes.length,
        socialLikesCount: socialVotes.length,
        totalFanScore: parseFloat(totalFanScore.toFixed(2)),
        aiScorecard: aiScorecardRaw || null,
      };
    });

    // Find the maximum fan score among all contestants to normalize
    const maxFanScore = Math.max(0.1, ...contestantsWithWeightedVotes.map(c => c.totalFanScore));

    return contestantsWithWeightedVotes.map(c => {
      // Normalize the fan score to a 0-10 scale
      const normalizedFanScore = parseFloat(((c.totalFanScore / maxFanScore) * 10).toFixed(2));

      // Phase 1 formula: Total Ranking = (50% * AI Score) + (50% * Normalized Fan Votes)
      const phase1Score = parseFloat(((0.5 * c.aiScore) + (0.5 * normalizedFanScore)).toFixed(2));

      // Phase 2 Studio Bracket: Elimination Round Score = (50% * Peer MCQ Ballot Score) + (50% * Normalized Fan Votes)
      const phase2Score = parseFloat(((0.5 * c.peerScore) + (0.5 * normalizedFanScore)).toFixed(2));

      return {
        ...c,
        normalizedFanScore,
        phase1Score,
        phase2Score,
      };
    }).sort((a, b) => b.phase1Score - a.phase1Score); // Sort by Phase 1 Rank by default
  } catch (error) {
    console.error("Failed to compile leaderboard scores:", error);
    return [];
  }
}
