import { CheckCircle, Clock, Trash2, WifiOff, Zap } from 'lucide-react';
import type { ResponseEvent, ScoreThresholds } from '../types';
import { makeBulk, makeDisconnect, makeSuccess, makeTimeout } from '../mock';

interface Props {
  events: ResponseEvent[];
  onChange: (events: ResponseEvent[]) => void;
  thresholds: ScoreThresholds;
}

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

function ActionButton({ onClick, icon, label, className = '' }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

function EventRow({
  event,
  index,
  onLatencyChange,
  onTypeToggle,
  onRemove,
}: {
  event: ResponseEvent;
  index: number;
  onLatencyChange: (id: string, v: number) => void;
  onTypeToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { type } = event;

  const rowBg =
    type === 'TIMEOUT' ? 'bg-red-950/40' :
    type === 'DISCONNECT' ? 'bg-orange-950/40' :
    'bg-gray-800/60';

  const badgeCls =
    type === 'TIMEOUT' ? 'bg-red-900/60 text-red-300 hover:bg-red-800/60' :
    type === 'DISCONNECT' ? 'bg-orange-900/60 text-orange-300 hover:bg-orange-800/60' :
    'bg-green-900/60 text-green-300 hover:bg-green-800/60';

  const badgeIcon =
    type === 'TIMEOUT' ? <Clock size={11} /> :
    type === 'DISCONNECT' ? <WifiOff size={11} /> :
    <CheckCircle size={11} />;

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${rowBg}`}>
      <span className="w-6 shrink-0 text-right text-xs text-gray-500">{index + 1}</span>

      <button
        onClick={() => onTypeToggle(event.id)}
        className={`flex w-28 shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${badgeCls}`}
      >
        {badgeIcon}
        {type}
      </button>

      <div className="flex flex-1 items-center gap-2">
        <input
          type="number"
          min={1}
          max={9999}
          value={event.latency}
          onChange={(e) => onLatencyChange(event.id, Math.max(1, Number(e.target.value)))}
          className="w-20 rounded bg-gray-700 px-2 py-0.5 font-mono text-xs text-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">ms</span>
      </div>

      <button
        onClick={() => onRemove(event.id)}
        className="shrink-0 rounded p-1 text-gray-600 transition-colors hover:bg-red-900/40 hover:text-red-400"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export function ScenarioEditor({ events, onChange, thresholds }: Props) {
  const append = (newEvents: ResponseEvent[]) => onChange([...events, ...newEvents]);

  const remove = (id: string) => onChange(events.filter((e) => e.id !== id));

  const updateLatency = (id: string, latency: number) =>
    onChange(events.map((e) => (e.id === id ? { ...e, latency } : e)));

  const toggleType = (id: string) =>
    onChange(
      events.map((e) => {
        if (e.id !== id) return e;
        const next =
          e.type === 'SUCCESS' ? 'TIMEOUT' :
          e.type === 'TIMEOUT' ? 'DISCONNECT' :
          'SUCCESS';
        return { ...e, type: next };
      }),
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => append([makeSuccess('good', thresholds)])}
          icon={<CheckCircle size={14} />}
          label="Success (Low)"
          className="bg-green-900/60 text-green-300 hover:bg-green-800/60"
        />
        <ActionButton
          onClick={() => append([makeSuccess('unstable', thresholds)])}
          icon={<Zap size={14} />}
          label="Success (Unstable)"
          className="bg-yellow-900/60 text-yellow-300 hover:bg-yellow-800/60"
        />
        <ActionButton
          onClick={() => append([makeSuccess('bad', thresholds)])}
          icon={<Zap size={14} />}
          label="Success (Bad)"
          className="bg-red-900/30 text-red-300 hover:bg-red-800/40"
        />
        <ActionButton
          onClick={() => append([makeTimeout()])}
          icon={<Clock size={14} />}
          label="Timeout"
          className="bg-red-900/60 text-red-300 hover:bg-red-800/60"
        />
        <ActionButton
          onClick={() => append([makeDisconnect()])}
          icon={<WifiOff size={14} />}
          label="Disconnect"
          className="bg-orange-900/60 text-orange-300 hover:bg-orange-800/60"
        />
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs text-gray-500">Bulk:</span>
        <ActionButton
          onClick={() => append(makeBulk('success', 10, thresholds))}
          icon={<CheckCircle size={13} />}
          label="10× Success"
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        />
        <ActionButton
          onClick={() => append(makeBulk('unstable', 5, thresholds))}
          icon={<Zap size={13} />}
          label="5× Unstable"
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        />
        <ActionButton
          onClick={() => append(makeBulk('bad', 5, thresholds))}
          icon={<Zap size={13} />}
          label="5× Bad"
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        />
        <ActionButton
          onClick={() => append(makeBulk('timeout', 5, thresholds))}
          icon={<Clock size={13} />}
          label="5× Timeout"
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        />
        <ActionButton
          onClick={() => append(makeBulk('disconnect', 5, thresholds))}
          icon={<WifiOff size={13} />}
          label="5× Disconnect"
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        />
        {events.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-red-900/40 hover:text-red-400"
          >
            <Trash2 size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
          No events — click buttons above to add
        </div>
      ) : (
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          {events.map((event, i) => (
            <EventRow
              key={event.id}
              event={event}
              index={i}
              onLatencyChange={updateLatency}
              onTypeToggle={toggleType}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
