import preview from "#storybook/preview";
import { Button, Progress, Slider, Stat, Text, Textarea } from "#ui";

import { PlanetPanel } from "../PlanetPanel/PlanetPanel";
import { PlanetStatusIndicator } from "../PlanetStatusIndicator/PlanetStatusIndicator";

const meta = preview.meta({
  title: "Components/Map",
  parameters: { layout: "fullscreen", chromatic: { viewports: [390, 1280] } },
});

export const MapControls = meta.story({
  render: () => (
    <main className="flex min-h-screen flex-col justify-between gap-12 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-8">
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
            <Progress label="Distributed systems" value={25} />
            <Progress label="Architecture" value={13} />
            <Progress label="Team & communication" value={13} />
            <Progress label="Delivery" value={0} />
            <Progress label="Economics of software" value={0} />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-start gap-8">
            <Stat label={<PlanetStatusIndicator status="charted" />} value={5} />
            <Stat label={<PlanetStatusIndicator status="in-reach" />} value={12} />
            <Stat label={<PlanetStatusIndicator status="uncharted" />} value={24} />
            <Button size="small">Reset</Button>
          </div>
          <div className="flex flex-wrap gap-8">
            <Slider
              label="Planet size"
              min={0.5}
              max={2.5}
              step={0.05}
              defaultValue={1}
              formatValue={(value) => `${value.toFixed(2)}×`}
            />
            <Slider
              label="Link width"
              min={0.1}
              max={1.5}
              step={0.05}
              defaultValue={0.35}
              formatValue={(value) => `${value.toFixed(2)}×`}
            />
            <Slider
              label="Flow"
              min={0}
              max={6}
              defaultValue={6}
              formatValue={(value) =>
                ["Static", "Breathe", "Packets", "Sweep", "Crawl", "Spiral", "Comet"][value]
              }
            />
          </div>
        </div>
      </div>
      <PlanetPanel
        className="mx-auto"
        title="Replication"
        eyebrow="Distributed systems"
        status={<PlanetStatusIndicator status="in-reach" />}
        description="In reach via The Craft"
        actions={
          <>
            <Button variant="primary">Submit answer</Button>
            <Button>Not now</Button>
          </>
        }
      >
        <Textarea label="Your explanation" hideLabel placeholder="Explain it from memory…" />
      </PlanetPanel>
    </main>
  ),
});
