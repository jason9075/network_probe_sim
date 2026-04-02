import { useState } from 'react';
import type { EvalResult } from '../types';

interface Props {
  results: EvalResult[];
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

interface TooltipProps {
  result: EvalResult;
  index: number;
}

function Tooltip({ result, index }: TooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-gray-900 p-3 shadow-xl ring-1 ring-gray-700">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">Event #{index + 1}</span>
        <span className={`text-xs font-semibold ${STATUS_TEXT[result.status]}`}>
          {result.status}
        </span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-gray-300">{result.reason}</p>
      <div className="space-y-0.5 text-xs text-gray-500">
        <div>
          Window: {result.windowEvents.length} event
          {result.windowEvents.length !== 1 ? 's' : ''}
        </div>
        <div>
          Timeouts: {result.timeoutCount} ({result.timeoutRate.toFixed(1)}%)
        </div>
        {result.score !== null && <div>Avg latency: {result.score.toFixed(0)}ms</div>}
      </div>
    </div>
  );
}

export function StatusRibbon({ results }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (results.length === 0) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
        Add events to see the status ribbon
      </div>
    );
  }

  const counts = results.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { Good: 0, Unstable: 0, Bad: 0 },
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {results.map((result, i) => (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={`h-5 w-5 cursor-pointer rounded-full shadow-md transition-transform hover:scale-125 ${STATUS_COLOR[result.status]}`}
            />
            {hoveredIdx === i && <Tooltip result={result} index={i} />}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-gray-400">
        <span>
          <span className="font-semibold text-green-400">{counts.Good}</span> Good
        </span>
        <span>
          <span className="font-semibold text-yellow-400">{counts.Unstable}</span> Unstable
        </span>
        <span>
          <span className="font-semibold text-red-400">{counts.Bad}</span> Bad
        </span>
        <span className="ml-auto">{results.length} total</span>
      </div>
    </div>
  );
}
