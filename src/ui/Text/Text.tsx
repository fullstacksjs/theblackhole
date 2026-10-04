import type { ComponentPropsWithRef, ElementType } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#lib/styles/cn.ts";

const textStyles = cva("", {
  variants: {
    variant: {
      body: "text-body text-pretty",
      heading: "text-lg font-semibold tracking-tight",
      title: "text-title font-semibold tracking-tight",
      caption: "text-caption",
      label: "font-mono text-label uppercase tracking-widest",
      metric: "text-3xl font-medium leading-none tracking-tight tabular-nums",
      mono: "font-mono text-xs tabular-nums",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-subtle-foreground",
      inherit: "text-inherit",
    },
  },
  defaultVariants: { variant: "body", tone: "default" },
});

export type TextProps<T extends ElementType = "span"> = {
  as?: T;
} & VariantProps<typeof textStyles> &
  Omit<ComponentPropsWithRef<T>, "as" | "color">;

export function Text<T extends ElementType = "span">({
  as,
  variant,
  tone,
  className,
  ...props
}: TextProps<T>) {
  const Component = as ?? "span";
  return <Component className={cn(textStyles({ variant, tone }), className)} {...props} />;
}
