import { cn } from "cn";
import { useEffect, useEffectEvent, useRef } from "react";

import type { Link, PlanetStatus } from "#domain/map.ts";

import { Text } from "#ui";

import { IsoMap, type IsoMapPlanet } from "./IsoMap";

export interface SpaceMapPlanet extends IsoMapPlanet {
  name: string;
}

export interface SpaceMapProps {
  planets: readonly SpaceMapPlanet[];
  links: readonly Link[];
  sectors: readonly string[];
  statuses: Record<string, PlanetStatus>;
  selectedId: string | null;
  onPick: (id: string | null) => void;
  className?: string;
}

const labelTones: Record<PlanetStatus, string> = {
  anchor: "text-foreground",
  charted: "text-foreground",
  fading: "text-muted-foreground",
  "in-reach": "text-muted-foreground",
  uncharted: "text-faint",
};

const statusNames: Record<PlanetStatus, string> = {
  anchor: "Permanent anchor",
  charted: "Charted",
  fading: "Fading",
  "in-reach": "In reach",
  uncharted: "Uncharted",
};

export function SpaceMap({
  planets,
  links,
  sectors,
  statuses,
  selectedId,
  onPick,
  className,
}: SpaceMapProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<IsoMap | null>(null);
  const labels = useRef(new Map<string, HTMLElement>());
  const sectorLabels = useRef(new Map<number, HTMLElement>());
  const pick = useEffectEvent(onPick);
  const sectorCount = sectors.length;

  useEffect(() => {
    const map = new IsoMap(stageRef.current!, {
      planets,
      links,
      sectorCount,
      onPick: (id) => pick(id),
    });
    for (const [id, el] of labels.current) map.attachLabel(id, el);
    for (const [index, el] of sectorLabels.current) map.attachSectorLabel(index, el);
    mapRef.current = map;
    return () => {
      mapRef.current = null;
      map.dispose();
    };
  }, [planets, links, sectorCount]);

  useEffect(() => {
    mapRef.current?.setStatus(statuses, selectedId);
  }, [planets, links, sectorCount, statuses, selectedId]);

  useEffect(() => {
    if (selectedId) mapRef.current?.focus(selectedId);
    else mapRef.current?.overview();
  }, [selectedId]);

  return (
    <div className={cn("relative overflow-hidden bg-background", className)}>
      <div ref={stageRef} aria-hidden="true" className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {sectors.map((name, index) => (
          <Text
            key={name}
            ref={(el: HTMLElement | null) => {
              if (!el) return;
              sectorLabels.current.set(index, el);
              mapRef.current?.attachSectorLabel(index, el);
              return () => {
                sectorLabels.current.delete(index);
                mapRef.current?.attachSectorLabel(index, null);
              };
            }}
            aria-hidden="true"
            variant="label"
            tone="inherit"
            className="absolute top-0 left-0 whitespace-nowrap text-faint will-change-transform"
          >
            {name}
          </Text>
        ))}
        {planets.map(({ id, name }) => {
          const status = statuses[id] ?? "uncharted";
          return (
            <button
              key={id}
              ref={(el) => {
                if (!el) return;
                labels.current.set(id, el);
                mapRef.current?.attachLabel(id, el);
                return () => {
                  labels.current.delete(id);
                  mapRef.current?.attachLabel(id, null);
                };
              }}
              type="button"
              inert={status === "uncharted"}
              aria-label={`${name}, ${statusNames[status]}`}
              aria-pressed={id === selectedId}
              onClick={() => onPick(id)}
              className={cn(
                "pointer-events-auto absolute top-0 left-0 cursor-pointer whitespace-nowrap opacity-0 text-shadow-md text-shadow-background will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                labelTones[status],
              )}
            >
              <Text
                variant={id === selectedId ? "body" : "caption"}
                tone="inherit"
                className={id === selectedId ? "font-semibold" : "font-medium"}
              >
                {name}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
}
