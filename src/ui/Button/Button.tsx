import type { ComponentPropsWithRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { LoaderCircle } from "lucide-react";

import { Text } from "../Text/Text";

const buttonStyles = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border font-mono transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-foreground bg-foreground text-background enabled:hover:border-primary-hover enabled:hover:bg-primary-hover",
        secondary:
          "border-border bg-transparent text-muted-foreground enabled:hover:border-subtle-foreground enabled:hover:text-foreground",
        quiet:
          "border-transparent bg-transparent text-subtle-foreground enabled:hover:border-border enabled:hover:text-foreground",
      },
      size: { default: "min-h-11 px-3 py-2.5", small: "min-h-9 px-3 py-1.5" },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

export type ButtonProps = ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonStyles> & { loading?: boolean };

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
    >
      {loading && (
        <LoaderCircle
          aria-hidden="true"
          className="size-3 animate-spin motion-reduce:animate-none"
        />
      )}
      <Text variant="label" tone="inherit">
        {children}
      </Text>
    </button>
  );
}
