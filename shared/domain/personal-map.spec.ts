import { CRAFT_ID, explainPersonalMap, pairIdentity } from "./personal-map";
import {
  DAY_MS,
  confidenceLevel,
  decayRetention,
  rebaseCheckpoint,
  rewardSuccessfulReview,
} from "./retention";

const collection = {
  conceptIds: ["a", "b", "c", "d", "e"],
  links: [
    [CRAFT_ID, "a"],
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
    ["d", "e"],
  ] as const,
};
const learned = (conceptId: string, retentionXP: number) => ({
  conceptId,
  retentionXP,
  checkpointAt: 0,
  reviewBaselineXP: retentionXP,
});

describe(explainPersonalMap, () => {
  it("explains missing progress, learned zero, permanent Craft, and separated exploration", () => {
    const result = explainPersonalMap(
      collection,
      [learned("a", 0), learned("c", 40), learned("d", 0)],
      0,
    );
    expect(result.statuses).toEqual({
      [CRAFT_ID]: "anchor",
      a: "fading",
      b: "in-reach",
      c: "charted",
      d: "fading",
      e: "uncharted",
    });
    expect(result.planets.find(({ id }) => id === CRAFT_ID)).toMatchObject({
      learned: false,
      active: true,
      checkpoint: null,
      retention: null,
      reviewable: false,
    });
    expect(result.planets.find(({ id }) => id === "a")).toMatchObject({
      learned: true,
      reviewable: true,
    });
    expect(result.planets.find(({ id }) => id === "b")).toMatchObject({
      checkpoint: null,
      activeNeighbors: ["c"],
    });
    expect(result.relationships.map(({ condition }) => condition)).toEqual([
      "unavailable",
      "broken",
      "exploration-opportunity",
      "broken",
      "unavailable",
    ]);
  });

  it("depletes and recovers only connections to active endpoints", () => {
    const progress = [learned("a", 40), learned("b", 0)];
    const depleted = explainPersonalMap(collection, progress, 2 * DAY_MS);
    expect(depleted.statuses.a).toBe("fading");
    const recovered = explainPersonalMap(
      collection,
      [{ conceptId: "a", ...rewardSuccessfulReview(progress[0], 2 * DAY_MS) }, progress[1]],
      2 * DAY_MS,
    );
    expect(
      recovered.relationships.find(({ pairId }) => pairId === pairIdentity(CRAFT_ID, "a"))
        ?.condition,
    ).toBe("active");
    expect(
      recovered.relationships.find(({ pairId }) => pairId === pairIdentity("a", "b"))?.condition,
    ).toBe("broken");
  });

  it("is deterministic and read-only, including reversed endpoint facts and duplicate pairs", () => {
    const progress = [learned("a", 40)];
    const before = structuredClone({ collection, progress });
    const first = explainPersonalMap(collection, progress, DAY_MS);
    expect(explainPersonalMap(collection, progress, DAY_MS)).toEqual(first);
    const reversed = {
      ...collection,
      links: [...collection.links.map(([a, b]) => [b, a] as const), ["a", CRAFT_ID] as const],
    };
    expect(explainPersonalMap(reversed, progress, DAY_MS)).toEqual(first);
    expect({ collection, progress }).toEqual(before);
    expect(
      first.relationships.find(({ pairId }) => pairId === pairIdentity(CRAFT_ID, "a"))?.facts,
    ).toEqual([
      { id: "a", learned: true, active: true, anchor: false },
      { id: CRAFT_ID, learned: false, active: true, anchor: true },
    ]);
    expect(first.planets.find(({ id }) => id === "a")?.retention).toMatchObject({
      elapsedMs: DAY_MS,
      retentionXP: 20,
      baselineLossXP: 20,
      reviewThresholdReached: true,
    });
  });

  it("rejects impossible facts and previews before any checkpoint", () => {
    expect(() => explainPersonalMap(collection, [learned("a", 40)], -1)).toThrow("predates");
    expect(() => explainPersonalMap(collection, [learned("unknown", 40)], 0)).toThrow(
      "shared concept",
    );
    expect(() => explainPersonalMap(collection, [learned(CRAFT_ID, 40)], 0)).toThrow(
      "shared concept",
    );
    expect(() => explainPersonalMap(collection, [learned("a", 40), learned("a", 0)], 0)).toThrow(
      "Duplicate",
    );
    expect(() => explainPersonalMap({ ...collection, links: [["a", "a"]] }, [], 0)).toThrow(
      "distinct",
    );
    expect(() => explainPersonalMap({ ...collection, links: [["a", "unknown"]] }, [], 0)).toThrow(
      "Unknown",
    );
    expect(pairIdentity("a|b", "c")).not.toBe(pairIdentity("a", "b|c"));
  });
});

