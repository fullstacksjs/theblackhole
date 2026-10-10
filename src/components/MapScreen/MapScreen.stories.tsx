import { expect, waitFor, within } from "storybook/test";

import preview from "#storybook/preview";

import { MapScreen } from "./MapScreen";
import { mockMap } from "./mock-map";

const meta = preview.meta({
  title: "Components/Map screen",
  component: MapScreen,
  parameters: { layout: "fullscreen", chromatic: { viewports: [390, 1280] } },
  args: mockMap,
});

/**
 * Every load reveals the map out of the fog, and planets stay out of reach until the reveal has
 * swept past them. Under reduced motion the map appears at once.
 */
async function arrived(canvas: ReturnType<typeof within>) {
  const replication = canvas.getByRole("button", { name: "Replication, Charted" });
  await waitFor(
    async () => {
      await expect(replication.parentElement).not.toHaveAttribute("inert");
      await expect(replication).toBeVisible();
    },
    {
      timeout: 5000,
      // WebGL positions labels every frame; poll visibility without observing those writes.
      mutationObserverOptions: { attributes: true, attributeFilter: ["inert"] },
    },
  );
}

export const MockMap = meta.story({
  play: async ({ canvas }) => {
    await arrived(canvas);
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
  beforeEach: () => {
    // Selection tests the settled map; MockMap covers the animated arrival.
    const { matchMedia } = window;
    window.matchMedia = (query) =>
      matchMedia.call(window, query.replace("(prefers-reduced-motion: reduce)", "all"));
    return () => {
      window.matchMedia = matchMedia;
    };
  },
  play: async ({ canvas, userEvent }) => {
    await arrived(canvas);
    await expect(canvas.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Replication, Charted" }));
    const panel = await canvas.findByRole("region", { name: "Replication" });
    await expect(panel).toHaveTextContent("Linked to The Craft");
    await expect(panel).toHaveTextContent("Keeping copies of data on several machines");

    await userEvent.click(canvas.getByRole("button", { name: "Idempotency, In reach" }));
    const reach = await canvas.findByRole("region", { name: "Idempotency" });
    await expect(reach).toHaveTextContent("In reach via Replication");
    await expect(reach).not.toHaveTextContent("retries safe");

    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("region")).not.toBeInTheDocument();
  },
});

export const SkipArrival = meta.story({
  play: async ({ canvas, userEvent }) => {
    // Chromatic uses reduced motion, where there is no intro to skip.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const skip = canvas.getByRole("button", { name: "Skip intro" });
      const craft = canvas.getByRole("button", { name: "The Craft, Permanent anchor" });
      await expect(craft.parentElement).toHaveAttribute("inert");
      await userEvent.click(skip);
      await expect(canvas.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();
    }
    await arrived(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "The Craft, Permanent anchor" }));
    await expect(canvas.getByRole("region", { name: "The Craft" })).toBeVisible();
  },
});
