import type { EventType, ResponseEvent, ScoreThresholds } from './types';

let seq = 0;

function nextId(): string {
  return `evt-${++seq}`;
}

function randAround(mid: number, variance: number, lo: number, hi: number): number {
  const v = Math.floor(variance);
  return Math.min(hi, Math.max(lo, Math.round(mid + (Math.random() * 2 - 1) * v)));
}

function goodLatency(): number {
  return 100;
}

/** Unstable zone midpoint: (T₁ + T₂) / 2, variance ±20% of zone width */
function unstableLatency(t: ScoreThresholds): number {
  const mid = (t.good + t.bad) / 2;
  const width = t.bad - t.good;
  return randAround(mid, width * 0.2, t.good, t.bad - 1);
}

/** Bad zone midpoint: T₂ × 1.5, variance ±20% of T₂ */
function badLatency(t: ScoreThresholds): number {
  const mid = t.bad * 1.5;
  return randAround(mid, t.bad * 0.2, t.bad, t.bad * 2);
}

export function makeSuccess(zone: 'good' | 'unstable' | 'bad', thresholds: ScoreThresholds): ResponseEvent {
  const latency =
    zone === 'unstable' ? unstableLatency(thresholds) :
    zone === 'bad' ? badLatency(thresholds) :
    goodLatency();
  return {
    id: nextId(),
    type: 'SUCCESS',
    latency,
    timestamp: Date.now(),
  };
}

export function makeTimeout(): ResponseEvent {
  return {
    id: nextId(),
    type: 'TIMEOUT',
    latency: 6000,
    timestamp: Date.now(),
  };
}

export function makeDisconnect(): ResponseEvent {
  return {
    id: nextId(),
    type: 'DISCONNECT',
    latency: 0,
    timestamp: Date.now(),
  };
}

export function makeEvent(type: EventType, thresholds: ScoreThresholds, latency?: number): ResponseEvent {
  const defaultLatency = type === 'TIMEOUT' ? 6000 : goodLatency();
  return {
    id: nextId(),
    type,
    latency: latency ?? defaultLatency,
    timestamp: Date.now(),
  };
}

export function makeBulk(
  type: 'timeout' | 'disconnect' | 'success' | 'unstable' | 'bad',
  count: number,
  thresholds: ScoreThresholds,
): ResponseEvent[] {
  return Array.from({ length: count }, () => {
    if (type === 'timeout') return makeTimeout();
    if (type === 'disconnect') return makeDisconnect();
    if (type === 'unstable') return makeSuccess('unstable', thresholds);
    if (type === 'bad') return makeSuccess('bad', thresholds);
    return makeSuccess('good', thresholds);
  });
}
