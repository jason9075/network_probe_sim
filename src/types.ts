export type EventType = 'SUCCESS' | 'TIMEOUT';

export type Status = 'Good' | 'Unstable' | 'Bad';

export interface ResponseEvent {
  id: string;
  type: EventType;
  latency: number;
  timestamp: number;
}

export interface ScoreThresholds {
  good: number;    // S < good → Good
  bad: number;     // S >= bad → Bad, else Unstable
}

export interface Config {
  windowSize: number;          // M
  timeoutThreshold: number;    // P (0–100)
  scoreThresholds: ScoreThresholds;
  interval: number;            // N (seconds between requests)
}

export interface EvalResult {
  status: Status;
  windowEvents: ResponseEvent[];
  timeoutCount: number;
  timeoutRate: number;
  score: number | null;
  reason: string;
}
