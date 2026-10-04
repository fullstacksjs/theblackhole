import preview from "#storybook/preview";

import { PlanetStatusIndicator } from "./PlanetStatusIndicator";

const meta = preview.meta({
  title: "Components/Planet status indicator",
  component: PlanetStatusIndicator,
});
export const Charted = meta.story({ args: { status: "charted" } });
export const InReach = meta.story({ args: { status: "in-reach" } });
export const Uncharted = meta.story({ args: { status: "uncharted" } });
export const Fading = meta.story({ args: { status: "fading" } });
export const Anchor = meta.story({ args: { status: "anchor" } });
