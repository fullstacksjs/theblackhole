import { StatusIndicator, type StatusIndicatorProps } from "#ui";

const statuses = {
  charted: { label: "Charted", variant: "solid", tone: "default" },
  "in-reach": { label: "In reach", variant: "dashed", tone: "muted" },
  uncharted: { label: "Uncharted", variant: "solid", tone: "faint" },
  fading: { label: "Fading", variant: "solid", tone: "subtle" },
  anchor: { label: "Permanent anchor", variant: "solid", tone: "default" },
} as const;

export type PlanetStatus = keyof typeof statuses;
export type PlanetStatusIndicatorProps = Omit<
  StatusIndicatorProps,
  "label" | "variant" | "tone"
> & {
  status: PlanetStatus;
};

export function PlanetStatusIndicator({
  status,
  ...props
}: PlanetStatusIndicatorProps) {
  return <StatusIndicator {...props} {...statuses[status]} />;
}
