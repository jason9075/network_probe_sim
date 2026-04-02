import type { Config, ResponseEvent } from './types';

interface ShareState {
  config: Config;
  events: ResponseEvent[];
}

export function encodeState(config: Config, events: ResponseEvent[]): string {
  return btoa(JSON.stringify({ config, events }));
}

export function decodeState(b64: string): ShareState | null {
  try {
    return JSON.parse(atob(b64)) as ShareState;
  } catch {
    return null;
  }
}

export function getSharedState(): ShareState | null {
  const s = new URLSearchParams(window.location.search).get('s');
  return s ? decodeState(s) : null;
}

export function buildShareUrl(config: Config, events: ResponseEvent[]): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('s', encodeState(config, events));
  return url.toString();
}
