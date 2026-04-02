# Network Probe Simulator

An interactive browser-based tool for testing and visualizing network probe status evaluation logic. No real network requests are made — everything is driven by a user-defined sequence of simulated response events.

## Overview

The simulator evaluates the health of a network based on a **sliding window** of recent response events. Each event is classified as `SUCCESS`, `TIMEOUT`, or `DISCONNECT`. The evaluation pipeline runs in priority order:

1. **Failure override** — if `(TIMEOUT + DISCONNECT) / M ≥ P%`, status is immediately **Bad**
2. **Latency score** — compute average latency `S` of the window
3. **Threshold mapping**:
   - `S < T₁` → **Good**
   - `T₁ ≤ S < T₂` → **Unstable**
   - `S ≥ T₂` → **Bad**

All status calculations are **pure functions** and update reactively whenever the event sequence or any configuration parameter changes.

## Features

### Configuration Panel
- **Probe Interval (N)** — simulated time between requests (1–60 s)
- **Window Size (M)** — number of recent events to evaluate (1–20, default 5)
- **Failure Threshold (P)** — percentage of failures that triggers an immediate Bad status (default 40%)
- **Latency Thresholds (T₁ / T₂)** — dual-handle range slider with live color zones (Good / Unstable / Bad), up to 6 000 ms

### Status Ribbon
- Evenly-spaced LED dots colored **green** (Good), **yellow** (Unstable), or **red** (Bad)
- `TIMEOUT` events show a **clock icon** inside the dot; `DISCONNECT` events show a **Wi-Fi off icon**
- **Lapse labels** below every other dot show the resolved time (`send time + latency`)
- **Window frame** — hovering a dot draws a rounded rectangle around the M events that contributed to that evaluation, colored to match the status
- **Measure tool** — click the ruler button, then select two dots to calculate the time difference and event span between them

### Scenario Editor
- **Single event buttons**: Success (Low · 100 ms), Success (Unstable), Success (Bad), Timeout (6 000 ms), Disconnect (0 ms)
- **Bulk actions**: 10× Success, 5× Unstable, 5× Bad, 5× Timeout, 5× Disconnect
- **Inline editing**: toggle event type (SUCCESS → TIMEOUT → DISCONNECT → SUCCESS) and edit latency directly in the list
- **Preset scenarios**:
  | Preset | Description |
  |---|---|
  | Timeout Storm | 10 normal → 3 timeouts → 10 normal |
  | Disconnect Wave | 10 normal → 3 disconnects → 10 normal |
  | Scattered Degradation | 8 normal → alternating Unstable/Bad × 8 → 8 normal |
  | Reconnect After Outage | 10 disconnects → 20 normal |
- **Persistence** — the event sequence is saved to `localStorage` and restored on reload
- **Share** — encodes the current config and event sequence into a `?s=` URL parameter; the generated link fully restores the session for anyone who opens it

## Tech Stack

- **React 19** + **TypeScript** via **Vite**
- **Tailwind CSS v4**
- **Lucide React** for icons
- **Bun** as package manager and test runner
- **Nix flake** for reproducible dev environment

## Getting Started

### Prerequisites

Enter the dev shell (requires [Nix](https://nixos.org/) with flakes enabled):

```sh
nix develop
# or, with direnv:
direnv allow
```

### Install dependencies

```sh
bun install
```

### Run

```sh
bun run dev       # start Vite dev server
bun run build     # production build
bun run preview   # preview production build
```

Or via `just`:

```sh
just dev
just build
```

## Project Structure

```
src/
├── types.ts          # ResponseEvent, Config, EvalResult types
├── logic.ts          # evaluateStatus() and evaluateSequence() — pure functions
├── mock.ts           # Event generators and preset scenario definitions
├── share.ts          # URL state encode/decode utilities
└── components/
    ├── ConfigPanel.tsx     # Left sidebar: all configuration sliders
    ├── StatusRibbon.tsx    # LED ribbon, window frame, measure tool
    └── ScenarioEditor.tsx  # Event list, action bar, bulk actions, presets
```

## License

MIT © [Jason Kuan](https://github.com/jason9075)
