import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { conceptFields } from "./mapValidators";

export default defineSchema({
  ...authTables,
  concepts: defineTable(conceptFields).index("by_concept", ["conceptId"]),
  links: defineTable({
    pairId: v.string(),
    a: v.string(),
    b: v.string(),
  }).index("by_pair", ["pairId"]),
  learnedPlanets: defineTable({
    learnerId: v.id("users"),
    conceptId: v.string(),
    retentionXP: v.number(),
    checkpointAt: v.number(),
    reviewBaselineXP: v.number(),
    decayOrigin: v.optional(
      v.union(
        v.null(),
        v.object({
          retentionXP: v.number(),
          checkpointAt: v.number(),
        }),
      ),
    ),
  }).index("by_learner_concept", ["learnerId", "conceptId"]),
});
