import "./PlanetPanel.css";
import { cn } from "cn";
import { useId, type ComponentPropsWithRef, type ReactNode } from "react";

import { Text } from "#ui";

export type PlanetPanelProps = Omit<ComponentPropsWithRef<"section">, "title"> & {
  title: string;
  eyebrow?: string;
  status?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PlanetPanel({
  title,
  eyebrow,
  status,
  description,
  actions,
  children,
  className,
  ...props
}: PlanetPanelProps) {
  const titleId = useId();
  return (
    <section
      {...props}
      aria-labelledby={titleId}
      className={cn("planet-panel border border-border bg-panel backdrop-blur-sm", className)}
    >
      <div className="flex min-w-0 flex-col gap-2 border-b border-divider p-5 md:border-r md:border-b-0">
        {eyebrow && (
          <Text variant="label" tone="subtle">
            {eyebrow}
          </Text>
        )}
        <Text as="h2" id={titleId} variant="title" className="break-words">
          {title}
        </Text>
        {status}
        {description && (
          <Text as="p" variant="caption" tone="subtle">
            {description}
          </Text>
        )}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-col justify-center gap-2.5 p-5",
          !actions && "md:col-span-2",
        )}
      >
        {children}
      </div>
      {actions && (
        <div className="flex min-w-0 flex-col justify-center gap-2 border-t border-divider p-5 md:border-t-0 md:border-l">
          {actions}
        </div>
      )}
    </section>
  );
}
