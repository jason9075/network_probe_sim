import type { EventType, ResponseEvent } from './types';

let seq = 0;

function nextId(): string {
  return `evt-${++seq}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeSuccess(highLatency = false): ResponseEvent {
  return {
    id: nextId(),
    type: 'SUCCESS',
    latency: highLatency ? randInt(200, 500) : randInt(20, 100),
    timestamp: Date.now(),
  };
}

export function makeTimeout(): ResponseEvent {
  return {
    id: nextId(),
    type: 'TIMEOUT',
    latency: 1000,
    timestamp: Date.now(),
  };
}

export function makeEvent(type: EventType, latency?: number): ResponseEvent {
  const defaultLatency = type === 'TIMEOUT' ? 1000 : randInt(20, 100);
  return {
    id: nextId(),
    type,
    latency: latency ?? defaultLatency,
    timestamp: Date.now(),
  };
}

export function makeBulk(
  type: 'timeout' | 'success' | 'highLatency',
  count: number,
): ResponseEvent[] {
  return Array.from({ length: count }, () => {
    if (type === 'timeout') return makeTimeout();
    if (type === 'highLatency') return makeSuccess(true);
    return makeSuccess(false);
  });
}
