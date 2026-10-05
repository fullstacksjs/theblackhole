import { useHotkey } from "@tanstack/react-hotkeys";
import { useMemo, useState } from "react";

import {
  derivePlanetStatuses,
  isActive,
  neighborsOf,
  type Link,
  type PlanetStatus,
} from "#domain/map.ts";
import { Button, Progress, Stat, Text } from "#ui";

import { PlanetPanel } from "../PlanetPanel/PlanetPanel";
import { PlanetStatusIndicator } from "../PlanetStatusIndicator/PlanetStatusIndicator";
import { SpaceMap, type SpaceMapPlanet } from "../SpaceMap/SpaceMap";

export interface MapScreenPlanet extends SpaceMapPlanet {
  description: string;
}

export interface MapScreenProps {
  sectors: readonly string[];
  anchorId: string;
  planets: readonly MapScreenPlanet[];
  links: readonly Link[];
  /** Retention XP of every learned planet. */
  retention: Readonly<Record<string, number>>;
}

const connectionPrefixes: Partial<Record<PlanetStatus, string>> = {
  charted: "Linked to",
  "in-reach": "In reach via",
};

const countedStatuses = ["charted", "in-reach", "uncharted"] as const satisfies PlanetStatus[];

export function MapScreen({ sectors, anchorId, planets, links, retention }: MapScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const statuses = useMemo(
    () => derivePlanetStatuses({ anchorId, planetIds: planets.map((p) => p.id), links, retention }),
    [anchorId, planets, links, retention],
  );
  const concepts = planets.filter((p) => p.id !== anchorId);
  const selected = planets.find((p) => p.id === selectedId);

  const pick = (id: string | null) => {
    setSelectedId(id && statuses[id] !== "uncharted" ? id : null);
  };
  useHotkey("Escape", () => setSelectedId(null), { enabled: selectedId != null });

  return (
    <main className="dark-palette relative h-dvh overflow-hidden bg-background text-foreground">
      <SpaceMap
        className="absolute inset-0"
        planets={planets}
        links={links}
        sectors={sectors}
        statuses={statuses}
        selectedId={selectedId}
        onPick={pick}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-6 p-6 md:px-8 md:pt-7">
        <div className="flex w-56 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Text as="h1" variant="heading">
              TheBlackHole
            </Text>
            <Text variant="label" tone="subtle">
              Isometric chart
            </Text>
          </div>
          <div className="flex flex-col gap-2.5">
            {sectors.map((name, index) => {
              const members = concepts.filter((p) => p.sector === index);
              if (members.length === 0) return null;
              const learned = members.filter((p) => p.id in retention).length;
              return <Progress key={name} label={name} value={learned} max={members.length} />;
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-8">
          {countedStatuses.map((status) => (
            <Stat
              key={status}
              label={<PlanetStatusIndicator status={status} />}
              value={concepts.filter((p) => statuses[p.id] === status).length}
            />
          ))}
        </div>
      </div>

      {selected ? (
        <div className="absolute inset-x-4 bottom-4 flex justify-center md:inset-x-6 md:bottom-7">
          <PlanetPanel
            title={selected.name}
            eyebrow={selected.id === anchorId ? "Origin" : sectors[selected.sector]}
            status={<PlanetStatusIndicator status={statuses[selected.id]} />}
            description={connection(selected.id, { anchorId, links, planets }, statuses)}
            actions={<Button onClick={() => setSelectedId(null)}>Close</Button>}
          >
            {statuses[selected.id] === "in-reach" ? (
              <Text as="p" variant="caption" tone="subtle">
                Explain it from memory to chart it.
              </Text>
            ) : (
              <Text as="p">{selected.description}</Text>
            )}
          </PlanetPanel>
        </div>
      ) : (
        <Text
          as="p"
          variant="label"
          tone="subtle"
          className="pointer-events-none absolute inset-x-0 bottom-8 px-6 text-center"
        >
          Drag to pan · scroll to zoom · select a planet to focus it
        </Text>
      )}
    </main>
  );
}

function connection(
  id: string,
  { anchorId, links, planets }: Pick<MapScreenProps, "anchorId" | "links" | "planets">,
  statuses: Record<string, PlanetStatus>,
) {
  if (id === anchorId) return "Where every lane begins";
  const prefix = connectionPrefixes[statuses[id]];
  const names = neighborsOf(id, links)
    .filter((n) => isActive(statuses[n]))
    .map((n) => planets.find((p) => p.id === n)?.name);
  if (!prefix || names.length === 0) return undefined;
  return `${prefix} ${names.join(", ")}`;
}
