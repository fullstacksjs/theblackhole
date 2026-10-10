import { derivePlanetStatuses, isActive, neighborsOf, type Link, type PlanetStatus } from "./map";
import { evaluateRetention, type RetentionCheckpoint } from "./retention";

export const CRAFT_ID = "the-craft";

export interface LearnedPlanet extends RetentionCheckpoint {
  conceptId: string;
}

export interface PreparedMap {
  conceptIds: readonly string[];
  links: readonly Link[];
}

export function canonicalPair(a: string, b: string): Link {
  if (a === b) throw new Error("A link needs distinct endpoints");
  return a < b ? [a, b] : [b, a];
}

export function pairIdentity(a: string, b: string) {
  return JSON.stringify(canonicalPair(a, b));
}

const rules = {
  anchor: "The Craft is permanently active and has no learned record or retention.",
  charted: "A learned record with positive retention makes this planet Charted.",
  fading: "A learned record at zero retention makes this planet Fading and reviewable.",
  "in-reach": "No learned record exists; an active neighbor makes this concept In reach.",
  uncharted: "No learned record or active neighbor exists; this concept is Uncharted.",
} satisfies Record<PlanetStatus, string>;

const linkRules = {
  active: "Both endpoints are active.",
  broken: "Both endpoints are learned or The Craft, and at least one has depleted.",
  "exploration-opportunity": "An active endpoint makes its unlearned neighbor available.",
  unavailable: "An unlearned endpoint has no active neighbor through this relationship.",
};

export function explainPersonalMap(
  collection: PreparedMap,
  progress: readonly LearnedPlanet[],
  evaluationAt: number,
) {
  if (!Number.isFinite(evaluationAt)) throw new Error("Evaluation time must be finite");
  const ids = [CRAFT_ID, ...collection.conceptIds].sort();
  const allowed = new Set(ids);
  if (allowed.size !== ids.length) throw new Error("Duplicate concept or The Craft as concept");
  const pairs = new Map<string, Link>();
  for (const [a, b] of collection.links) {
    if (!allowed.has(a) || !allowed.has(b)) throw new Error("Unknown link endpoint");
    pairs.set(pairIdentity(a, b), canonicalPair(a, b));
  }
  const links = [...pairs.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const records = new Map<string, LearnedPlanet>();
  const evaluations = new Map<string, ReturnType<typeof evaluateRetention>>();
  for (const record of progress) {
    if (record.conceptId === CRAFT_ID || !allowed.has(record.conceptId)) {
      throw new Error("Progress requires a shared concept");
    }
    if (records.has(record.conceptId)) throw new Error("Duplicate learned planet");
    records.set(record.conceptId, record);
    evaluations.set(record.conceptId, evaluateRetention(record, evaluationAt));
  }
  const retention = Object.fromEntries(
    [...evaluations].map(([id, evaluated]) => [id, evaluated.retentionXP]),
  );
  const statuses = derivePlanetStatuses({
    anchorId: CRAFT_ID,
    planetIds: ids,
    links: links.map(([, pair]) => pair),
    retention,
  });
  const planets = ids.map((id) => ({
    id,
    status: statuses[id],
    learned: records.has(id),
    active: isActive(statuses[id]),
    reviewable: records.has(id),
    checkpoint: records.has(id) ? { ...records.get(id)! } : null,
    retention: evaluations.get(id) ?? null,
    activeNeighbors: neighborsOf(
      id,
      links.map(([, pair]) => pair),
    ).filter((neighbor) => isActive(statuses[neighbor])),
    rule: rules[statuses[id]],
  }));
  const relationships = links.map(([pairId, endpoints]) => {
    const facts = endpoints.map((id) => ({
      id,
      anchor: id === CRAFT_ID,
      learned: records.has(id),
      active: isActive(statuses[id]),
    }));
    const condition = facts.every((fact) => fact.active)
      ? "active"
      : facts.every((fact) => fact.anchor || fact.learned)
        ? "broken"
        : facts.some((fact) => fact.active)
          ? "exploration-opportunity"
          : "unavailable";
    return { pairId, endpoints, facts, condition, rule: linkRules[condition] };
  });
  return { evaluationAt, planets, relationships, retention, statuses };
}
