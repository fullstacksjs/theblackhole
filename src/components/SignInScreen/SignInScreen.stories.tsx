import { expect, fn } from "storybook/test";

import preview from "#storybook/preview";

import { mockMap } from "../MapScreen/mock-map";
import { SignInScreen } from "./SignInScreen";

const meta = preview.meta({
  title: "Components/Sign in screen",
  component: SignInScreen,
  parameters: { layout: "fullscreen", chromatic: { viewports: [390, 1280] } },
  args: {
    sectors: mockMap.sectors,
    anchorId: mockMap.anchorId,
    planets: mockMap.planets,
    links: mockMap.links,
    // Resolves as the browser starts leaving for GitHub.
    onSignIn: fn(() => new Promise(() => {})),
  },
});

export const Fogged = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(canvas.getByText("Field fogged")).toBeVisible();
    await expect(canvas.getByText("Uncharted").closest("div")).toHaveTextContent("3");
  },
});

export const RedirectToGitHub = meta.story({
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Continue with GitHub" });
    await userEvent.click(button);
    await expect(args.onSignIn).toHaveBeenCalledOnce();
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent("Do not close this window");
  },
});

export const SignInFails = meta.story({
  args: { onSignIn: fn(() => Promise.reject(new Error("offline"))) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Continue with GitHub" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("GitHub could not be reached");
    await expect(canvas.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
  },
});
