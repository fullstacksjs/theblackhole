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
- `SignInScreen` is the sign-in route: the fogged field, with no personal map
  yet, and a panel that starts GitHub sign-in.
- Every time the map loads, `SpaceMap` starts fully fogged and plays
  `arrival.ts`: the camera zooms in as a point of light forms at The Craft,
  then stays close while a wave clears the fog outwards over 2.4 seconds. Planets cannot be selected until it ends. Learners
  can skip the intro. Under reduced motion the map appears at once.

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
