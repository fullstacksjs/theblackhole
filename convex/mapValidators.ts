import { v } from "convex/values";

export const conceptFields = {
  conceptId: v.string(),
  name: v.string(),
  sector: v.string(),
  tier: v.number(),
  slot: v.number(),
  material: v.object({
    explanation: v.string(),
    example: v.string(),
    furtherReading: v.array(v.string()),
    gradingRubric: v.string(),
  }),
};
