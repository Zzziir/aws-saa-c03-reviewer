import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ticks,
  ...props
}: SliderPrimitive.Root.Props & {
  /** Values along the track to draw guide notches at (e.g. step stops). */
  ticks?: number[]
}) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  const span = (max as number) - (min as number)

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-secondary select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-brand select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {ticks && ticks.length > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2"
          >
            {ticks.map((t) => {
              const pct = span > 0 ? (((t as number) - (min as number)) / span) * 100 : 0
              // Notch sits under the value; brand-tinted so it reads on the
              // orange fill and on the muted track alike.
              return (
                <span
                  key={t}
                  className="absolute top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/25"
                  style={{ left: `${pct}%` }}
                />
              )
            })}
          </div>
        )}
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-4 shrink-0 rounded-full border-2 border-brand bg-white shadow-sm ring-brand/30 transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden active:ring-4 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