// Independent integration: sum the time occupied by each confidence band, then invert.
const rates = [20, 20 / 3, 20 / 7, 20 / 14, 20 / 30];
function timeToZero(xp: number) {
  return rates.reduce((days, rate, i) => days + Math.max(0, Math.min(100, xp - i * 100)) / rate, 0);
}
function referenceDecay(xp: number, days: number) {
  let remaining = Math.max(0, timeToZero(xp) - days);
  let result = 0;
  for (const rate of rates) {
    const duration = Math.min(remaining, 100 / rate);
    result += duration * rate;
    remaining -= duration;
  }
  return result;
}

describe(decayRetention, () => {
  it.each([40, 100, 110, 160, 200, 210, 300, 400, 490, 500])(
    "keeps exact planet and link conditions at depletion through repeated rebases of %s XP",
    (xp) => {
      const totalMs = timeToZero(xp) * DAY_MS;
      for (const fraction of [0.1, 0.25, 0.5, 0.75, 0.9]) {
        const original = learned("a", xp);
        const intermediate = { conceptId: "a", ...rebaseCheckpoint(original, totalMs * fraction) };
        const finalCheckpoint = { conceptId: "a", ...rebaseCheckpoint(intermediate, totalMs) };
        const direct = explainPersonalMap(collection, [original], totalMs);
        const rebased = explainPersonalMap(collection, [finalCheckpoint], totalMs);
        expect(rebased.retention).toEqual(direct.retention);
        expect(rebased.statuses).toEqual(direct.statuses);
        expect(rebased.relationships).toEqual(direct.relationships);
        expect(rewardSuccessfulReview(intermediate, totalMs).decayOrigin).toBeNull();
      }
    },
  );
  it.each([
    0, 1e-12, 40, 99.999999, 100, 100.000001, 199.999999, 200, 200.000001, 299.999999, 300,
    300.000001, 399.999999, 400, 400.000001, 500,
  ])("matches independent integration and checkpoint composition for %s XP", (xp) => {
    for (const days of [0, 0.1, 1, 2, 7, 20, 100, 300]) {
      const direct = decayRetention(xp, days * DAY_MS);
      expect(Math.abs(direct - referenceDecay(xp, days))).toBeLessThanOrEqual(1e-9);
      const progress = [learned("a", xp)];
      const intermediate = {
        conceptId: "a",
        ...rebaseCheckpoint(progress[0], (days * DAY_MS) / 2),
      };
      const originalMap = explainPersonalMap(collection, progress, days * DAY_MS);
      const rebasedMap = explainPersonalMap(collection, [intermediate], days * DAY_MS);
      expect(Math.abs(originalMap.retention.a - rebasedMap.retention.a)).toBeLessThanOrEqual(1e-9);
      expect(rebasedMap.statuses).toEqual(originalMap.statuses);
      expect(rebasedMap.relationships).toEqual(originalMap.relationships);
      expect(intermediate.reviewBaselineXP).toBe(xp);
    }
  });

  it("preserves exact boundaries and tiny positive retention without tolerance rounding", () => {
    expect([100, 200, 300, 400].map((xp) => confidenceLevel(xp))).toEqual([2, 3, 4, 5]);
    expect([100, 200, 300, 400].map((xp) => decayRetention(xp, DAY_MS))).toEqual([
      80,
      200 - 20 / 3,
      300 - 20 / 7,
      400 - 20 / 14,
    ]);
    expect(decayRetention(1e-12, 0)).toBe(1e-12);
    expect(decayRetention(Number.MIN_VALUE, 0)).toBe(Number.MIN_VALUE);
    expect(decayRetention(Number.MIN_VALUE, 1)).toBe(0);
    expect(decayRetention(1e-12, (1e-12 * DAY_MS) / 40)).toBeGreaterThan(0);
    expect(explainPersonalMap(collection, [learned("a", 1e-12)], 0).statuses.a).toBe("charted");
    expect(decayRetention(40, 2 * DAY_MS)).toBe(0);
    expect(confidenceLevel(0)).toBeNull();
    expect(rewardSuccessfulReview(learned("a", 490), 0).retentionXP).toBe(500);
  });
});
