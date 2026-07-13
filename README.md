# HSR Gacha Simulator — Cross-Platform

A cross-platform Honkai: Star Rail warp (gacha) simulator, rebuilt from the original [.NET+WPF project](https://github.com/Oereor/HSR-Gacha-Simulator) using **Vue 3 + TypeScript + Tailwind CSS**. Runs in any modern browser on Windows, macOS, and Linux.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript (strict mode) |
| Build | Vite 7 |
| CSS | Tailwind CSS 4 |
| State | Pinia 3 |
| Routing | Vue Router 4 (hash mode) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm (ships with Node.js)

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
# Output in dist/ — deployable to any static hosting
```

## Project Structure

```
├── public/
│   ├── PoolConfigs/          # JSON pool data
│   ├── LanguageConfigs/      # Localization data (TextMap.json)
│   └── Icons/                # Path & Element PNG icons
├── src/
│   ├── types/                # TypeScript type definitions & DTOs
│   ├── engine/               # Core gacha engine (pure logic, no DOM)
│   ├── services/             # Localization, pool data, icon services
│   ├── stores/               # Pinia stores (gacha, customPool, pityStats, resultCard)
│   ├── composables/          # Shared composables (useAppInit, useRarityColors)
│   ├── utils/                # Formatters (Path, Element display)
│   ├── views/                # Route-level page components
│   │   ├── SimulatorView.vue     # Main simulator page
│   │   └── CustomPoolPage.vue    # Custom pool creator & manager
│   ├── components/           # Reusable Vue UI components
│   │   ├── BannerStrip.vue / BannerPill.vue  # Banner selection carousel
│   │   ├── PullControls.vue                  # Warp buttons & pity display
│   │   ├── StatisticsPanel.vue               # Pull statistics & rates
│   │   ├── ResultCard.vue / ResultNavigator.vue  # Latest pull result
│   │   ├── HistoryTable.vue                  # Full pull history
│   │   ├── AppStatusBar.vue                  # Status bar & language selector
│   │   ├── ConfirmDialog.vue                 # Reusable confirmation modal
│   │   ├── SearchableSelect.vue              # Combo box with type-to-search
│   │   ├── PoolTypeSelector.vue              # Avatar / Light Cone radio group
│   │   ├── PurpleItemsTransfer.vue           # Transfer list for purple items
│   │   ├── CustomPoolForm.vue                # Custom pool creation form
│   │   └── CustomPoolList.vue                # Existing custom pools display
│   ├── router/               # Vue Router config (/, /custom)
│   ├── App.vue               # Root shell (<router-view />)
│   └── main.ts               # App entry point
└── README.md
```

## Features

- **Data-driven banner system** — built-in event banners defined in `EventPoolConfigs.json`; enable/disable via `enabled` flag
- **Custom event pools** — create your own banners via the GUI at `/custom`: pick pool type, rate-up gold item, 3 rate-up purple items, optional custom title. Persisted to localStorage (max 10)
- **10+ built-in banners** covering Ordinary, All Gold (Expanded Pool), Event Avatar, and Event Light Cone warps
- **Accurate HSR probability model** — 0.6% base 5★ rate, soft pity (ramps after pull 73 for avatars / 65 for LCs), hard pity, 50/50 (avatar) / 75/25 (light cone)
- **10-pull enforcement** — at least one 4★+ guaranteed per 10-pull
- **Per-banner independent state** — separate pity counters, guarantee flags, and pull history for each banner
- **Full pull history** with rarity-colored display and result card navigation
- **Statistics panel** — rarity distribution, 50/50 loss tracking, average pulls per 5★ and per rate-up
- **Result card** with Path/Element icons and rarity border glow
- **Internationalization** — English and Chinese (简体中文) with live language switching
- **Dark theme** — matches HSR's in-game aesthetic

## License

MIT
