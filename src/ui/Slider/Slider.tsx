import "./Slider.css";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "cn";
import { useId } from "react";

import { Text } from "../Text/Text";

export type SliderProps = Omit<
  BaseSlider.Root.Props<number>,
  "id" | "value" | "defaultValue" | "onValueChange" | "children" | "className" | "orientation"
> & {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
};

export function Slider({
  label,
  value,
  defaultValue,
  onValueChange,
  formatValue = String,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className,
  ...props
}: SliderProps) {
  const id = useId();
  return (
    <BaseSlider.Root
      {...props}
      id={id}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={value}
      defaultValue={defaultValue ?? min}
      onValueChange={(next) => onValueChange?.(next)}
      className={cn("flex flex-col gap-1.5 data-disabled:opacity-50", className)}
    >
      <BaseSlider.Label render={<Text as="label" variant="label" tone="subtle" />}>
        {label}
      </BaseSlider.Label>
      <div className="flex min-h-7 items-center gap-2.5">
        <BaseSlider.Control className="relative flex h-7 w-30 touch-none items-center select-none">
          <BaseSlider.Track className="h-px w-full bg-border">
            <BaseSlider.Thumb
              getAriaValueText={(_formatted, current) => formatValue(current)}
              className="ui-slider-thumb block size-2.5 rounded-full bg-foreground data-disabled:cursor-not-allowed"
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
        <BaseSlider.Value
          render={<Text as="output" variant="mono" tone="muted" className="shrink-0" />}
        >
          {(_formatted, values) => formatValue(values[0])}
        </BaseSlider.Value>
      </div>
    </BaseSlider.Root>
  );
}
