import type { Config, EvalResult, ResponseEvent } from './types';

/**
 * Evaluates the network status for a given sliding window of events.
 * Priority: timeout hard-override > latency score mapping.
 */
export function evaluateStatus(window: ResponseEvent[], config: Config): EvalResult {
  const { windowSize, timeoutThreshold, scoreThresholds } = config;

  // Use the last M events (or fewer if partial window)
  const windowEvents = window.slice(-windowSize);
  const effectiveSize = windowEvents.length;

  if (effectiveSize === 0) {
    return {
      status: 'Good',
      windowEvents: [],
      timeoutCount: 0,
      timeoutRate: 0,
      score: null,
      reason: 'No events in window',
    };
  }

  const timeoutCount = windowEvents.filter((e) => e.type === 'TIMEOUT').length;
  // Rate compared against full M, not effectiveSize (partial window is lenient)
  const timeoutRate = (timeoutCount / windowSize) * 100;

  // Hard override: timeout rate >= P%
  if (timeoutRate >= timeoutThreshold) {
    return {
      status: 'Bad',
      windowEvents,
      timeoutCount,
      timeoutRate,
      score: null,
      reason: `Timeout rate ${timeoutRate.toFixed(1)}% ≥ ${timeoutThreshold}% threshold`,
    };
  }

  // Score = average latency of the window
  const score = windowEvents.reduce((sum, e) => sum + e.latency, 0) / effectiveSize;

  if (score < scoreThresholds.good) {
    return {
      status: 'Good',
      windowEvents,
      timeoutCount,
      timeoutRate,
      score,
      reason: `Avg latency ${score.toFixed(0)}ms < ${scoreThresholds.good}ms (Good)`,
    };
  }

  if (score < scoreThresholds.bad) {
    return {
      status: 'Unstable',
      windowEvents,
      timeoutCount,
      timeoutRate,
      score,
      reason: `Avg latency ${score.toFixed(0)}ms in [${scoreThresholds.good}, ${scoreThresholds.bad})ms (Unstable)`,
    };
  }

  return {
    status: 'Bad',
    windowEvents,
    timeoutCount,
    timeoutRate,
    score,
    reason: `Avg latency ${score.toFixed(0)}ms ≥ ${scoreThresholds.bad}ms (Bad)`,
  };
}

/**
 * Computes per-event evaluation across the entire event sequence.
 * Each event is evaluated using the window ending at that event (inclusive).
 */
export function evaluateSequence(events: ResponseEvent[], config: Config): EvalResult[] {
  return events.map((_, i) => evaluateStatus(events.slice(0, i + 1), config));
}
