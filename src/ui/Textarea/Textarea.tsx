import { cn } from "cn";
import { useId, type ComponentPropsWithRef } from "react";

import { Text } from "../Text/Text";

export type TextareaProps = Omit<ComponentPropsWithRef<"textarea">, "id"> & {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
};

export function Textarea({
  label,
  description,
  error,
  hideLabel,
  className,
  disabled,
  "aria-describedby": describedBy,
  ...props
}: TextareaProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const descriptionIds = [describedBy, description && descriptionId, error && errorId]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      data-disabled={disabled || undefined}
      className="flex min-w-0 flex-col gap-2 data-disabled:opacity-50"
    >
      <Text
        as="label"
        htmlFor={id}
        variant="label"
        tone="muted"
        className={hideLabel ? "sr-only" : undefined}
      >
        {label}
      </Text>
      <textarea
        {...props}
        id={id}
        disabled={disabled}
        aria-describedby={descriptionIds || undefined}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(
          "min-h-24 w-full resize-y border border-border bg-input p-3 text-sm leading-relaxed text-foreground transition-colors placeholder:text-subtle-foreground hover:enabled:border-subtle-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed motion-reduce:transition-none",
          className,
        )}
      />
      {description && (
        <Text as="p" id={descriptionId} variant="caption" tone="subtle">
          {description}
        </Text>
      )}
      {error && (
        <Text as="p" id={errorId} role="alert" variant="caption">
          {error}
        </Text>
      )}
    </div>
  );
}
