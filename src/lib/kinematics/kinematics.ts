// src/lib/kinematics/kinematics.ts

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  timestamp: number; // in seconds
  landmarks: Landmark[]; // 33 MediaPipe landmarks
}

export interface KinematicMetrics {
  sharpnessScore: number;  // 1-10
  alignmentScore: number;  // 1-10 (calculated from posture alignment)
  timingScore: number;     // 1-10 (from onset comparison)
  stabilityScore: number;   // 1-10 (core spine wobble variance)
  overallScore: number;    // 1-10 (weighted by style)
  styleGroup: "SHARP" | "FLUID" | "TRACK_INTENSE";
  feedbackSummary: string;
  kineticPeaks: number[];  // Timestamps of physical energy peaks
}

// MediaPipe Landmark Index Mapping
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;
const L_HIP = 23;
const R_HIP = 24;
const L_KNEE = 25;
const R_KNEE = 26;
const L_ANKLE = 27;
const R_ANKLE = 28;

// Helper to compute Euclidean distance between two 3D points
function distance3D(p1: Landmark, p2: Landmark): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
}

// Helper to compute angle (in degrees) between three points (vertex is p2)
function computeAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  if (mag1 * mag2 === 0) return 0;
  const cosTheta = dot / (mag1 * mag2);
  // Clamp to avoid NaN from float precision
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  return (angleRad * 180) / Math.PI;
}

