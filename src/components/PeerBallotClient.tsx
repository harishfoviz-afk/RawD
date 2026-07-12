// src/components/PeerBallotClient.tsx
"use client";

import React, { useState } from "react";
import { submitPeerBallot } from "@/app/actions";
import { 
  Key, Award, Activity, Sparkles, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, ArrowLeft,
  ChevronRight, Smile, Zap, RefreshCw, Loader2
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  city: string;
  videoUrl: string;
}

interface PeerBallotClientProps {
  competitors: Competitor[];
  validTokens: string[];
}

export default function PeerBallotClient({ competitors, validTokens }: PeerBallotClientProps) {
  // Checkpoint State
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeToken, setActiveToken] = useState("");
  const [checkpointError, setCheckpointError] = useState("");

  // Form State
  const [targetContestantId, setTargetContestantId] = useState("");
  const [step, setStep] = useState(1); // 1: Select, 2: Musicality, 3: Execution, 4: Energy, 5: Presence & Submit

  // Evaluation Options
  const [musicality, setMusicality] = useState<"Flawless" | "Steady" | "Out of Sync" | "">("");
  const [execution, setExecution] = useState<"Pristine Lines" | "Minor Slips" | "Restricted" | "">("");
  const [energy, setEnergy] = useState<"Explosive" | "Moderate" | "Lacking Stamina" | "">("");
  const [presence, setPresence] = useState(5); // slider 1-10

  // Submission State
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  // Point mapping for MCQ
  const getMusicalityPoints = () => {
    if (musicality === "Flawless") return 10;
    if (musicality === "Steady") return 7;
    if (musicality === "Out of Sync") return 3;
    return 0;
  };

  const getExecutionPoints = () => {
    if (execution === "Pristine Lines") return 10;
    if (execution === "Minor Slips") return 7;
    if (execution === "Restricted") return 3;
    return 0;
  };

  const getEnergyPoints = () => {
    if (energy === "Explosive") return 10;
    if (energy === "Moderate") return 7;
    if (energy === "Lacking Stamina") return 3;
    return 0;
  };

  // Compile Peer Technical Rating (average of 4 dimensions)
  const compileScore = () => {
    const m = getMusicalityPoints();
    const ex = getExecutionPoints();
    const en = getEnergyPoints();
    const p = presence;
    
    // If not all MCQs selected, compute based on selected ones, or return 0
    let count = 1; // presence is always set
    let total = p;

    if (musicality) { total += m; count++; }
    if (execution) { total += ex; count++; }
    if (energy) { total += en; count++; }

    return parseFloat((total / count).toFixed(1));
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim().toUpperCase();
    
    if (validTokens.includes(cleanToken)) {
      setIsAuthenticated(true);
      setActiveToken(cleanToken);
      setCheckpointError("");
    } else {
      setCheckpointError("Access Denied: Invalid, expired, or revoked token");
    }
  };

  const handleBallotSubmit = async () => {
    if (!targetContestantId) {
      setMsg("Please select a target contestant.");
      setStatus("error");
      return;
    }
    if (!musicality || !execution || !energy) {
      setMsg("Please answer all MCQ categories.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setMsg("Submitting ballot to database...");

    try {
      const res = await submitPeerBallot({
        targetContestantId,
        evaluatorPeerId: activeToken,
        musicalityScore: musicality,
        executionScore: execution,
        energyScore: energy,
        presenceScore: presence,
        compiledPeerScore: compileScore(),
      });

      if (res.success) {
        setStatus("success");
        setMsg("Judgement Ballot submitted successfully. Rankings updated!");
      } else {
        setStatus("error");
        setMsg(res.error || "Failed to submit ballot.");
      }
    } catch (err) {
      setStatus("error");
      setMsg("Connection error submitting ballot.");
    }
  };

  // Token checkpoint view
  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-purple">
            <Key className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white">Peer Token Checkpoint</h2>
          <p className="text-xs text-gray-400">
            This evaluation portal is locked. Please enter an active token issued by the administrator.
          </p>
        </div>

        <form onSubmit={handleTokenSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Peer Security Code
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. JUDGE-SHARP"
              className="w-full rounded-lg bg-brand-dark border border-purple-500/20 py-2.5 px-4 text-sm text-white placeholder-gray-500 uppercase focus:border-brand-purple focus:outline-none transition-colors text-center font-mono tracking-widest"
            />
          </div>

          {checkpointError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{checkpointError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan py-2.5 text-xs font-bold text-white shadow hover:scale-[1.01] transition-transform cursor-pointer"
          >
            Authenticate Portal
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  // Completed view
  if (status === "success") {
    return (
      <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto text-center space-y-6 border-brand-emerald/30">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Ballot Submitted!</h2>
          <p className="text-xs text-gray-400 leading-relaxed px-4">{msg}</p>
        </div>
        <button
          onClick={() => {
            setStatus("idle");
            setStep(1);
            setTargetContestantId("");
            setMusicality("");
            setExecution("");
            setEnergy("");
            setPresence(5);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-card border border-purple-500/20 px-6 py-2.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Evaluate Another Dancer
        </button>
      </div>
    );
  }

  const selectedCompetitor = competitors.find(c => c.id === targetContestantId);
  const sampleVideo = "https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-alone-on-a-sports-court-41584-large.mp4";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Questionnaire Form (col-span-2) */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-8 space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
          <div>
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">
              Step {step} of 5
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {step === 1 && "Select Target Dancer"}
              {step === 2 && "Musicality Assessment"}
              {step === 3 && "Execution Assessment"}
              {step === 4 && "Energy Assessment"}
              {step === 5 && "Stage Presence & Submit"}
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">Token: {activeToken}</span>
        </div>

        {/* Step 1: Competitor Select */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Choose the competitor you are currently evaluating from the database registry:
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Dancer Registry
              </label>
              <select
                value={targetContestantId}
                onChange={(e) => setTargetContestantId(e.target.value)}
                className="w-full rounded-lg bg-brand-dark border border-purple-500/20 py-3 px-4 text-sm text-white focus:border-brand-purple focus:outline-none transition-colors"
              >
                <option value="">-- Choose Dancer --</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!targetContestantId}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-xs font-bold text-white hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:pointer-events-none"
              >
                Start Evaluation
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Musicality MCQ */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Assess the dancer's synchronization, rhythm coordination, and alignment to the audio beat transients:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Flawless", desc: "Perfect synchronization with the audio peaks and onsets.", val: "Flawless" },
                { label: "Steady", desc: "Solid tracking with minor timing offsets.", val: "Steady" },
                { label: "Out of Sync", desc: "Visually noticeable lag or misalignment to transients.", val: "Out of Sync" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setMusicality(item.val as any)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    musicality === item.val
                      ? "border-brand-purple bg-purple-500/5 shadow-md shadow-brand-purple/5"
                      : "border-purple-500/10 hover:border-purple-500/30"
                  }`}
                >
                  <span className="block text-sm font-bold text-white">{item.label}</span>
                  <span className="block text-xs text-gray-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Dancer Select
              </button>
              <button
                type="button"
                disabled={!musicality}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Execution Assessment
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Execution MCQ */}
        {step === 3 && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Evaluate body extensions, limb geometry correctness, and articulation line quality:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Pristine Lines", desc: "Full range of motion and perfect posture alignment.", val: "Pristine Lines" },
                { label: "Minor Slips", desc: "Decent extension but slight wobble in core stability.", val: "Minor Slips" },
                { label: "Restricted", desc: "Tense movements, narrow envelopes, or poor posture control.", val: "Restricted" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setExecution(item.val as any)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    execution === item.val
                      ? "border-brand-purple bg-purple-500/5 shadow-md"
                      : "border-purple-500/10 hover:border-purple-500/30"
                  }`}
                >
                  <span className="block text-sm font-bold text-white">{item.label}</span>
                  <span className="block text-xs text-gray-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Musicality
              </button>
              <button
                type="button"
                disabled={!execution}
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Energy Assessment
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Energy MCQ */}
        {step === 4 && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Observe speed dynamics, deceleration power, and physical stamina projection:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Explosive", desc: "Intense power, crisp accents, and continuous stamina.", val: "Explosive" },
                { label: "Moderate", desc: "Steady tempo with standard deceleration profiles.", val: "Moderate" },
                { label: "Lacking Stamina", desc: "Slow transitions, lethargic stops, or noticeable fatigue.", val: "Lacking Stamina" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setEnergy(item.val as any)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    energy === item.val
                      ? "border-brand-purple bg-purple-500/5 shadow-md"
                      : "border-purple-500/10 hover:border-purple-500/30"
                  }`}
                >
                  <span className="block text-sm font-bold text-white">{item.label}</span>
                  <span className="block text-xs text-gray-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Execution
              </button>
              <button
                type="button"
                disabled={!energy}
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Stage Presence
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Stage Presence & Submit */}
        {step === 5 && (
          <div className="space-y-6 py-4">
            <p className="text-sm text-gray-400 leading-relaxed font-light">
              Grade the overall showmanship, performance projection, and artistic expression (1 to 10):
            </p>
            <div className="space-y-4 rounded-xl bg-brand-dark/50 p-6 border border-purple-500/5">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-300">Showmanship & Presence</span>
                <span className="text-brand-cyan">{presence} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={presence}
                onChange={(e) => setPresence(parseInt(e.target.value))}
                className="w-full h-2 bg-brand-card rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>1 - Minimal</span>
                <span>5 - Standard</span>
                <span>10 - Outstanding</span>
              </div>
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-xs text-red-200">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Energy
              </button>
              <button
                type="button"
                disabled={status === "submitting"}
                onClick={handleBallotSubmit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-emerald to-teal-500 px-6 py-2.5 text-xs font-bold text-white shadow hover:scale-[1.02] transition-transform"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Judge Ballot
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Indicator Panel */}
      <div className="glass-panel rounded-2xl p-8 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Aired Episode Preview */}
          {selectedCompetitor && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest block">
                Aired Episode Clip
              </span>
              <div className="relative rounded-xl overflow-hidden border border-purple-500/10 bg-black aspect-video">
                <video
                  src={selectedCompetitor.videoUrl.startsWith("/uploads/") ? sampleVideo : selectedCompetitor.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest block">
            Real-time Technical Rating
          </span>

          <div className="text-center py-6 rounded-2xl bg-brand-dark/50 border border-purple-500/5 space-y-2 relative overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-emerald"></span>
            
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Peer Score Indicator
            </span>
            <span className="text-6xl font-black bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
              {compileScore()}
            </span>
            <span className="text-xs text-gray-400 block mt-1">/ 10</span>
          </div>

          {/* Breakdown parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Scoring Breakdown
            </h4>

            <div className="space-y-3">
              {[
                { label: "Musicality Sync", val: musicality ? `${getMusicalityPoints()}/10` : "Unset", icon: <Sparkles className="h-4 w-4 text-brand-purple" /> },
                { label: "Execution Lines", val: execution ? `${getExecutionPoints()}/10` : "Unset", icon: <Activity className="h-4 w-4 text-brand-cyan" /> },
                { label: "Energy Stamina", val: energy ? `${getEnergyPoints()}/10` : "Unset", icon: <Zap className="h-4 w-4 text-brand-amber" /> },
                { label: "Stage Showmanship", val: `${presence}/10`, icon: <Smile className="h-4 w-4 text-brand-emerald" /> },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-purple-500/5">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-gray-300 font-light">{item.label}</span>
                  </div>
                  <span className="font-bold text-white">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-purple-500/10 pt-4 flex items-center gap-1.5 text-[9px] text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-emerald" />
          <span>Restricted Judge Environment • Verified Session</span>
        </div>
      </div>
    </div>
  );
}
