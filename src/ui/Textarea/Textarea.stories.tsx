import { expect } from "storybook/test";

import preview from "#storybook/preview";
import { Textarea } from "#ui";

const meta = preview.meta({
  title: "UI/Textarea",
  component: Textarea,
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Message",
    placeholder: "Write a message…",
    description: "Include any details you want to share.",
  },
});
export const Default = meta.story({
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.type(input, "Please send me the updated document.");
    await expect(input).toHaveValue("Please send me the updated document.");
    await expect(input).toHaveAccessibleDescription("Include any details you want to share.");
  },
});
export const Invalid = meta.story({ args: { error: "Enter a message before submitting." } });
export const Disabled = meta.story({ args: { disabled: true } });
export const HiddenLabel = meta.story({ args: { hideLabel: true } });
export const MultipleFields = meta.story({
  render: () => (
    <div className="flex flex-col gap-5">
      <Textarea label="Message" />
      <Textarea label="Additional details" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const message = canvas.getByRole("textbox", { name: "Message" });
    const feedback = canvas.getByRole("textbox", { name: "Additional details" });
    await userEvent.click(canvas.getByText("Additional details"));
    await expect(feedback).toHaveFocus();
    await userEvent.type(feedback, "The document should include the latest changes.");
    await expect(message).toHaveValue("");
    await expect(feedback).toHaveValue("The document should include the latest changes.");
  },
});
