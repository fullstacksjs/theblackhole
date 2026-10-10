import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "#convex/_generated/api";
import { CRAFT_ID, explainPersonalMap } from "#domain/personal-map";
import { Text } from "#ui";

import { MapScreen } from "./MapScreen";

export function PersonalMapScreen() {
  const map = useQuery(api.personalMap.current);
  const [clock, setClock] = useState({ evaluationAt: 0, sourceAt: 0 });
  const geometry = useMemo(() => {
    if (!map) return null;
    const sectors = [...new Set(map.concepts.map(({ sector }) => sector))].sort();
    return {
      sectors,
      links: map.explanation.relationships.map(({ endpoints }) => endpoints),
      planets: [
        {
          id: CRAFT_ID,
          name: "The Craft",
          sector: 0,
          tier: 0,
          slot: 0,
          description: "The permanent starting anchor of your personal map.",
        },
        ...map.concepts.map((concept) => ({
          id: concept.conceptId,
          name: concept.name,
          sector: sectors.indexOf(concept.sector),
          tier: concept.tier,
          slot: concept.slot,
          description: concept.material.explanation,
        })),
      ],
    };
  }, [map]);
  useEffect(() => {
    if (!map) return;
    const startedAt = performance.now();
    const sourceAt = map.explanation.evaluationAt;
    const currentAt = Math.max(sourceAt, Date.now());
    const advance = () =>
      setClock({ sourceAt, evaluationAt: currentAt + performance.now() - startedAt });
    const initial = window.setTimeout(advance, 0);
    const timer = window.setInterval(advance, 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [map]);
  if (!map || !geometry) {
    return <Text as="p">Loading your personal map...</Text>;
  }
  const evaluationAt =
    clock.sourceAt === map.explanation.evaluationAt
      ? clock.evaluationAt
      : map.explanation.evaluationAt;
  const { retention } = explainPersonalMap(
    {
      conceptIds: map.concepts.map(({ conceptId }) => conceptId),
      links: geometry.links,
    },
    map.progress,
    evaluationAt,
  );
  return <MapScreen anchorId={CRAFT_ID} {...geometry} retention={retention} />;
}
