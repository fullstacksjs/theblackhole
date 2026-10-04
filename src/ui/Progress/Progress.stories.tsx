import { expect } from "storybook/test";

import preview from "#storybook/preview";
import { Progress } from "#ui";

const meta = preview.meta({
  title: "UI/Progress",
  component: Progress,
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  args: { label: "Upload progress", value: 25 },
});
export const Partial = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar", { name: "Upload progress" })).toHaveAttribute(
      "value",
      "25",
    );
  },
});
export const Empty = meta.story({ args: { value: 0 } });
export const Complete = meta.story({ args: { value: 100 } });
export const ItemCount = meta.story({ args: { value: 2, max: 8 } });
