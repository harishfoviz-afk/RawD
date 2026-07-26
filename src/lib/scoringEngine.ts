// src/lib/scoringEngine.ts

export interface KinematicWeights {
  Ws: number; // Torso/Core Stability
  Wd: number; // Deceleration/Sharpness
  We: number; // Extension/Range of Motion
  Wr: number; // Rhythmic Sync/Timing
}

export function getKinematicWeights(styleTag: string): KinematicWeights {
  switch (styleTag.toUpperCase()) {
    case "BOLLYWOOD":
      return { Ws: 0.20, Wd: 0.25, We: 0.25, Wr: 0.30 };
    case "FOLK_TEMPO":
      return { Ws: 0.35, Wd: 0.10, We: 0.15, Wr: 0.40 };
    case "CLASSICAL":
      return { Ws: 0.40, Wd: 0.10, We: 0.35, Wr: 0.15 };
    case "STREET":
      return { Ws: 0.15, Wd: 0.45, We: 0.10, Wr: 0.30 };
    case "FLUID":
    default:
      return { Ws: 0.30, Wd: 0.10, We: 0.45, Wr: 0.15 };
  }
}

export interface ScorecardResult {
  overallScore: number;
  styleGroup: string;
  feedbackSummary: string;
}

export function compileScorecard(
  scores: {
    stabilityScore: number;
    sharpnessScore: number;
    alignmentScore: number;
    timingScore: number;
  },
  styleTag: string
): ScorecardResult {
  const weights = getKinematicWeights(styleTag);
  const { Ws, Wd, We, Wr } = weights;
  
  const overallRaw = 
    (scores.stabilityScore * Ws) + 
    (scores.sharpnessScore * Wd) + 
    (scores.alignmentScore * We) + 
    (scores.timingScore * Wr);

  const overallScore = parseFloat(Math.max(1.0, Math.min(10.0, overallRaw)).toFixed(2));
  
  let feedbackSummary = "";
  
  switch (styleTag.toUpperCase()) {
    case "BOLLYWOOD":
      feedbackSummary = `Style: Bollywood/Cinematic. Positive: Outstanding high-energy theatrical presentation, expressive choreographic flow, and excellent projection. Development: Focus on finishing limb extensions fully during rapid commercial tempo transitions to elevate execution.`;
      break;
    case "FOLK_TEMPO":
      feedbackSummary = `Style: Festive Folk/High-Stamina. Positive: Remarkable athletic footwork, bouncy folk rhythm synchronization, and high stamina preservation. Development: Maintain strict torso alignment and core stability during consecutive jumps and high-impact turns.`;
      break;
    case "CLASSICAL":
      feedbackSummary = `Style: Graceful Classical. Positive: Exceptional posture-focused balance, neat mudras/shapes, and clean architectural lines. Development: Expand arm extension envelopes and refine timing sync in rapid rhythmic cycles (thillanas/tala changes).`;
      break;
    case "STREET":
      feedbackSummary = `Style: Street/Hip-Hop. Positive: Deep muscular freezes (hits), sharp pop/lock isolations, and robotics control. Development: Expand range of motion in transitions and work on fluid spacing between isolation peaks.`;
      break;
    case "FLUID":
    default:
      feedbackSummary = `Style: Fluid/Contemporary. Positive: Smooth acceleration curves, wide extension envelopes, and beautiful emotional shapes. Development: Practice sudden muscular deceleration/freezes to add dramatic contrast to your modern lyrical flow.`;
      break;
  }

  return {
    overallScore,
    styleGroup: styleTag.toUpperCase(),
    feedbackSummary,
  };
}
