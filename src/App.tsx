import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import type { Config, ResponseEvent } from './types';
import { evaluateSequence } from './logic';
import { ConfigPanel } from './components/ConfigPanel';
import { ScenarioEditor } from './components/ScenarioEditor';
import { StatusRibbon } from './components/StatusRibbon';

const DEFAULT_CONFIG: Config = {
  windowSize: 15,
  timeoutThreshold: 30,
  scoreThresholds: { good: 120, bad: 300 },
};

export default function App() {
  const [events, setEvents] = useState<ResponseEvent[]>([]);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

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
            <StatusRibbon results={results} />
          </section>

          {/* Scenario Editor */}
          <section className="rounded-xl bg-gray-800 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Scenario Editor
            </h2>
            <ScenarioEditor events={events} onChange={setEvents} />
          </section>
        </main>
      </div>
    </div>
  );
}
