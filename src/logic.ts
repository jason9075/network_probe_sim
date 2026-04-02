import type { Config, EvalResult, ResponseEvent } from './types';

/**
 * Evaluates the network status for a given sliding window of events.
 * Priority: failure hard-override (TIMEOUT + DISCONNECT) > latency score mapping.
 */
export function evaluateStatus(window: ResponseEvent[], config: Config): EvalResult {
  const { windowSize, timeoutThreshold, scoreThresholds } = config;

  const windowEvents = window.slice(-windowSize);
  const effectiveSize = windowEvents.length;

  if (effectiveSize === 0) {
    return {
      status: 'Good',
      windowEvents: [],
      timeoutCount: 0,
      disconnectCount: 0,
      failureRate: 0,
      score: null,
      reason: 'No events in window',
    };
  }

  const timeoutCount = windowEvents.filter((e) => e.type === 'TIMEOUT').length;
  const disconnectCount = windowEvents.filter((e) => e.type === 'DISCONNECT').length;
  // Rate compared against full M (partial window is lenient)
  const failureRate = ((timeoutCount + disconnectCount) / windowSize) * 100;

  // Hard override: combined failure rate >= P%
  if (failureRate >= timeoutThreshold) {
    const parts = [];
    if (timeoutCount > 0) parts.push(`${timeoutCount} timeout`);
    if (disconnectCount > 0) parts.push(`${disconnectCount} disconnect`);
    return {
      status: 'Bad',
      windowEvents,
      timeoutCount,
      disconnectCount,
      failureRate,
      score: null,
      reason: `Failure rate ${failureRate.toFixed(1)}% ≥ ${timeoutThreshold}% (${parts.join(', ')})`,
    };
  }

  // Score = average latency of the window
  const score = windowEvents.reduce((sum, e) => sum + e.latency, 0) / effectiveSize;

  if (score < scoreThresholds.good) {
    return {
      status: 'Good',
      windowEvents,
      timeoutCount,
      disconnectCount,
      failureRate,
      score,
      reason: `Avg latency ${score.toFixed(0)}ms < ${scoreThresholds.good}ms (Good)`,
    };
  }

  if (score < scoreThresholds.bad) {
    return {
      status: 'Unstable',
      windowEvents,
      timeoutCount,
      disconnectCount,
      failureRate,
      score,
      reason: `Avg latency ${score.toFixed(0)}ms in [${scoreThresholds.good}, ${scoreThresholds.bad})ms (Unstable)`,
    };
  }

  return {
    status: 'Bad',
    windowEvents,
    timeoutCount,
    disconnectCount,
    failureRate,
    score,
    reason: `Avg latency ${score.toFixed(0)}ms ≥ ${scoreThresholds.bad}ms (Bad)`,
  };
}

export function evaluateSequence(events: ResponseEvent[], config: Config): EvalResult[] {
  return events.map((_, i) => evaluateStatus(events.slice(0, i + 1), config));
}
