# HSR Gacha Simulator — Cross-Platform

A cross-platform Honkai: Star Rail warp (gacha) simulator, rebuilt from the original [.NET+WPF project](https://github.com/Oereor/HSR-Gacha-Simulator) using **Vue 3 + TypeScript + Tailwind CSS**. Runs in any modern browser on Windows, macOS, and Linux.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript (strict mode) |
| Build | Vite |
| CSS | Tailwind CSS 4 |
| State | Pinia |
| Routing | Vue Router 4 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Install & Run

```bash
cd HSR-Gacha-Simulator-Cross-Platform
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
pnpm build
# Output in dist/ — deployable to any static hosting
```

## Project Structure

```
├── public/
│   ├── PoolConfigs/          # JSON pool data (copied from original)
│   ├── LanguageConfigs/      # Localization data (copied from original)
│   └── Icons/                # Path & Element PNG icons (copied from original)
├── src/
│   ├── types/                # TypeScript type definitions
│   ├── engine/               # Core gacha engine (pure logic)
│   ├── services/             # Localization, pool data, icon services
│   ├── stores/               # Pinia state management
│   ├── components/           # Vue UI components
│   ├── composables/          # Shared composition functions
│   ├── App.vue               # Root layout
│   └── main.ts               # App entry point
├── DEVELOPMENT_DOCUMENT.md   # Full development specification
└── README.md
```

## Features

- **Data-driven banner system** — all event banners defined in `EventPoolConfigs.json`
- **12+ banners** covering Ordinary, All Gold, Event Avatar, and Event Light Cone warps
- **Accurate HSR probability model** — 0.6% base 5★ rate, soft pity, hard pity, 50/50, 75/25
- **10-pull enforcement** — at least one 4★+ per 10-pull
- **Per-banner independent state** — pity counters, guarantees, and history
- **Full pull history** with rarity-colored display
- **Statistics panel** — rarity distribution per banner
- **Result card** with Path/Element icons and rarity border glow
- **Internationalization** — English and Chinese (简体中文) with live switching
- **Dark theme** — matches HSR's in-game aesthetic

## License

MIT
