import { useState } from "react";
import { expect, fn } from "storybook/test";

import preview from "#storybook/preview";
import { Slider } from "#ui";

const meta = preview.meta({
  title: "UI/Slider",
  component: Slider,
  args: {
    label: "Scale",
    min: 0.5,
    max: 2.5,
    step: 0.05,
    defaultValue: 1,
    formatValue: (value) => `${value.toFixed(2)}×`,
    onValueChange: fn(),
  },
});
export const Scale = meta.story({
  play: async ({ canvas, userEvent, args }) => {
    const slider = canvas.getByRole("slider", { name: "Scale" });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(slider).toHaveValue("1.05");
    await expect(slider).toHaveAttribute("aria-valuetext", "1.05×");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1.05);
    await expect(canvas.getByText("1.05×")).toBeVisible();
  },
});
export const Disabled = meta.story({
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("slider", { name: "Scale" })).toBeDisabled();
  },
});
function ControlledSlider() {
  const [value, setValue] = useState(1);
  return (
    <Slider
      label="Scale"
      min={0.5}
      max={2.5}
      step={0.05}
      value={value}
      onValueChange={setValue}
      formatValue={(next) => `${next.toFixed(2)}×`}
    />
  );
}
export const Controlled = meta.story({ render: () => <ControlledSlider /> });
