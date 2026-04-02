import { useCallback, useRef } from 'react';
import type { Config } from '../types';

interface Props {
  config: Config;
  onChange: (c: Config) => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step = 1, unit = '', onChange }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-mono text-white">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-400"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

interface LatencyRangeSliderProps {
  good: number;
  bad: number;
  min: number;
  max: number;
  step: number;
  onChange: (good: number, bad: number) => void;
}

function LatencyRangeSlider({ good, bad, min, max, step, onChange }: LatencyRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const toPercent = (v: number) => ((v - min) / (max - min)) * 100;
  const fromPercent = (pct: number) => {
    const raw = (pct / 100) * (max - min) + min;
    return Math.round(raw / step) * step;
  };

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  const startDrag = useCallback(
    (handle: 'good' | 'bad') => (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const track = trackRef.current;
        if (!track) return;
        const { left, width } = track.getBoundingClientRect();
        const pct = clamp(((ev.clientX - left) / width) * 100, 0, 100);
        const val = clamp(fromPercent(pct), min, max);

        if (handle === 'good') {
          onChange(clamp(val, min, bad - step), bad);
        } else {
          onChange(good, clamp(val, good + step, max));
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [good, bad, min, max, step, onChange],
  );

  const goodPct = toPercent(good);
  const badPct = toPercent(bad);

  return (
    <div className="flex flex-col gap-2">
      {/* Value labels */}
      <div className="flex justify-between text-xs">
        <span className="text-green-400">T₁ <span className="font-mono text-white">{good}ms</span></span>
        <span className="text-red-400">T₂ <span className="font-mono text-white">{bad}ms</span></span>
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative h-6 w-full cursor-pointer select-none">
        {/* Background zones */}
        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-gray-700">
          {/* Green zone: 0 → T₁ */}
          <div
            className="absolute h-full bg-green-600/70"
            style={{ left: 0, width: `${goodPct}%` }}
          />
          {/* Yellow zone: T₁ → T₂ */}
          <div
            className="absolute h-full bg-yellow-500/70"
            style={{ left: `${goodPct}%`, width: `${badPct - goodPct}%` }}
          />
          {/* Red zone: T₂ → end */}
          <div
            className="absolute h-full bg-red-600/70"
            style={{ left: `${badPct}%`, right: 0 }}
          />
        </div>

        {/* T₁ handle */}
        <div
          className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-green-400 bg-gray-900 shadow active:cursor-grabbing"
          style={{ left: `${goodPct}%` }}
          onPointerDown={startDrag('good')}
        />

        {/* T₂ handle */}
        <div
          className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-red-400 bg-gray-900 shadow active:cursor-grabbing"
          style={{ left: `${badPct}%` }}
          onPointerDown={startDrag('bad')}
        />
      </div>

      {/* Min / max labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}ms</span>
        <span>{max}ms</span>
      </div>
    </div>
  );
}

export function ConfigPanel({ config, onChange }: Props) {
  const set = (partial: Partial<Config>) => onChange({ ...config, ...partial });
  const setThreshold = (partial: Partial<Config['scoreThresholds']>) =>
    set({ scoreThresholds: { ...config.scoreThresholds, ...partial } });

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 rounded-xl bg-gray-800 p-5">
      <h2 className="text-lg font-semibold text-white">Configuration</h2>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Timing
        </h3>
        <SliderRow
          label="Probe Interval (N)"
          value={config.interval}
          min={1}
          max={60}
          unit="s"
          onChange={(v) => set({ interval: v })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Window
        </h3>
        <SliderRow
          label="Window Size (M)"
          value={config.windowSize}
          min={1}
          max={20}
          onChange={(v) => set({ windowSize: v })}
        />
        <SliderRow
          label="Failure Threshold (P)"
          value={config.timeoutThreshold}
          min={1}
          max={100}
          unit="%"
          onChange={(v) => set({ timeoutThreshold: v })}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Latency Thresholds
        </h3>
        <LatencyRangeSlider
          good={config.scoreThresholds.good}
          bad={config.scoreThresholds.bad}
          min={100}
          max={6000}
          step={100}
          onChange={(good, bad) => set({ scoreThresholds: { good, bad } })}
        />
      </section>

      <section className="rounded-lg bg-gray-700/50 p-3 text-xs text-gray-400">
        <p className="mb-1 font-medium text-gray-300">Evaluation Logic</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            (TIMEOUT + DISCONNECT) / M ≥ {config.timeoutThreshold}% → <span className="text-red-400">Bad</span> (Failure Threshold)
          </li>
          <li>
            Avg &lt; {config.scoreThresholds.good}ms →{' '}
            <span className="text-green-400">Good</span>
          </li>
          <li>
            Avg &lt; {config.scoreThresholds.bad}ms →{' '}
            <span className="text-yellow-400">Unstable</span>
          </li>
          <li>
            Otherwise → <span className="text-red-400">Bad</span>
          </li>
        </ol>
      </section>
    </aside>
  );
}
