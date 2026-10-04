import "./Progress.css";
import { cn } from "cn";
import { useId, type ComponentPropsWithRef } from "react";

import { Text } from "../Text/Text";

export type ProgressProps = Omit<
  ComponentPropsWithRef<"progress">,
  "id" | "value" | "max" | "children"
> & {
  label: string;
  value: number;
  max?: number;
};

export function Progress({ label, value, max = 100, className, ...props }: ProgressProps) {
  const id = useId();
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const amount = Number.isFinite(value) ? Math.min(limit, Math.max(0, value)) : 0;
  const percentage = Math.round((amount / limit) * 100);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-4">
        <Text as="label" htmlFor={id} variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="mono" tone="subtle" aria-hidden="true">
          {percentage}%
        </Text>
      </div>
      <progress {...props} id={id} value={amount} max={limit} className="ui-progress" />
    </div>
  );
}
