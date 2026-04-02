import { useRef, useState } from 'react';
import type { EvalResult, ResponseEvent } from '../types';

interface Props {
  results: EvalResult[];
  events: ResponseEvent[];
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
  if (s < 1) return `${Math.round(s * 1000)}ms`;
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return rem === 0 ? `${m}m` : `${m}m${rem}s`;
}

interface WindowRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TooltipProps {
  result: EvalResult;
  index: number;
  resolvedTime: number;
  event: ResponseEvent;
}

function Tooltip({ result, index, resolvedTime, event }: TooltipProps) {
  return (
    <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-3 shadow-xl ring-1 ring-gray-700">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">
          #{index + 1} · lapse {formatTime(resolvedTime)}
        </span>
        <span className={`text-xs font-semibold ${STATUS_TEXT[result.status]}`}>
          {result.status}
        </span>
      </div>
      <p className="mb-2 text-xs leading-relaxed text-gray-300">{result.reason}</p>
      <div className="space-y-0.5 font-mono text-xs text-gray-500">
        <div>latency {event.latency}ms</div>
        <div>window {result.windowEvents.length} events</div>
        <div>timeout {result.timeoutCount} · disconnect {result.disconnectCount}</div>
        <div>failure rate {result.failureRate.toFixed(1)}%</div>
        {result.score !== null && <div>avg {result.score.toFixed(0)} ms</div>}
      </div>
    </div>
  );
}

export function StatusRibbon({ results, events, interval }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [windowRect, setWindowRect] = useState<WindowRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const ledRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const resolvedTimes = events.map((e, i) => i * interval + e.latency / 1000);
  const totalDuration = resolvedTimes.at(-1) ?? 0;

  const computeWindowRect = (idx: number) => {
    if (!containerRef.current) return;
    const result = results[idx];
    const windowSize = result.windowEvents.length;
    const start = Math.max(0, idx - windowSize + 1);
    const containerBounds = containerRef.current.getBoundingClientRect();

    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    for (let j = start; j <= idx; j++) {
      const el = ledRefs.current.get(j);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      minLeft = Math.min(minLeft, b.left - containerBounds.left);
      minTop = Math.min(minTop, b.top - containerBounds.top);
      maxRight = Math.max(maxRight, b.right - containerBounds.left);
      maxBottom = Math.max(maxBottom, b.bottom - containerBounds.top);
    }

    if (minLeft !== Infinity) {
      const PAD = 4;
      setWindowRect({
        left: minLeft - PAD,
        top: minTop - PAD,
        width: maxRight - minLeft + PAD * 2,
        height: maxBottom - minTop + PAD * 2,
      });
    }
  };

  const handleMouseEnter = (idx: number) => {
    setHoveredIdx(idx);
    computeWindowRect(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setWindowRect(null);
  };

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

  const hoveredStatus = hoveredIdx !== null ? results[hoveredIdx].status : null;
  const windowBorderColor =
    hoveredStatus === 'Good' ? 'rgba(34,197,94,0.5)' :
    hoveredStatus === 'Unstable' ? 'rgba(250,204,21,0.5)' :
    hoveredStatus === 'Bad' ? 'rgba(239,68,68,0.5)' :
    'rgba(255,255,255,0.2)';

  return (
    <div className="flex flex-col gap-3">
      {/* LED row */}
      <div ref={containerRef} className="relative flex flex-wrap gap-x-1.5 gap-y-4">
        {/* Window highlight rect */}
        {windowRect && (
          <div
            className="pointer-events-none absolute rounded-lg transition-all duration-75"
            style={{
              left: windowRect.left,
              top: windowRect.top,
              width: windowRect.width,
              height: windowRect.height,
              border: `1.5px solid ${windowBorderColor}`,
              backgroundColor: windowBorderColor.replace('0.5)', '0.08)'),
            }}
          />
        )}

        {results.map((result, i) => {
          const showLabel = i % 2 === 0;
          return (
            <div
              key={i}
              ref={(el) => {
                if (el) ledRefs.current.set(i, el);
                else ledRefs.current.delete(i);
              }}
              className="relative flex flex-col items-center gap-0.5"
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`h-5 w-5 cursor-pointer rounded-full shadow-md transition-transform hover:scale-125 ${STATUS_COLOR[result.status]}`}
              />
              <span className="h-3 font-mono text-[9px] leading-none text-gray-500">
                {showLabel ? formatTime(resolvedTimes[i]) : ''}
              </span>
              {hoveredIdx === i && (
                <Tooltip
                  result={result}
                  index={i}
                  resolvedTime={resolvedTimes[i]}
                  event={events[i]}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span><span className="font-semibold text-green-400">{counts.Good}</span> Good</span>
        <span><span className="font-semibold text-yellow-400">{counts.Unstable}</span> Unstable</span>
        <span><span className="font-semibold text-red-400">{counts.Bad}</span> Bad</span>
        <span className="ml-auto font-mono text-gray-500">
          {results.length} events · {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}
