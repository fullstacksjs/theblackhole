import { expect, fn } from "storybook/test";

import { StoryMatrix } from "#storybook/matrix";
import preview from "#storybook/preview";
import { Button } from "#ui";

const meta = preview.meta({
  title: "UI/Button",
  component: Button,
  args: { children: "Save changes", onClick: fn() },
});

export const Primary = meta.story({
  args: { variant: "primary" },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });
    button.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});
export const Secondary = meta.story({ args: { children: "Not now" } });
export const Quiet = meta.story({ args: { variant: "quiet", children: "Close" } });
export const Loading = meta.story({
  args: { variant: "primary", loading: true, children: "Saving changes" },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Saving changes" });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
});
export const Variants = meta.story({
  render: () => (
    <StoryMatrix
      rows={["Primary", "Secondary", "Quiet"]}
      columns={[
        { label: "Default" },
        { label: "Small" },
        { label: "Disabled" },
        { label: "Loading" },
      ]}
      cell={({ row, col }) => (
        <Button
          variant={row === "Primary" ? "primary" : row === "Quiet" ? "quiet" : "secondary"}
          size={col === "Small" ? "small" : "default"}
          disabled={col === "Disabled"}
          loading={col === "Loading"}
        >
          {col === "Loading" ? "Saving" : "Continue"}
        </Button>
      )}
    />
  ),
});
