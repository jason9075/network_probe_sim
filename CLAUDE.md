# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Network Probe Logic Simulator** — A pure-frontend React/TypeScript tool for testing and visualizing network probe status evaluation logic via simulated (not real) network events.

## Tech Stack

- **Framework**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide-React
- **Package Manager**: `bun`
- **Dev Environment**: `nix develop` via `flake.nix`

## Build & Development Commands

These should be encapsulated in `justfile` targets:

```bash
just dev       # Start Vite dev server
just build     # Production build
just test      # Run bun test
just lint      # Lint/format with biome or eslint
```

Direct commands (before justfile exists):

```bash
bun install
bun run dev
bun run build
bun test
```

## Core Architecture

### Evaluation Logic

The central pure function is `evaluateStatus(window: ResponseEvent[], config: Config): StatusResult`.

**Pipeline (priority order):**
1. **Hard Override**: if `(TIMEOUT count / M) >= P%` → status `Bad`
2. **Score S**: average latency of the window
3. **Threshold Mapping**: `S < T1` → Good, `T1 ≤ S < T2` → Unstable, `S ≥ T2` → Bad

**Edge case**: when event count < M, evaluate with the partial window available.

### Data Structures

```ts
type ResponseEvent = { id: string; type: 'SUCCESS' | 'TIMEOUT'; latency: number; timestamp: number };

type Config = {
  windowSize: number;        // M
  timeoutThreshold: number;  // P (percentage, 0–100)
  scoreThresholds: { good: number; bad: number }; // T1, T2
};
```

### State Management

- `useState` holds the event sequence array.
- `useMemo` derives the per-event status ribbon from the sequence + config — no manual recalculation triggers needed.

### UI Panels

| Panel | Responsibility |
|---|---|
| Configuration (sidebar) | Sliders/inputs for M, P, T1, T2 |
| Scenario Editor | Add/remove events; bulk actions (5× Timeout, 10× Success); inline latency editing |
| Status Ribbon | Horizontal LED sequence; each LED colored by status at that point; hover tooltip shows logic trace |

### Mock Data

No `fetch` calls anywhere. Latency is generated locally:
- `SUCCESS (normal)`: 20–100 ms
- `SUCCESS (high latency)`: 200–500 ms
- `TIMEOUT`: fixed high latency (e.g., 1000 ms)
