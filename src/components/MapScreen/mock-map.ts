import type { MapScreenProps } from "./MapScreen";

/**
 * A stand-in personal map until the prepared collection and progress live in Convex: The Craft and
 * three Distributed systems concepts, one of each map status a new learner meets first.
 */
export const mockMap: MapScreenProps = {
  sectors: [
    "Distributed systems",
    "Architecture",
    "Team & communication",
    "Delivery",
    "Economics of software",
  ],
  anchorId: "the-craft",
  planets: [
    {
      id: "the-craft",
      name: "The Craft",
      sector: 0,
      tier: 0,
      slot: 0,
      description:
        "Building software that survives contact with people, time and scale. Every lane starts here.",
    },
    {
      id: "replication",
      name: "Replication",
      sector: 0,
      tier: 1,
      slot: 0,
      description:
        "Keeping copies of data on several machines so the system survives losing any one of them.",
    },
    {
      id: "idempotency",
      name: "Idempotency",
      sector: 0,
      tier: 2,
      slot: 0,
      description:
        "An operation with the same effect whether it runs once or many times — what makes retries safe.",
    },
    {
      id: "exactly-once",
      name: "Exactly-once",
      sector: 0,
      tier: 3,
      slot: 0,
      description:
        "The illusion of single processing, built from at-least-once delivery plus idempotent handling.",
    },
  ],
  links: [
    ["the-craft", "replication"],
    ["replication", "idempotency"],
    ["idempotency", "exactly-once"],
  ],
  retention: { replication: 40 },
};
