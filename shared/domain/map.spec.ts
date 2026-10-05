import { derivePlanetStatuses } from "./map";

const map = {
  anchorId: "craft",
  planetIds: ["craft", "a", "b", "c", "d"],
  links: [
    ["craft", "a"],
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
  ] as const,
};

describe(derivePlanetStatuses, () => {
  it("puts only the entry concepts in reach of a fresh map", () => {
    expect(derivePlanetStatuses({ ...map, retention: {} })).toEqual({
      craft: "anchor",
      a: "in-reach",
      b: "uncharted",
      c: "uncharted",
      d: "uncharted",
    });
  });

  it("brings the neighbors of a charted planet in reach", () => {
    expect(derivePlanetStatuses({ ...map, retention: { a: 40 } })).toMatchObject({
      a: "charted",
      b: "in-reach",
      c: "uncharted",
    });
  });

  it("keeps a depleted planet learned but stops it revealing neighbors", () => {
    expect(derivePlanetStatuses({ ...map, retention: { a: 40, b: 40, c: 0 } })).toMatchObject({
      c: "fading",
      d: "uncharted",
    });
  });

  it("lets an active planet in a partition reveal its neighbors", () => {
    expect(derivePlanetStatuses({ ...map, retention: { a: 0, c: 12 } })).toMatchObject({
      a: "fading",
      b: "in-reach",
      c: "charted",
      d: "in-reach",
    });
  });
});
