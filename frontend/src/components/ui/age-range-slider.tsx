"use client";
import { Label, Slider } from "@heroui/react";

interface AgeRangeSliderProps {
  value: [number, number];
  onChange: (range: [number, number]) => void;
  label?: string;
  minValue?: number;
  maxValue?: number;
  className?: string;
}

// Two-thumb age range; keeps min strictly below max
export function AgeRangeSlider({
  value, onChange, label = "Preferred Age Range", minValue = 18, maxValue = 70, className = "max-w-full",
}: AgeRangeSliderProps) {
  return (
    <Slider
      className={className}
      aria-label={label}
      minValue={minValue}
      maxValue={maxValue}
      step={1}
      value={value}
      onChange={(val) => {
        const values = Array.isArray(val) ? val : value;
        const min = Math.min(values[0], values[1] - 1);
        const max = Math.max(values[1], min + 1);
        onChange([min, max]);
      }}
    >
      <div className="flex justify-between">
        <Label>{label}</Label>
        <Slider.Output>{({ state }) => `${state.values[0]} - ${state.values[1]} years`}</Slider.Output>
      </div>
      <Slider.Track>
        {({ state }) => (
          <>
            <Slider.Fill />
            {state.values.map((_, i) => (
              <Slider.Thumb key={i} index={i} />
            ))}
          </>
        )}
      </Slider.Track>
    </Slider>
  );
}
