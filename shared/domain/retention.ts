export const DAY_MS = 24 * 60 * 60 * 1000;
export const RETENTION_CAP = 500;
export const FULL_REWARD = 40;
export const REVIEW_LOSS = 20;

export interface RetentionCheckpoint {
  retentionXP: number;
  checkpointAt: number;
  reviewBaselineXP: number;
  /** Preserves decay precision across checkpoint-only rebases; a reward resets it. */
  decayOrigin?: { retentionXP: number; checkpointAt: number } | null;
}

export function validateXP(xp: number) {
  if (!Number.isFinite(xp) || xp < 0 || xp > RETENTION_CAP) {
    throw new Error("Retention XP must be between zero and 500");
  }
}

export function confidenceLevel(xp: number) {
  validateXP(xp);
  return xp === 0 ? null : Math.min(5, Math.floor(xp / 100) + 1);
}

/** Exact boundaries use the lower band's rate as decay crosses below them. */
export function decayRetention(xp: number, elapsedMs: number) {
  validateXP(xp);
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new Error("Evaluation time predates checkpoint or is not finite");
  }
  let days = elapsedMs / DAY_MS;
  let balance = xp;
  while (days > 0 && balance > 0) {
    const band = balance > 400 ? 4 : balance > 300 ? 3 : balance > 200 ? 2 : balance > 100 ? 1 : 0;
    const lower = band * 100;
    const rate = REVIEW_LOSS / [1, 3, 7, 14, 30][band];
    const span = (balance - lower) / rate;
    if (days < span) return Math.max(0, balance - days * rate);
    balance = lower;
    days -= span;
  }
  return balance;
}

export function evaluateRetention(checkpoint: RetentionCheckpoint, evaluationAt: number) {
  validateXP(checkpoint.reviewBaselineXP);
  if (!Number.isFinite(checkpoint.checkpointAt) || !Number.isFinite(evaluationAt)) {
    throw new Error("Checkpoint and evaluation times must be finite");
  }
  const elapsedMs = evaluationAt - checkpoint.checkpointAt;
  // Validate the current checkpoint even when calculation uses an earlier decay origin.
  validateXP(checkpoint.retentionXP);
  if (elapsedMs < 0) throw new Error("Evaluation time predates checkpoint");
  const origin = checkpoint.decayOrigin ?? checkpoint;
  if (!Number.isFinite(origin.checkpointAt) || origin.checkpointAt > checkpoint.checkpointAt) {
    throw new Error("Decay origin must be at or before checkpoint");
  }
  const decayElapsedMs = evaluationAt - origin.checkpointAt;
  const retentionXP = decayRetention(origin.retentionXP, decayElapsedMs);
  return {
    elapsedMs,
    decayElapsedMs,
    retentionXP,
    confidenceLevel: confidenceLevel(retentionXP),
    reviewBaselineXP: checkpoint.reviewBaselineXP,
    decayOrigin: checkpoint.decayOrigin ?? {
      retentionXP: checkpoint.retentionXP,
      checkpointAt: checkpoint.checkpointAt,
    },
    baselineLossXP: checkpoint.reviewBaselineXP - retentionXP,
    reviewThresholdReached: checkpoint.reviewBaselineXP - retentionXP >= REVIEW_LOSS,
  };
}

export function rebaseCheckpoint(checkpoint: RetentionCheckpoint, checkpointAt: number) {
  return {
    retentionXP: evaluateRetention(checkpoint, checkpointAt).retentionXP,
    checkpointAt,
    reviewBaselineXP: checkpoint.reviewBaselineXP,
    decayOrigin: checkpoint.decayOrigin ?? {
      retentionXP: checkpoint.retentionXP,
      checkpointAt: checkpoint.checkpointAt,
    },
  };
}

/** Caller verifies the successful outcome and, for reviews, completion of its cycle. */
export function rewardSuccessfulReview(checkpoint: RetentionCheckpoint | null, at: number) {
  if (!Number.isFinite(at)) throw new Error("Checkpoint time must be finite");
  const retentionXP = Math.min(
    RETENTION_CAP,
    (checkpoint ? evaluateRetention(checkpoint, at).retentionXP : 0) + FULL_REWARD,
  );
  return { retentionXP, checkpointAt: at, reviewBaselineXP: retentionXP, decayOrigin: null };
}
