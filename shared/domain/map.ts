export type PlanetStatus = "anchor" | "charted" | "fading" | "in-reach" | "uncharted";

export type Link = readonly [string, string];

export interface MapProgress {
  /** The Craft: always active, never learned. */
  anchorId: string;
  planetIds: readonly string[];
  links: readonly Link[];
  /** Retention XP of every learned planet. Unlearned planets are absent. */
  retention: Readonly<Record<string, number>>;
}

export function isActive(status: PlanetStatus | undefined) {
  return status === "anchor" || status === "charted";
}

export function derivePlanetStatuses({
  anchorId,
  planetIds,
  links,
  retention,
}: MapProgress): Record<string, PlanetStatus> {
  const active = (id: string) => id === anchorId || (retention[id] ?? 0) > 0;
  const statuses: Record<string, PlanetStatus> = {};
  for (const id of planetIds) {
    if (id === anchorId) statuses[id] = "anchor";
    else if (id in retention) statuses[id] = active(id) ? "charted" : "fading";
    else statuses[id] = neighborsOf(id, links).some(active) ? "in-reach" : "uncharted";
  }
  return statuses;
}

export function neighborsOf(id: string, links: readonly Link[]) {
  return links.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}
