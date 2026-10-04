import { expect, waitFor, within } from "storybook/test";

import preview from "#storybook/preview";
import { Button, ToastProvider, useToast } from "#ui";

function ToastExample() {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        toast.add({ title: "Changes saved", description: "Your preferences have been updated." });
      }}
    >
      Show notification
    </Button>
  );
}
const meta = preview.meta({
  title: "UI/Toast",
  component: ToastProvider,
  render: (args) => (
    <ToastProvider {...args}>
      <ToastExample />
    </ToastProvider>
  ),
});
export const Notification = meta.story({
  args: { timeout: 0 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show notification" }));
    const page = within(document.body);
    await waitFor(() =>
      expect(page.getByText("Your preferences have been updated.")).toBeVisible(),
    );
  },
});
export const Dismiss = meta.story({
  args: { timeout: 0 },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Show notification" }));
    const page = within(document.body);
    await userEvent.click(page.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() =>
      expect(page.queryByText("Your preferences have been updated.")).not.toBeInTheDocument(),
    );
  },
});
