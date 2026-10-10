import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";

import {
  CRAFT_ID,
  canonicalPair,
  explainPersonalMap,
  pairIdentity,
} from "../shared/domain/personal-map";
import { rebaseCheckpoint, rewardSuccessfulReview } from "../shared/domain/retention";
import { internalMutation, internalQuery, query, type QueryCtx } from "./_generated/server";
import { conceptFields } from "./mapValidators";

async function requireConcept(ctx: QueryCtx, conceptId: string) {
  const concept = await ctx.db
    .query("concepts")
    .withIndex("by_concept", (q) => q.eq("conceptId", conceptId))
    .unique();
  if (!concept) throw new Error("Unknown concept");
  return concept;
}

function learnedPlanet(ctx: QueryCtx, learnerId: Id<"users">, conceptId: string) {
  return ctx.db
    .query("learnedPlanets")
    .withIndex("by_learner_concept", (q) => q.eq("learnerId", learnerId).eq("conceptId", conceptId))
    .unique();
}

async function readMap(ctx: QueryCtx, learnerId: Id<"users">, evaluationAt: number) {
  if (!(await ctx.db.get("users", learnerId))) throw new Error("Unknown learner");
  const [concepts, links, storedProgress] = await Promise.all([
    ctx.db.query("concepts").collect(),
    ctx.db.query("links").collect(),
    ctx.db
      .query("learnedPlanets")
      .withIndex("by_learner_concept", (q) => q.eq("learnerId", learnerId))
      .collect(),
  ]);
  const progress = storedProgress.map(
    ({ conceptId, retentionXP, checkpointAt, reviewBaselineXP, decayOrigin }) => ({
      conceptId,
      retentionXP,
      checkpointAt,
      reviewBaselineXP,
      decayOrigin: decayOrigin ?? null,
    }),
  );
  return {
    concepts: concepts.sort((a, b) =>
      a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0,
    ),
    progress,
    explanation: explainPersonalMap(
      {
        conceptIds: concepts.map((concept) => concept.conceptId),
        links: links.map(({ a, b }) => [a, b] as const),
      },
      progress,
      evaluationAt,
    ),
  };
}

/** Read-only chosen-time developer inspection, available through the Convex dashboard/CLI. */
export const inspect = internalQuery({
  args: { learnerId: v.id("users"), evaluationAt: v.number() },
  handler: (ctx, { learnerId, evaluationAt }) => readMap(ctx, learnerId, evaluationAt),
});

/** Learners can only read their own map. Time is supplied by the server. */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const learnerId = await getAuthUserId(ctx);
    if (!learnerId) return null;
    return readMap(ctx, learnerId, Date.now());
  },
});

export const addConcept = internalMutation({
  args: conceptFields,
  handler: async (ctx, concept) => {
    if (!concept.conceptId.trim() || concept.conceptId === CRAFT_ID) {
      throw new Error("A concept needs an identity distinct from The Craft");
    }
    if (
      !concept.name.trim() ||
      !concept.sector.trim() ||
      !Number.isInteger(concept.tier) ||
      concept.tier < 1 ||
      concept.tier > 4 ||
      !Number.isInteger(concept.slot) ||
      concept.slot < 0
    ) {
      throw new Error("Invalid concept name, sector, or map position");
    }
    const existing = await ctx.db
      .query("concepts")
      .withIndex("by_concept", (q) => q.eq("conceptId", concept.conceptId))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("concepts", concept);
  },
});

export const addLink = internalMutation({
  args: { a: v.string(), b: v.string() },
  handler: async (ctx, { a, b }) => {
    const endpoints = canonicalPair(a, b);
    for (const id of endpoints) {
      if (id !== CRAFT_ID) await requireConcept(ctx, id);
    }
    const pairId = pairIdentity(a, b);
    const existing = await ctx.db
      .query("links")
      .withIndex("by_pair", (q) => q.eq("pairId", pairId))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("links", { pairId, a: endpoints[0], b: endpoints[1] });
  },
});

/** Called only by a trusted workflow after verifying the first correct answer. */
export const initialLearning = internalMutation({
  args: { learnerId: v.id("users"), conceptId: v.string() },
  handler: async (ctx, { learnerId, conceptId }) => {
    await requireConcept(ctx, conceptId);
    const existing = await learnedPlanet(ctx, learnerId, conceptId);
    if (existing) return existing._id;
    const at = Date.now();
    const { explanation } = await readMap(ctx, learnerId, at);
    if (explanation.statuses[conceptId] !== "in-reach") throw new Error("Concept is not In reach");
    return ctx.db.insert("learnedPlanets", {
      learnerId,
      conceptId,
      ...rewardSuccessfulReview(null, at),
    });
  },
});

/** Caller owns grading, the open due-review cycle, and duplicate-outcome protection. */
export const completeDueReview = internalMutation({
  args: { learnerId: v.id("users"), conceptId: v.string() },
  handler: async (ctx, { learnerId, conceptId }) => {
    await requireConcept(ctx, conceptId);
    if (!(await ctx.db.get("users", learnerId))) throw new Error("Unknown learner");
    const existing = await learnedPlanet(ctx, learnerId, conceptId);
    if (!existing) throw new Error("Review requires a learned planet");
    await ctx.db.patch(
      "learnedPlanets",
      existing._id,
      rewardSuccessfulReview(existing, Date.now()),
    );
    return existing._id;
  },
});

export const checkpoint = internalMutation({
  args: { learnerId: v.id("users"), conceptId: v.string() },
  handler: async (ctx, { learnerId, conceptId }) => {
    await requireConcept(ctx, conceptId);
    if (!(await ctx.db.get("users", learnerId))) throw new Error("Unknown learner");
    const existing = await learnedPlanet(ctx, learnerId, conceptId);
    if (!existing) throw new Error("Checkpoint requires a learned planet");
    await ctx.db.patch("learnedPlanets", existing._id, rebaseCheckpoint(existing, Date.now()));
    return existing._id;
  },
});
