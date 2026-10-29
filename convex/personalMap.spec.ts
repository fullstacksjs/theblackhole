import { convexTest } from "convex-test";
import { vi } from "vite-plus/test";

import { CRAFT_ID } from "../shared/domain/personal-map";
import { DAY_MS } from "../shared/domain/retention";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const concept = (conceptId: string) => ({
  conceptId,
  name: conceptId,
  sector: "Distributed systems",
  tier: 1,
  slot: 0,
  material: {
    explanation: "Prepared explanation",
    example: "Prepared example",
    furtherReading: [],
    gradingRubric: "Central idea",
  },
});

async function setup() {
  const t = convexTest(schema, modules);
  const [alice, bob] = await t.run(async (ctx) => [
    await ctx.db.insert("users", { name: "Alice" }),
    await ctx.db.insert("users", { name: "Bob" }),
  ]);
  await t.mutation(internal.personalMap.addConcept, concept("a"));
  await t.mutation(internal.personalMap.addConcept, concept("b"));
  await t.mutation(internal.personalMap.addLink, { a: CRAFT_ID, b: "a" });
  await t.mutation(internal.personalMap.addLink, { a: "a", b: "b" });
  return { t, alice, bob };
}

afterEach(() => vi.useRealTimers());

describe("persisted personal maps", () => {
  it("keeps two learners independent through learning, depletion, recovery, and additions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { t, alice, bob } = await setup();
    await t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "a" });
    await t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "b" });
    await t.mutation(internal.personalMap.initialLearning, { learnerId: bob, conceptId: "a" });
    // Convex advances its commit clock even while fake timers are frozen.
    // Inspect just after the transactions rather than at their clock boundary.
    vi.setSystemTime(3 * DAY_MS);
    const inspect = (learnerId: typeof alice) =>
      t.query(internal.personalMap.inspect, { learnerId, evaluationAt: 3 * DAY_MS + 1000 });
    const bobBefore = await inspect(bob);
    const aliceBefore = await inspect(alice);
    expect(aliceBefore.explanation.statuses).toMatchObject({ a: "fading", b: "fading" });
    await t.mutation(internal.personalMap.completeDueReview, { learnerId: alice, conceptId: "a" });
    const recovered = await inspect(alice);
    expect(recovered.explanation.statuses).toMatchObject({ a: "charted", b: "fading" });
    expect(recovered.explanation.relationships.map(({ condition }) => condition)).toEqual([
      "broken",
      "active",
    ]);
    await expect(inspect(bob)).resolves.toEqual(bobBefore);
    expect(recovered.progress.find(({ conceptId }) => conceptId === "b")).toEqual(
      aliceBefore.progress.find(({ conceptId }) => conceptId === "b"),
    );
    await t.mutation(internal.personalMap.addConcept, concept("c"));
    await t.mutation(internal.personalMap.addLink, { a: "c", b: "a" });
    const aliceAfter = await inspect(alice);
    const bobAfter = await inspect(bob);
    expect(aliceAfter.explanation.statuses.c).toBe("in-reach");
    expect(bobAfter.explanation.statuses.c).toBe("uncharted");
    expect(aliceAfter.progress).toEqual(recovered.progress);
    expect(bobAfter.progress).toEqual(bobBefore.progress);
  });

  it("enforces indexed uniqueness on simultaneous and reversed additions", async () => {
    const { t, alice } = await setup();
    const relationships = await Promise.all([
      t.mutation(internal.personalMap.addLink, { a: "a", b: CRAFT_ID }),
      t.mutation(internal.personalMap.addLink, { a: CRAFT_ID, b: "a" }),
    ]);
    expect(new Set(relationships).size).toBe(1);
    const newRelationships = await Promise.all([
      t.mutation(internal.personalMap.addLink, { a: "b", b: CRAFT_ID }),
      t.mutation(internal.personalMap.addLink, { a: CRAFT_ID, b: "b" }),
    ]);
    expect(new Set(newRelationships).size).toBe(1);
    const progressIds = await Promise.all([
      t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "a" }),
      t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "a" }),
    ]);
    expect(new Set(progressIds).size).toBe(1);
    const stored = await t.run(async (ctx) => ({
      progress: await ctx.db.query("learnedPlanets").collect(),
      links: await ctx.db.query("links").collect(),
    }));
    expect(stored.progress).toHaveLength(1);
    expect(stored.progress[0].retentionXP).toBe(40);
    expect(stored.links).toHaveLength(3);
  });

  it("keeps separator identities distinct and rejects invalid references", async () => {
    const { t, alice } = await setup();
    for (const id of ["a|b", "c", "b|c"])
      await t.mutation(internal.personalMap.addConcept, concept(id));
    await t.mutation(internal.personalMap.addLink, { a: "a|b", b: "c" });
    await t.mutation(internal.personalMap.addLink, { a: "a", b: "b|c" });
    await expect(t.mutation(internal.personalMap.addLink, { a: "a", b: "a" })).rejects.toThrow(
      "distinct",
    );
    await expect(
      t.mutation(internal.personalMap.addLink, { a: "a", b: "unknown" }),
    ).rejects.toThrow("Unknown");
    await expect(t.mutation(internal.personalMap.addConcept, concept(CRAFT_ID))).rejects.toThrow(
      "distinct",
    );
    await expect(
      t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: CRAFT_ID }),
    ).rejects.toThrow("Unknown");
    await expect(
      t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "b" }),
    ).rejects.toThrow("In reach");
    await expect(
      t.mutation(internal.personalMap.checkpoint, { learnerId: alice, conceptId: "a" }),
    ).rejects.toThrow("learned");
    await expect(
      t.mutation(internal.personalMap.completeDueReview, { learnerId: alice, conceptId: "a" }),
    ).rejects.toThrow("learned");
    await expect(t.run((ctx) => ctx.db.query("links").collect())).resolves.toHaveLength(4);
    await expect(t.run((ctx) => ctx.db.query("learnedPlanets").collect())).resolves.toHaveLength(0);
  });

  it("keeps inspections read-only and checkpoint rebasing preserves learned zero and baseline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { t, alice } = await setup();
    await t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "a" });
    const storedBefore = await t.run((ctx) => ctx.db.query("learnedPlanets").collect());
    // Start elapsed time at the actual commit-clock checkpoint.
    const origin = storedBefore[0].checkpointAt;
    const inspect = (evaluationAt: number) =>
      t.query(internal.personalMap.inspect, { learnerId: alice, evaluationAt });
    const direct = await inspect(origin + 2 * DAY_MS);
    await expect(t.run((ctx) => ctx.db.query("learnedPlanets").collect())).resolves.toEqual(
      storedBefore,
    );
    vi.setSystemTime(origin + DAY_MS);
    await t.mutation(internal.personalMap.checkpoint, { learnerId: alice, conceptId: "a" });
    const rebased = await inspect(origin + 2 * DAY_MS);
    expect(rebased.explanation.statuses).toEqual(direct.explanation.statuses);
    expect(rebased.explanation.relationships).toEqual(direct.explanation.relationships);
    expect(rebased.progress[0]).toMatchObject({
      retentionXP: 20,
      reviewBaselineXP: 40,
      checkpointAt: origin + DAY_MS,
    });
    await expect(inspect(0)).rejects.toThrow("predates");
    vi.setSystemTime(origin + 2 * DAY_MS);
    await t.mutation(internal.personalMap.checkpoint, { learnerId: alice, conceptId: "a" });
    expect((await inspect(origin + 2 * DAY_MS)).progress[0]).toMatchObject({
      retentionXP: 0,
      reviewBaselineXP: 40,
    });
    await expect(t.run((ctx) => ctx.db.query("learnedPlanets").collect())).resolves.toHaveLength(1);
  });

  it("authenticates public reads and offers no public progress writes", async () => {
    const { t, alice, bob } = await setup();
    await t.mutation(internal.personalMap.initialLearning, { learnerId: alice, conceptId: "a" });
    await expect(t.query(api.personalMap.current)).resolves.toBeNull();
    const aliceMap = await t
      .withIdentity({ subject: `${alice}|session` })
      .query(api.personalMap.current);
    const bobMap = await t
      .withIdentity({ subject: `${bob}|session` })
      .query(api.personalMap.current);
    expect(aliceMap?.explanation.statuses.a).toBe("charted");
    expect(bobMap?.explanation.statuses.a).toBe("in-reach");
  });

  it("persists decay precision at exact depletion and resets it on recovery", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { t, alice } = await setup();
    await t.run((ctx) =>
      ctx.db.insert("learnedPlanets", {
        learnerId: alice,
        conceptId: "a",
        retentionXP: 300,
        checkpointAt: 0,
        reviewBaselineXP: 300,
      }),
    );
    const at = 55 * DAY_MS;
    const direct = await t.query(internal.personalMap.inspect, {
      learnerId: alice,
      evaluationAt: at,
    });
    vi.setSystemTime(at / 2);
    await t.mutation(internal.personalMap.checkpoint, { learnerId: alice, conceptId: "a" });
    const rebased = await t.query(internal.personalMap.inspect, {
      learnerId: alice,
      evaluationAt: at,
    });
    expect(rebased.progress[0].decayOrigin).toEqual({ retentionXP: 300, checkpointAt: 0 });
    expect(rebased.explanation.retention).toEqual(direct.explanation.retention);
    expect(rebased.explanation.statuses).toEqual(direct.explanation.statuses);
    expect(rebased.explanation.relationships).toEqual(direct.explanation.relationships);
    await expect(
      t.query(internal.personalMap.inspect, { learnerId: alice, evaluationAt: 0 }),
    ).rejects.toThrow("predates");
    vi.setSystemTime(at);
    await t.mutation(internal.personalMap.completeDueReview, { learnerId: alice, conceptId: "a" });
    const recovered = await t.query(internal.personalMap.inspect, {
      learnerId: alice,
      evaluationAt: at,
    });
    expect(recovered.progress[0]).toMatchObject({
      retentionXP: 40,
      reviewBaselineXP: 40,
      checkpointAt: at,
      decayOrigin: null,
    });
    expect(recovered.explanation.statuses.a).toBe("charted");
  });
});