export function calculateKinematics(frames: PoseFrame[], baseTimingScore = 7.5): KinematicMetrics {
  if (frames.length < 5) {
    return {
      sharpnessScore: 5.0,
      alignmentScore: 5.0,
      timingScore: baseTimingScore,
      stabilityScore: 5.0,
      overallScore: 5.0,
      styleGroup: "FLUID",
      feedbackSummary: "Insufficient pose tracking frames detected. Complete the performance for accurate scoring.",
      kineticPeaks: []
    };
  }

  const numFrames = frames.length;
  
  // 1. Calculate Velocities and Accelerations for Wrists and Ankles
  const wristAnkleJoints = [L_WRIST, R_WRIST, L_ANKLE, R_ANKLE];
  const velocities: { [joint: number]: number[] } = { [L_WRIST]: [], [R_WRIST]: [], [L_ANKLE]: [], [R_ANKLE]: [] };
  const accelerations: { [joint: number]: number[] } = { [L_WRIST]: [], [R_WRIST]: [], [L_ANKLE]: [], [R_ANKLE]: [] };
  const timestamps: number[] = [];

  for (let i = 1; i < numFrames; i++) {
    const f1 = frames[i - 1];
    const f2 = frames[i];
    const dt = f2.timestamp - f1.timestamp || 0.033; // default to 30fps if timestamp is identical
    
    timestamps.push(f2.timestamp);

    wristAnkleJoints.forEach(joint => {
      if (f1.landmarks[joint] && f2.landmarks[joint]) {
        const vel = distance3D(f1.landmarks[joint], f2.landmarks[joint]) / dt;
        velocities[joint].push(vel);
      } else {
        velocities[joint].push(0);
      }
    });
  }

  // Calculate Accelerations (rate of change of velocity)
  const accelTimestamps: number[] = [];
  for (let i = 1; i < velocities[L_WRIST].length; i++) {
    const dt = (timestamps[i] - timestamps[i - 1]) || 0.033;
    accelTimestamps.push(timestamps[i]);

    wristAnkleJoints.forEach(joint => {
      const acc = (velocities[joint][i] - velocities[joint][i - 1]) / dt;
      accelerations[joint].push(acc);
    });
  }

  // --- HEURISTIC 1: SHARPNESS (Deceleration Slope & Abrupt Stops) ---
  // Sharpness is defined by high deceleration slopes (large negative accelerations)
  // Let's count significant deceleration events and average the top 10% deceleration magnitudes
  let allDecelerations: number[] = [];
  let stopCounts = 0; // count density of abrupt stops

  wristAnkleJoints.forEach(joint => {
    accelerations[joint].forEach(acc => {
      if (acc < -5.0) { // Significant deceleration
        allDecelerations.push(Math.abs(acc));
      }
      if (acc < -15.0) { // Abrupt stop threshold
        stopCounts++;
      }
    });
  });

  allDecelerations.sort((a, b) => b - a);
  const topDecels = allDecelerations.slice(0, Math.max(1, Math.floor(allDecelerations.length * 0.1)));
  const avgTopDecel = topDecels.length > 0 ? topDecels.reduce((a, b) => a + b, 0) / topDecels.length : 0;
  
  // Scale sharpnessScore to 1.0 - 10.0 range
  // Let 40 m/s^2 deceleration represent a 10.0 score
  const sharpnessScore = Math.max(1.0, Math.min(10.0, 1.0 + (avgTopDecel / 5.0)));

  // --- HEURISTIC 2: CORE STABILITY (Angular Wobble of Spine Vector) ---
  // Spine vector is defined from shoulder midpoint to hip midpoint.
  // We compute the angle of this vector against the vertical axis [0, 1, 0].
  // Stability score is derived from the variance of this angle over time (wobble).
  const spineAngles: number[] = [];
  
  frames.forEach(f => {
    const lSh = f.landmarks[L_SHOULDER];
    const rSh = f.landmarks[R_SHOULDER];
    const lHp = f.landmarks[L_HIP];
    const rHp = f.landmarks[R_HIP];

    if (lSh && rSh && lHp && rHp) {
      const midShoulder = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2, z: (lSh.z + rSh.z) / 2 };
      const midHip = { x: (lHp.x + rHp.x) / 2, y: (lHp.y + rHp.y) / 2, z: (lHp.z + rHp.z) / 2 };

      // Spine vector
      const spine = { x: midShoulder.x - midHip.x, y: midShoulder.y - midHip.y, z: midShoulder.z - midHip.z };
      const spineMag = Math.sqrt(spine.x ** 2 + spine.y ** 2 + spine.z ** 2);
      
      if (spineMag > 0) {
        // Angle relative to vertical axis [0, -1, 0] (since y goes downwards in screen coords)
        const cosTheta = -spine.y / spineMag; // Negative because Y axis is inverted in browser coordinate systems
        const angleRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
        const angleDeg = (angleRad * 180) / Math.PI;
        spineAngles.push(angleDeg);
      }
    }
  });

  const avgSpineAngle = spineAngles.length > 0 ? spineAngles.reduce((a, b) => a + b, 0) / spineAngles.length : 0;
  const spineVariance = spineAngles.length > 0
    ? spineAngles.reduce((a, b) => a + (b - avgSpineAngle) ** 2, 0) / spineAngles.length
    : 0;

  // Stability: lower variance is more stable.
  // A variance of 0 wobble gets 10.0, variance of 25 gets 5.0, variance of 100+ gets 1.0.
  const stabilityScore = Math.max(1.0, Math.min(10.0, 10.0 - Math.min(9.0, spineVariance / 10.0)));

  // --- HEURISTIC 3: RANGE OF MOTION (Elbow & Knee Extension Envelopes) ---
  // We evaluate elbow and knee joint angles. Max extension or flex envelope.
  const jointAngles: number[] = [];
  
  frames.forEach(f => {
    // Left elbow: L_SHOULDER -> L_ELBOW -> L_WRIST
    if (f.landmarks[L_SHOULDER] && f.landmarks[L_ELBOW] && f.landmarks[L_WRIST]) {
      jointAngles.push(computeAngle(f.landmarks[L_SHOULDER], f.landmarks[L_ELBOW], f.landmarks[L_WRIST]));
    }
    // Right elbow: R_SHOULDER -> R_ELBOW -> R_WRIST
    if (f.landmarks[R_SHOULDER] && f.landmarks[R_ELBOW] && f.landmarks[R_WRIST]) {
      jointAngles.push(computeAngle(f.landmarks[R_SHOULDER], f.landmarks[R_ELBOW], f.landmarks[R_WRIST]));
    }
    // Left knee: L_HIP -> L_KNEE -> L_ANKLE
    if (f.landmarks[L_HIP] && f.landmarks[L_KNEE] && f.landmarks[L_ANKLE]) {
      jointAngles.push(computeAngle(f.landmarks[L_HIP], f.landmarks[L_KNEE], f.landmarks[L_ANKLE]));
    }
    // Right knee: R_HIP -> R_KNEE -> R_ANKLE
    if (f.landmarks[R_HIP] && f.landmarks[R_KNEE] && f.landmarks[R_ANKLE]) {
      jointAngles.push(computeAngle(f.landmarks[R_HIP], f.landmarks[R_KNEE], f.landmarks[R_ANKLE]));
    }
  });

  // Range of Motion is represented by the deviation from standard stance (e.g. extension/flex envelopes)
  // Let's take the 90th percentile of joint extension angles to represent the dancer's maximum reach/range
  jointAngles.sort((a, b) => b - a);
  const maxAngles = jointAngles.slice(0, Math.max(1, Math.floor(jointAngles.length * 0.1)));
  const avgMaxAngle = maxAngles.length > 0 ? maxAngles.reduce((a, b) => a + b, 0) / maxAngles.length : 120;
  
  // Scale range of motion score. 180 degrees (full extension) or deep flexing (close to 45 deg) represents high range.
  // Standard range: let's map angles from 120 to 180 degrees into a 5.0 to 10.0 score.
  const alignmentScore = Math.max(1.0, Math.min(10.0, 1.0 + (avgMaxAngle / 20.0)));

  // --- HEURISTIC 4: PHYSICAL ENERGY PEAKS (For audio synchronization) ---
  // Dancer kinetic energy is represented by average velocity of hands and feet.
  // Find timestamps of local maxima in this kinetic energy profile.
  const kineticEnergy: number[] = [];
  const kineticTimestamps: number[] = [];

  for (let i = 0; i < velocities[L_WRIST].length; i++) {
    const energy = (
      velocities[L_WRIST][i] + 
      velocities[R_WRIST][i] + 
      velocities[L_ANKLE][i] + 
      velocities[R_ANKLE][i]
    ) / 4;
    
    kineticEnergy.push(energy);
    kineticTimestamps.push(timestamps[i]);
  }

  // Find local peaks in kinetic energy
  const kineticPeaks: number[] = [];
  for (let i = 2; i < kineticEnergy.length - 2; i++) {
    const e = kineticEnergy[i];
    // Peak threshold: must be a local maximum and above average energy
    const avgEnergy = kineticEnergy.reduce((a, b) => a + b, 0) / kineticEnergy.length;
    if (e > kineticEnergy[i - 1] && e > kineticEnergy[i - 2] &&
        e > kineticEnergy[i + 1] && e > kineticEnergy[i + 2] &&
        e > avgEnergy * 1.2) {
      kineticPeaks.push(kineticTimestamps[i]);
    }
  }

  // --- PHASE 3: SELF-CALIBRATING CLASSIFICATION RULE ---
  // If stopping density (stopCounts) is high, classify as "SHARP/STREET STYLE".
  // If spine variance (wobble/tilt) is high but velocity curves are smooth (low stopCounts), classify as "FLUID/CONTEMPORARY".
  // We use stops per second and spine angle tilts.
  const duration = frames[numFrames - 1].timestamp - frames[0].timestamp || 10;
  const stopsPerSecond = stopCounts / duration;
  
  let styleGroup: "SHARP" | "FLUID" | "TRACK_INTENSE";
  let overallScore = 5.0;
  let feedbackSummary = "";

  if (stopsPerSecond > 0.4) {
    styleGroup = "SHARP";
    // Weighting: Sharpness (40%), Alignment/Range of Motion (20%), Timing (25%), Stability (15%)
    overallScore = (sharpnessScore * 0.40) + (alignmentScore * 0.20) + (baseTimingScore * 0.25) + (stabilityScore * 0.15);
    feedbackSummary = `Classified as Sharp (Street Style) due to crisp, abrupt deceleration profiles (${stopsPerSecond.toFixed(1)} stops/sec). Excellent control in pops and locks.`;
  } else if (spineVariance > 15.0) {
    styleGroup = "FLUID";
    // Weighting: Core Stability (40%), Alignment/Range of Motion (30%), Timing (20%), Sharpness (10%)
    overallScore = (stabilityScore * 0.40) + (alignmentScore * 0.30) + (baseTimingScore * 0.20) + (sharpnessScore * 0.10);
    feedbackSummary = `Classified as Fluid (Contemporary) due to high spinal tilt variance (${spineVariance.toFixed(1)}° variance) and smooth velocity profiles. Strong emotional expressiveness and body alignment.`;
  } else {
    styleGroup = "TRACK_INTENSE";
    // Weighting: Alignment (35%), Stability (25%), Sharpness (20%), Timing (20%)
    overallScore = (alignmentScore * 0.35) + (stabilityScore * 0.25) + (sharpnessScore * 0.20) + (baseTimingScore * 0.20);
    feedbackSummary = `Classified as Track Intense due to consistent athletic core control. Great balance, even speed distribution, and centered poise.`;
  }

  return {
    sharpnessScore: parseFloat(sharpnessScore.toFixed(2)),
    alignmentScore: parseFloat(alignmentScore.toFixed(2)),
    timingScore: parseFloat(baseTimingScore.toFixed(2)),
    stabilityScore: parseFloat(stabilityScore.toFixed(2)),
    overallScore: parseFloat(overallScore.toFixed(2)),
    styleGroup,
    feedbackSummary,
    kineticPeaks: kineticPeaks.map(p => parseFloat(p.toFixed(2)))
  };
}
