import type { ComponentPropsWithRef, ReactNode } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Text } from "../Text/Text";

const indicatorStyles = cva("inline-block size-2 shrink-0 rounded-full", {
  variants: {
    variant: {
      solid: "bg-current",
      dashed: "border border-dashed border-current",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-subtle-foreground",
      faint: "text-faint",
    },
  },
  defaultVariants: { variant: "solid", tone: "default" },
});

export type StatusIndicatorProps = Omit<ComponentPropsWithRef<"span">, "children"> &
  VariantProps<typeof indicatorStyles> & {
    label: ReactNode;
  };

export function StatusIndicator({
  label,
  variant,
  tone,
  className,
  ...props
}: StatusIndicatorProps) {
  return (
    <Text
      {...props}
      variant="label"
      tone="muted"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span aria-hidden="true" className={indicatorStyles({ variant, tone })} />
      {label}
    </Text>
  );
}
