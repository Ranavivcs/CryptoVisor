interface SparklineProps {
  values: number[];
  /** Colours the line: green when the period ended up, red when down. */
  positive: boolean;
  width?: number;
  height?: number;
}

/** A tiny 7-day price line drawn as one SVG polyline. Decorative, so hidden from screen readers. */
export function Sparkline({ values, positive, width = 96, height = 32 }: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values
    .map((value, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - ((value - min) / range) * height).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0">
      <polyline points={points} fill="none" strokeWidth="1.5" className={positive ? 'stroke-emerald-400' : 'stroke-rose-400'} />
    </svg>
  );
}
