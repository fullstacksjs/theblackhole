# Application components

This directory contains components and compositions specific to TheBlackHole.
They use the general design system through `#ui`.

- `PlanetStatusIndicator` maps planet conditions to labels and indicator styles.
  Import it and its prop types from `#components/PlanetStatusIndicator/PlanetStatusIndicator.tsx`.
- `PlanetPanel` provides the planet-specific identity, content, and actions
  layout. Import it and its prop types from `#components/PlanetPanel/PlanetPanel.tsx`.
  Its stylesheet lives beside the component and loads when the component is used.

- `SpaceMap` mounts the isometric WebGL renderer (`IsoMap`, built on `three`)
  and renders the planet and sector labels it positions. Planet labels are
  buttons, so planets can be selected from the keyboard.
- `MapScreen` composes the map, sector progress, map counts, and the planet
  panel. The index route renders it with `mock-map.ts`, The Craft and three
  concepts, until the personal map is loaded from Convex.

The planet panel stories include recall, learning opportunities, correctness
results, and unavailable grading. The answer-validation story demonstrates
react-hook-form with a Valibot resolver, blank-answer rejection, focus on the
invalid field, and preservation of the draft.

The map, map counts, and map settings stories assemble the application interface
from these components and the design system. Browse them under `Components` in
Storybook. `Components/Map/Map controls` shows the POC's interface without the map
renderer. The planet panel and map stories include desktop and phone snapshots.

Each component or composition has its own directory. Keep its implementation,
stories, and any dedicated stylesheet together.
