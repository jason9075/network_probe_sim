import { useRef, useState } from 'react';
import { Clock, Ruler, WifiOff } from 'lucide-react';
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

function formatDiff(s: number): string {
  const abs = Math.abs(s);
  if (abs < 1) return `${Math.round(abs * 1000)}ms`;
  if (abs < 60) return `${abs % 1 === 0 ? abs : abs.toFixed(2)}s`;
  const m = Math.floor(abs / 60);
  const rem = +(abs % 60).toFixed(2);
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
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

  // Diff tool state
  const [diffMode, setDiffMode] = useState(false);
  const [diffStart, setDiffStart] = useState<number | null>(null);
  const [diffEnd, setDiffEnd] = useState<number | null>(null);
  const [diffRect, setDiffRect] = useState<WindowRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const ledRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const resolvedTimes = events.map((e, i) => i * interval + e.latency / 1000);
  const totalDuration = resolvedTimes.at(-1) ?? 0;

  const getBoundingRect = (from: number, to: number): WindowRect | null => {
    if (!containerRef.current) return null;
    const containerBounds = containerRef.current.getBoundingClientRect();
    const [start, end] = from <= to ? [from, to] : [to, from];
    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    for (let j = start; j <= end; j++) {
      const el = ledRefs.current.get(j);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      minLeft = Math.min(minLeft, b.left - containerBounds.left);
      minTop = Math.min(minTop, b.top - containerBounds.top);
      maxRight = Math.max(maxRight, b.right - containerBounds.left);
      maxBottom = Math.max(maxBottom, b.bottom - containerBounds.top);
    }
    if (minLeft === Infinity) return null;
    const PAD = 4;
    return { left: minLeft - PAD, top: minTop - PAD, width: maxRight - minLeft + PAD * 2, height: maxBottom - minTop + PAD * 2 };
  };

  const computeWindowRect = (idx: number) => {
    const result = results[idx];
    const windowSize = result.windowEvents.length;
    const start = Math.max(0, idx - windowSize + 1);
    const rect = getBoundingRect(start, idx);
    setWindowRect(rect);
  };

  const handleMouseEnter = (idx: number) => {
    if (diffMode) return;
    setHoveredIdx(idx);
    computeWindowRect(idx);
  };

  const handleMouseLeave = () => {
    if (diffMode) return;
    setHoveredIdx(null);
    setWindowRect(null);
  };

  const handleLedClick = (idx: number) => {
    if (!diffMode) return;

    if (diffStart === null) {
      setDiffStart(idx);
      setDiffRect(getBoundingRect(idx, idx));
    } else if (diffEnd === null && idx !== diffStart) {
      setDiffEnd(idx);
      setDiffRect(getBoundingRect(diffStart, idx));
    }
  };

  const toggleDiffMode = () => {
    if (diffMode) {
      // Clear
      setDiffMode(false);
      setDiffStart(null);
      setDiffEnd(null);
      setDiffRect(null);
    } else {
      setDiffMode(true);
      setHoveredIdx(null);
      setWindowRect(null);
    }
  };

  // Diff time value
  const diffSeconds =
    diffStart !== null && diffEnd !== null
      ? Math.abs(resolvedTimes[diffEnd] - resolvedTimes[diffStart])
      : null;

  const diffStep =
    diffStart !== null && diffEnd !== null
      ? Math.abs(diffEnd - diffStart)
      : null;

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

  if (results.length === 0) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
        Add events to see the status ribbon
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDiffMode}
          title={diffMode ? 'Clear diff tool' : 'Measure time between two events'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            diffMode
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Ruler size={13} />
          {diffMode ? 'Clear' : 'Measure'}
        </button>

        {/* Diff mode instructions / result */}
        {diffMode && (
          <span className="font-mono text-xs text-gray-400">
            {diffStart === null
              ? 'Click first event…'
              : diffEnd === null
                ? `#${diffStart + 1} selected — click second event`
                : (
                  <span className="text-blue-300">
                    #{Math.min(diffStart, diffEnd) + 1} → #{Math.max(diffStart, diffEnd) + 1}
                    {' · '}
                    <span className="text-white">{formatDiff(diffSeconds!)}</span>
                    {' · '}
                    {diffStep} event{diffStep !== 1 ? 's' : ''}
                  </span>
                )
            }
          </span>
        )}
      </div>

      {/* LED row */}
      <div ref={containerRef} className="relative flex flex-wrap gap-x-1.5 gap-y-4">
        {/* Window highlight rect */}
        {windowRect && !diffMode && (
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

        {/* Diff range rect */}
        {diffRect && diffMode && (
          <div
            className="pointer-events-none absolute rounded-lg"
            style={{
              left: diffRect.left,
              top: diffRect.top,
              width: diffRect.width,
              height: diffRect.height,
              border: '1.5px solid rgba(96,165,250,0.7)',
              backgroundColor: 'rgba(96,165,250,0.08)',
            }}
          />
        )}

        {results.map((result, i) => {
          const showLabel = i % 2 === 0;

          // Diff selection state for this LED
          const isDiffStart = diffStart === i;
          const isDiffEnd = diffEnd === i;
          const isDiffSelected = isDiffStart || isDiffEnd;
          const lo = diffStart !== null && diffEnd !== null ? Math.min(diffStart, diffEnd) : -1;
          const hi = diffStart !== null && diffEnd !== null ? Math.max(diffStart, diffEnd) : -1;
          const isDiffRange = lo !== -1 && i > lo && i < hi;

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
              onClick={() => handleLedClick(i)}
            >
              <div
                className={[
                  'h-5 w-5 rounded-full shadow-md transition-transform flex items-center justify-center',
                  STATUS_COLOR[result.status],
                  diffMode ? 'cursor-crosshair' : 'cursor-pointer hover:scale-125',
                  isDiffSelected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800 scale-125' : '',
                  isDiffRange ? 'opacity-60' : '',
                ].join(' ')}
              >
                {events[i].type === 'TIMEOUT' && (
                  <Clock size={10} className="text-white/80" />
                )}
                {events[i].type === 'DISCONNECT' && (
                  <WifiOff size={10} className="text-white/80" />
                )}
              </div>
              <span className="h-3 font-mono text-[9px] leading-none text-gray-500">
                {showLabel ? formatTime(resolvedTimes[i]) : ''}
              </span>
              {hoveredIdx === i && !diffMode && (
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
