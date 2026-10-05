import { expect, within } from "storybook/test";

import preview from "#storybook/preview";

import { MapScreen } from "./MapScreen";
import { mockMap } from "./mock-map";

const meta = preview.meta({
  title: "Components/Map screen",
  component: MapScreen,
  parameters: { layout: "fullscreen", chromatic: { viewports: [390, 1280] } },
  args: mockMap,
});

export const MockMap = meta.story({
  play: async ({ canvas }) => {
    const countOf = (label: string) => within(canvas.getByText(label).closest("div")!);
    await expect(countOf("Charted").getByText("1")).toBeVisible();
    await expect(countOf("In reach").getByText("1")).toBeVisible();
    await expect(countOf("Uncharted").getByText("1")).toBeVisible();
    await expect(canvas.getByRole("progressbar", { name: "Distributed systems" })).toHaveAttribute(
      "value",
      "1",
    );
    // Uncharted planets stay hidden in the fog and cannot be selected.
    await expect(canvas.getByText("Exactly-once").closest("button")).toHaveAttribute("inert");
  },
});

export const SelectPlanet = meta.story({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Replication, Charted" }));
    const panel = canvas.getByRole("region", { name: "Replication" });
    await expect(panel).toHaveTextContent("Linked to The Craft");
    await expect(panel).toHaveTextContent("Keeping copies of data on several machines");

    await userEvent.click(canvas.getByRole("button", { name: "Idempotency, In reach" }));
    const reach = canvas.getByRole("region", { name: "Idempotency" });
    await expect(reach).toHaveTextContent("In reach via Replication");
    await expect(reach).not.toHaveTextContent("retries safe");

    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("region")).not.toBeInTheDocument();
  },
});
