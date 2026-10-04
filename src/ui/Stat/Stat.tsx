import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "cn";

import { Text } from "../Text/Text";

export type StatProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  value: number;
};

export function Stat({ label, value, className, ...props }: StatProps) {
  return (
    <div {...props} className={cn("flex flex-col items-start gap-1.5", className)}>
      <Text variant="label" tone="subtle">
        {label}
      </Text>
      <Text variant="metric">{value}</Text>
    </div>
  );
}
