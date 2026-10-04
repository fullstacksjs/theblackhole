import preview from "#storybook/preview";
import { Stat } from "#ui";

import { PlanetStatusIndicator } from "../PlanetStatusIndicator/PlanetStatusIndicator";

const meta = preview.meta({ title: "Components/Map counts", component: Stat });
export const MapCounts = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-8">
      <Stat label={<PlanetStatusIndicator status="charted" />} value={5} />
      <Stat label={<PlanetStatusIndicator status="in-reach" />} value={12} />
      <Stat label={<PlanetStatusIndicator status="uncharted" />} value={24} />
      <Stat label={<PlanetStatusIndicator status="fading" />} value={0} />
    </div>
  ),
});
