import preview from "#storybook/preview";
import { Slider } from "#ui";

const meta = preview.meta({ title: "Components/Map settings", component: Slider });

export const MapControls = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-8">
      <Slider
        label="Planet size"
        min={0.5}
        max={2.5}
        step={0.05}
        defaultValue={1}
        formatValue={(value) => `${value.toFixed(2)}×`}
      />
      <Slider label="Faces" min={-1} max={6} defaultValue={0} />
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
  ),
});
