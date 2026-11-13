import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { chartStats, clamp, pointTime } from '../../lib/chart';
import { formatPct, formatUsd } from '../../lib/format';

interface PriceChartProps {
  /** About 7 days of prices, evenly spaced, oldest first. */
  values: number[];
  /** When the last value was recorded (CoinGecko's last_updated). */
  endTime: string;
  /** The coin's name, for screen readers. */
  label: string;
}

// The SVG is drawn in these units and stretched to the card's width (preserveAspectRatio="none").
const WIDTH = 300;
const HEIGHT = 100;
const PAD = 6; // keeps the line off the top and bottom edges

const pointLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric' });

/**
 * A larger 7-day price chart with a readout. Hover (or drag on a phone) to see the price at
 * any point; with the keyboard it's a slider (arrow keys, Home, End).
 * Hand-drawn SVG instead of a chart library: one line and one area don't justify ~100 KB of code.
 * Rendered by CoinRow when the user expands a coin.
 */
export function PriceChart({ values, endTime, label }: PriceChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  if (values.length < 2) return null;

  const last = values.length - 1;
  const { low, high, changePct } = chartStats(values);
  const range = high - low || 1;
  const x = (i: number) => (i / last) * WIDTH;
  const y = (value: number) => PAD + (1 - (value - low) / range) * (HEIGHT - 2 * PAD);
  const line = values.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const positive = changePct >= 0;

  const shown = active ?? last;
  // The last point is CoinGecko's latest hourly sample, so it can differ a little from the live price above.
  const shownTime = shown === last ? 'Latest hourly' : `~${pointLabel.format(pointTime(shown, values.length, new Date(endTime)))}`;
  const shownText = `${shownTime}: ${formatUsd(values[shown])}`;

  /** Pointer x → index of the nearest point. Used by the pointer handlers below. */
  function indexAt(clientX: number): number {
    const box = plotRef.current!.getBoundingClientRect();
    const ratio = clamp((clientX - box.left) / box.width, 0, 1);
    return Math.round(ratio * last);
  }

  /** Hover or drag: show the point under the pointer. */
  function onPointerMove(event: PointerEvent) {
    setActive(indexAt(event.clientX));
  }

  /** Slider keys: ←/→ move one point, Home/End jump to the ends. */
  function onKeyDown(event: KeyboardEvent) {
    const moves: Record<string, (from: number) => number> = {
      ArrowLeft: (from) => from - 1,
      ArrowRight: (from) => from + 1,
      Home: () => 0,
      End: () => last,
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    // A functional update, so fast repeated keys each start from the latest point, not a stale one.
    setActive((current) => clamp(move(current ?? last), 0, last));
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium tabular-nums">{formatUsd(values[shown])}</span>
        <span className="text-xs text-slate-400">{shownTime}</span>
      </div>

      <div
        ref={plotRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label} price over the last 7 days`}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={shown}
        aria-valuetext={shownText}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        // touch-none: dragging across the chart scrubs it instead of scrolling the card.
        className="relative h-28 cursor-crosshair touch-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden className="h-full w-full">
          <polygon points={`0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`} className={positive ? 'fill-emerald-400/10' : 'fill-rose-400/10'} />
          <polyline
            points={line}
            fill="none"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className={positive ? 'stroke-emerald-400' : 'stroke-rose-400'}
          />
        </svg>
        {/* The marker is HTML, positioned in %, so it stays round while the SVG stretches. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-slate-500/60" style={{ left: `${(x(shown) / WIDTH) * 100}%` }} />
        <div
          aria-hidden
          className={`pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-slate-900 ${positive ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{ left: `${(x(shown) / WIDTH) * 100}%`, top: `${(y(values[shown]) / HEIGHT) * 100}%` }}
        />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-slate-500">7d change</dt>
          <dd className={`tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>{formatPct(changePct)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">7d high</dt>
          <dd className="tabular-nums">{formatUsd(high)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">7d low</dt>
          <dd className="tabular-nums">{formatUsd(low)}</dd>
        </div>
      </dl>
    </div>
  );
}
