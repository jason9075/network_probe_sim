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
          max={50}
          onChange={(v) => set({ windowSize: v })}
        />
        <SliderRow
          label="Timeout Threshold (P)"
          value={config.timeoutThreshold}
          min={1}
          max={100}
          unit="%"
          onChange={(v) => set({ timeoutThreshold: v })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Latency Thresholds
        </h3>
        <SliderRow
          label="Good → Unstable (T₁)"
          value={config.scoreThresholds.good}
          min={10}
          max={config.scoreThresholds.bad - 10}
          step={5}
          unit="ms"
          onChange={(v) => setThreshold({ good: v })}
        />
        <SliderRow
          label="Unstable → Bad (T₂)"
          value={config.scoreThresholds.bad}
          min={config.scoreThresholds.good + 10}
          max={1000}
          step={10}
          unit="ms"
          onChange={(v) => setThreshold({ bad: v })}
        />
      </section>

      <section className="rounded-lg bg-gray-700/50 p-3 text-xs text-gray-400">
        <p className="mb-1 font-medium text-gray-300">Evaluation Logic</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>
            TIMEOUT / M ≥ {config.timeoutThreshold}% → <span className="text-red-400">Bad</span>
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
