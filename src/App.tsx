import { useEffect, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import type { Config, ResponseEvent } from './types';
import { evaluateSequence } from './logic';
import { ConfigPanel } from './components/ConfigPanel';
import { ScenarioEditor } from './components/ScenarioEditor';
import { StatusRibbon } from './components/StatusRibbon';

const DEFAULT_CONFIG: Config = {
  windowSize: 5,
  timeoutThreshold: 40,
  scoreThresholds: { good: 2000, bad: 3000 },
  interval: 5,
};

const STORAGE_KEY = 'nps:events';

function loadEvents(): ResponseEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResponseEvent[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [events, setEventsState] = useState<ResponseEvent[]>(loadEvents);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const setEvents = (next: ResponseEvent[]) => {
    setEventsState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Sync on mount in case another tab changed storage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEventsState(loadEvents());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const results = useMemo(() => evaluateSequence(events, config), [events, config]);

  const latestStatus = results.at(-1)?.status ?? null;
  const latestStatusColor = latestStatus === 'Good'
    ? 'text-green-400'
    : latestStatus === 'Unstable'
      ? 'text-yellow-400'
      : latestStatus === 'Bad'
        ? 'text-red-400'
        : 'text-gray-500';

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-800 px-6 py-4">
        <Activity className="text-blue-400" size={22} />
        <h1 className="text-lg font-semibold">Network Probe Simulator</h1>
        {latestStatus && (
          <span className={`ml-auto text-sm font-medium ${latestStatusColor}`}>
            Current: {latestStatus}
          </span>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-6 p-6">
        <ConfigPanel config={config} onChange={setConfig} />

        <main className="flex flex-1 flex-col gap-6">
          {/* Status Ribbon */}
          <section className="rounded-xl bg-gray-800 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Status Ribbon
            </h2>
            <StatusRibbon results={results} events={events} interval={config.interval} />
          </section>

          {/* Scenario Editor */}
          <section className="rounded-xl bg-gray-800 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Scenario Editor
            </h2>
            <ScenarioEditor events={events} onChange={setEvents} thresholds={config.scoreThresholds} />
          </section>
        </main>
      </div>
    </div>
  );
}
