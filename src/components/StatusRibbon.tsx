import { useState } from 'react';
import type { EvalResult } from '../types';

interface Props {
  results: EvalResult[];
  interval: number;
}

const STATUS_COLOR = {
  Good: 'bg-green-500 shadow-green-500/50',
  Unstable: 'bg-yellow-400 shadow-yellow-400/50',
  Bad: 'bg-red-500 shadow-red-500/50',
} as const;

const STATUS_TEXT = {
  Good: 'text-green-400',
  Unstable: 'text-yellow-400',
  Bad: 'text-red-400',
} as const;

function formatTime(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m${rem}s`;
}

interface TooltipProps {
  result: EvalResult;
  index: number;
  timeSeconds: number;
}

function Tooltip({ result, index, timeSeconds }: TooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-3 shadow-xl ring-1 ring-gray-700">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">
          #{index + 1} · {formatTime(timeSeconds)}
        </span>
        <span className={`text-xs font-semibold ${STATUS_TEXT[result.status]}`}>
          {result.status}
        </span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-gray-300">{result.reason}</p>
      <div className="space-y-0.5 font-mono text-xs text-gray-500">
        <div>window {result.windowEvents.length} events</div>
        <div>
          timeout {result.timeoutCount} ({result.timeoutRate.toFixed(1)}%)
        </div>
        {result.score !== null && <div>avg {result.score.toFixed(0)} ms</div>}
      </div>
    </div>
  );
}

export function StatusRibbon({ results, interval }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (results.length === 0) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
        Add events to see the status ribbon
      </div>
    );
  }

  const counts = results.reduce(
    (acc, r) => { acc[r.status]++; return acc; },
    { Good: 0, Unstable: 0, Bad: 0 },
  );
  const totalSeconds = (results.length - 1) * interval;

  return (
    <div className="flex flex-col gap-3">
      {/* LED row with inline time labels every 2 dots */}
      <div className="flex flex-wrap gap-x-1.5 gap-y-1">
        {results.map((result, i) => {
          const showLabel = i % 2 === 0;
          return (
            <div
              key={i}
              className="relative flex flex-col items-center gap-0.5"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className={`h-5 w-5 cursor-pointer rounded-full shadow-md transition-transform hover:scale-125 ${STATUS_COLOR[result.status]}`}
              />
              <span className="h-3 font-mono text-[9px] leading-none text-gray-500">
                {showLabel ? formatTime(i * interval) : ''}
              </span>
              {hoveredIdx === i && (
                <Tooltip result={result} index={i} timeSeconds={i * interval} />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>
          <span className="font-semibold text-green-400">{counts.Good}</span> Good
        </span>
        <span>
          <span className="font-semibold text-yellow-400">{counts.Unstable}</span> Unstable
        </span>
        <span>
          <span className="font-semibold text-red-400">{counts.Bad}</span> Bad
        </span>
        <span className="ml-auto font-mono text-gray-500">
          {results.length} events · {formatTime(totalSeconds)}
        </span>
      </div>
    </div>
  );
}
