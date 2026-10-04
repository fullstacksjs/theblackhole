import preview from "#storybook/preview";
import { StatusIndicator } from "#ui";

const meta = preview.meta({ title: "UI/Status indicator", component: StatusIndicator });

export const Default = meta.story({ args: { label: "Available" } });
export const Dashed = meta.story({ args: { label: "Pending", variant: "dashed", tone: "muted" } });
export const Subtle = meta.story({ args: { label: "Paused", tone: "subtle" } });
export const Faint = meta.story({ args: { label: "Offline", tone: "faint" } });
