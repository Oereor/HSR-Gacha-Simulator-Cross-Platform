# HSR Gacha Simulator — Cross-Platform Development Document

> **Purpose:** This document is the complete specification for re-implementing the
> HSR-Gacha-Simulator (originally a .NET+WPF Windows-only application) as a
> cross-platform web application. Every section is written so that another coder
> agent can implement the project without ambiguity.

---

## Table of Contents

1. [Tech Stack Decision](#1-tech-stack-decision)
2. [Project Structure](#2-project-structure)
3. [Data Model — TypeScript Type Definitions](#3-data-model--typescript-type-definitions)
4. [Core Gacha Engine (`GachaSystem`)](#4-core-gacha-engine-gachasystem)
5. [Service Layer](#5-service-layer)
6. [State Management — Pinia Store](#6-state-management--pinia-store)
7. [Component Tree & UI Specification](#7-component-tree--ui-specification)
8. [Routing](#8-routing)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Dark Theme & Tailwind Configuration](#10-dark-theme--tailwind-configuration)
11. [Static Assets](#11-static-assets)
12. [Build, Run & Packaging](#12-build-run--packaging)
13. [Step-by-Step Implementation Order](#13-step-by-step-implementation-order)
14. [Verification Checklist](#14-verification-checklist)

---

## 1. Tech Stack Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Vue 3 (Composition API + `<script setup lang="ts">`) | Reactive system (`ref`/`reactive`/`computed`) maps directly to the original MVVM `INotifyPropertyChanged` pattern. Single-page layout is a natural fit. |
| **Language** | TypeScript (strict mode) | Provides enum + type safety equivalent to the original C# enums and classes. |
| **Build tool** | Vite 6 | Fast HMR, native ESM, out-of-the-box TS support. |
| **CSS** | Tailwind CSS 4 | Utility-first; the dark HSR theme can be expressed via `tailwind.config` tokens without heavy CSS frameworks. |
| **State** | Pinia | Vue's official state management; one store per conceptual domain (gacha, localization). |
| **Routing** | Vue Router 4 | Not strictly necessary (single-view app), but included for future extensibility. |
| **Desktop shell** | Tauri 2 (optional, phase 2) | Wraps the web app in a native window on Windows/macOS/Linux. Not required for phase 1. |
| **Package manager** | pnpm | Fast, disk-efficient. |
| **Lint/format** | ESLint + Prettier | Standard Vue/TS toolchain. |

**Why NOT alternatives:**

- **React:** More boilerplate for two-way binding; Vue's `computed` + `watch` more closely mirrors the original `OnPropertyChanged` / `SetProperty` pattern.
- **Angular:** Too heavy for a single-page simulator.
- **Svelte:** Smaller ecosystem, fewer coder agents are proficient.
- **Electron:** Heavier than Tauri; Tauri is preferred for phase-2 desktop packaging.

**Runtime requirement:** The app runs entirely in the browser. No backend server is needed — all gacha logic executes client-side. JSON config files are loaded via `fetch()` at startup from the `/public` directory.

---

## 2. Project Structure

```
HSR-Gacha-Simulator-Cross-Platform/
├── public/
│   ├── PoolConfigs/                  # ← Copied verbatim from original
│   │   ├── OrdinaryGoldPoolConfig.json
│   │   ├── OrdinaryPurplePoolConfig.json
│   │   ├── CelestialGoldPoolConfig.json
│   │   ├── BluePoolConfig.json
│   │   ├── AllGoldPoolConfig.json
│   │   └── EventPoolConfigs.json
│   ├── LanguageConfigs/              # ← Copied verbatim from original
│   │   ├── TextMap.json
│   │   ├── BlueItemsTextmap.json
│   │   ├── GoldItemsTextmap.json
│   │   ├── PurpleItemsTextmap.json
│   │   └── MetaDataTextmap.json
│   └── Icons/                        # ← Copied verbatim from original
│       ├── Path_Destruction.png
│       ├── Path_TheHunt.png
│       ├── Path_Erudition.png
│       ├── Path_Harmony.png
│       ├── Path_Nihility.png
│       ├── Path_Preservation.png
│       ├── Path_Abundance.png
│       ├── Path_Remembrance.png
│       ├── Path_Elation.png
│       ├── Element_Physical.png
│       ├── Element_Fire.png
│       ├── Element_Ice.png
│       ├── Element_Lightning.png
│       ├── Element_Wind.png
│       ├── Element_Quantum.png
│       └── Element_Imaginary.png
├── src/
│   ├── types/                        # TypeScript equivalents of C# enums + classes
│   │   └── index.ts                  # ItemType, ItemRarity, PathType, ElementType,
│   │                                   GachaType, ItemData, EventPoolConfigEntry
│   ├── engine/                       # Core gacha engine — MUST be semantically identical to GachaSystem.cs
│   │   └── GachaSystem.ts            # Pure logic, zero UI dependency
│   ├── services/                     # Service layer
│   │   ├── useLocalizationService.ts # LocalizationService equivalent
│   │   ├── usePoolDataService.ts     # PoolDataService equivalent
│   │   └── useIconService.ts         # IconService equivalent
│   ├── stores/                       # Pinia stores (replace ViewModels)
│   │   ├── useGachaStore.ts          # MainViewModel + BannerViewModel + HistoryPanelViewModel
│   │   ├── useResultCardStore.ts     # ResultCardViewModel
│   │   └── usePityStatsStore.ts      # PityStatisticsViewModel
│   ├── components/                   # Vue components
│   │   ├── AppStatusBar.vue          # Bottom status bar + language selector
│   │   ├── BannerStrip.vue           # Horizontally-scrollable pill banner selector
│   │   ├── BannerPill.vue            # Single banner pill button
│   │   ├── PullControls.vue          # Warp ×1, Warp ×10, Reset buttons + pity display
│   │   ├── StatisticsPanel.vue       # Total pulls, rarity breakdown, missed stats
│   │   ├── ResultCard.vue            # Latest pull result with icons + border glow
│   │   ├── ResultNavigator.vue       # Prev/Next navigation for history
│   │   ├── HistoryTable.vue          # Pull history list (scrollable table)
│   │   └── ConfirmDialog.vue         # Reusable confirmation modal (for reset)
│   ├── composables/                  # Shared composition functions
│   │   └── useRarityColors.ts        # Rarity → color mapping (replaces RarityConverters)
│   ├── App.vue                       # Root layout
│   ├── main.ts                       # Entry point: createApp, install Pinia, etc.
│   └── style.css                     # Tailwind directives + minimal global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts                # Tailwind 4 config (if using v4) or postcss.config.js
└── README.md
```

**Important:** The `public/` directory is served statically. JSON config files must be fetchable at runtime via paths like `/PoolConfigs/OrdinaryGoldPoolConfig.json`. The original config files are copied **unchanged** — no format conversion needed.

---

## 3. Data Model — TypeScript Type Definitions

Create `src/types/index.ts` with the exact contents below. Every enum member and property maps 1:1 to the C# originals in `ItemData.cs` and `EventPoolConfigEntry.cs`.

```typescript
// ── Enums (mirror C# exactly) ──────────────────────────────────────

export enum ItemType {
  Unknown = 0,
  Avatar = 1,
  LightCone = 2,
}

export enum ItemRarity {
  Unknown = 0,
  Blue = 1,
  Purple = 2,
  Gold = 3,
}

export enum PathType {
  Unknown = 0,
  Destruction = 1,
  TheHunt = 2,
  Erudition = 3,
  Harmony = 4,
  Nihility = 5,
  Preservation = 6,
  Abundance = 7,
  Remembrance = 8,
  Elation = 9,
}

export enum ElementType {
  Unknown = 0,
  Physical = 1,
  Fire = 2,
  Ice = 3,
  Lightning = 4,
  Wind = 5,
  Quantum = 6,
  Imaginary = 7,
}

export enum GachaType {
  Ordinary = 0,
  EventAvatar = 1,
  EventLightCone = 2,
}

// ── Data classes ───────────────────────────────────────────────────

/**
 * Represents a single gacha item (character or light cone).
 * Mirrors HSR_Gacha_Simulator.Models.ItemData exactly.
 */
export interface ItemData {
  /** The type of the item: Avatar or LightCone. */
  Type: ItemType;
  /** Rarity tier: Blue (3★), Purple (4★), or Gold (5★). */
  Rarity: ItemRarity;
  /** English display name, used as the stable lookup key for localization. */
  Name: string;
  /** Combat path (Destruction, Harmony, etc.). Always set for Avatars; may be set for Light Cones. */
  Path: PathType;
  /**
   * Combat element (Physical, Fire, etc.).
   * Applicable ONLY to Avatars. MUST be ElementType.Unknown for Light Cones.
   */
  ElementType: ElementType;
}

/**
 * Parsed representation of one enabled event banner from EventPoolConfigs.json.
 * Mirrors HSR_Gacha_Simulator.Models.EventPoolConfigEntry exactly.
 */
export interface EventPoolConfigEntry {
  /** Stable key, e.g. "cyrene_avatar". Used for localization lookup via `ui.banner.<key>`. */
  BannerKey: string;
  /** English display title, e.g. "Cyrene (Avatar)". Fallback when localization key is missing. */
  BannerTitle: string;
  /** All items in this banner's pool (gold + purple, avatar + light cone). */
  Items: ItemData[];
}

// ── DTO types (match the JSON schema on disk) ──────────────────────

/** Shape of a single item in a pool-config JSON file. */
export interface ItemDataDto {
  type?: string;
  rarity?: string;
  name?: string;
  path?: string;
  /** JSON field is "element-type" (kebab-case). */
  'element-type'?: string;
}

/** Shape of a single banner entry in EventPoolConfigs.json. */
export interface EventPoolEntryDto {
  'banner-key': string;
  'banner-title': string;
  enabled: boolean;
  items: ItemDataDto[];
}

// ── Lookup type used by PoolDataService ────────────────────────────

/**
 * Two-level lookup: (ItemType, ItemRarity) → item name → full ItemData.
 * Used as the master reference when enriching event-banner simplified items.
 */
export type MasterLookup = Map<string, Map<string, ItemData>>;

/** Serialize an (ItemType, ItemRarity) pair into a composite key string. */
export function masterLookupKey(type: ItemType, rarity: ItemRarity): string {
  return `${type}|${rarity}`;
}
```

**Design note:** The `MasterLookup` in TypeScript uses `Map<string, Map<string, ItemData>>` with composite string keys (`"1|3"` = Avatar+Gold) instead of the C# `Dictionary<(ItemType, ItemRarity), Dictionary<string, ItemData>>`. This is because JavaScript `Map` does not natively support tuple keys. The `masterLookupKey()` helper ensures consistent key generation.

---

## 4. Core Gacha Engine (`GachaSystem`)

Create `src/engine/GachaSystem.ts`. **This is the most critical file.** Every probability constant, every branch in `DoGacha()`, every edge case in `Pull10()` must be byte-for-byte identical in behavior to the original `GachaSystem.cs`.

### 4.1 Class Signature & Fields

```typescript
import { type ItemData, ItemType, ItemRarity, ElementType, PathType, GachaType } from '@/types';

/**
 * Core gacha engine. Pure logic — no DOM, no framework dependency.
 * Semantically identical to HSR_Gacha_Simulator.Models.GachaSystem.
 *
 * Each instance represents one banner's independent state
 * (pity counters, guarantee flags, history).
 */
export class GachaSystem {
  // ── Public readonly state ──────────────────────────────────────
  readonly History: ItemData[] = [];
  readonly Type: GachaType;

  /** Callback invoked after every History mutation (pull, 10-pull, reset). */
  onHistoryChanged: (() => void) | null = null;

  // ── Private: item pools (populated by loadPools) ───────────────
  private goldAvatarPool: ItemData[] = [];
  private goldLightConePool: ItemData[] = [];
  private celestialGoldAvatarPool: ItemData[] = [];
  private eventGoldItemPool: ItemData[] = [];
  private purpleAvatarPool: ItemData[] = [];
  private purpleLightConePool: ItemData[] = [];
  private eventPurpleItemPool: ItemData[] = [];
  private blueItemPool: ItemData[] = [];

  // ── Private: pity counters ─────────────────────────────────────
  private ordinaryNonGoldGachaCount = 0;
  private ordinaryNonPurpleGachaCount = 0;
  private eventNonGoldGachaAvatarCount = 0;
  private eventNonGoldGachaLightConeCount = 0;
  private eventNonPurpleGachaCount = 0;

  // ── Private: guarantee flags ───────────────────────────────────
  private missedGoldEventItem = false;
  private missedPurpleEventItem = false;

  // ── Probability constants (IDENTICAL to C#) ────────────────────

  /** Pull number after which gold avatar soft-pity ramp begins. */
  private readonly GoldAvatarRateUpThreshold = 73;
  /** Pull number after which gold light-cone soft-pity ramp begins. */
  private readonly GoldLightConeRateUpThreshold = 65;
  /** Pull number after which purple soft-pity ramp begins. */
  private readonly PurpleItemRateUpThreshold = 8;

  /** Base probability for gold items (in 1/1000 units: 6 = 0.6%). */
  private readonly GoldItemBaseProbability = 6;
  /** Per-pull probability step for gold avatars after threshold (6.0% each). */
  private readonly GoldAvatarRateUpStep = 60;
  /** Per-pull probability step for gold light cones after threshold (7.0% each). */
  private readonly GoldLightConeRateUpStep = 70;

  /** Base probability for purple items (51/1000 = 5.1%). */
  private readonly PurpleItemBaseProbability = 51;
  /** Per-pull probability step for purple items after threshold (50.0% each). */
  private readonly PurpleItemRateUpStep = 500;

  /** 50% chance for event item when pulling a gold/purple avatar. */
  private readonly EventAvatarProbability = 500;
  /** 75% chance for event item when pulling a gold/purple light cone. */
  private readonly EventLightConeProbability = 750;

  /** Sentinel empty item returned when an invalid GachaType is used (should never happen). */
  private readonly EmptyItem: ItemData = {
    Type: ItemType.Unknown, Rarity: ItemRarity.Unknown,
    Name: 'EmptyItem', Path: PathType.Unknown, ElementType: ElementType.Unknown,
  };
```

### 4.2 Constructor & Factory

```typescript
  /** Private — use GachaSystem.create() to instantiate. */
  private constructor(type: GachaType) {
    this.Type = type;
  }

  /**
   * Factory: create a GachaSystem for the given banner type.
   * Mirrors GachaSystem.Create(GachaType type).
   */
  static create(type: GachaType): GachaSystem {
    return new GachaSystem(type);
  }
```

### 4.3 `loadPools()` — Populate Item Pools

```typescript
  /**
   * Atomically populate all internal item pools.
   * Called once per banner during initialization.
   *
   * @param goldAvatars         — Ordinary gold avatar pool
   * @param goldLightCones      — Ordinary gold light cone pool
   * @param celestialGoldAvatars — Off-rate gold avatar pool for event banners
   * @param eventGoldItems      — Rate-up gold items for this banner
   * @param purpleAvatars       — Ordinary purple avatar pool
   * @param purpleLightCones    — Ordinary purple light cone pool
   * @param eventPurpleItems    — Rate-up purple items for this banner
   * @param blueItems           — 3★ light cone pool
   */
  loadPools(
    goldAvatars: ItemData[],
    goldLightCones: ItemData[],
    celestialGoldAvatars: ItemData[],
    eventGoldItems: ItemData[],
    purpleAvatars: ItemData[],
    purpleLightCones: ItemData[],
    eventPurpleItems: ItemData[],
    blueItems: ItemData[],
  ): void {
    this.goldAvatarPool = goldAvatars;
    this.goldLightConePool = goldLightCones;
    this.celestialGoldAvatarPool = celestialGoldAvatars;
    this.eventGoldItemPool = eventGoldItems;
    this.purpleAvatarPool = purpleAvatars;
    this.purpleLightConePool = purpleLightCones;
    this.eventPurpleItemPool = eventPurpleItems;
    this.blueItemPool = blueItems;
  }
```

### 4.4 `pull()` — Single Pull

```typescript
  /**
   * Execute one gacha pull and return the result.
   * Appends the result to History and fires onHistoryChanged.
   */
  pull(): ItemData {
    const item = this.doGacha(this.Type);
    this.History.push(item);
    this.onHistoryChanged?.();
    return item;
  }
```

### 4.5 `pull10()` — 10-Pull with Guarantee Enforcement

This is the most delicate method. The logic must match `GachaSystem.Pull10()` in `GachaSystem.cs` lines 69-99 **exactly**.

```typescript
  /**
   * Execute 10 pulls. Enforces the HSR rule that a 10-pull always
   * contains at least one Purple (4★) or better item.
   *
   * IMPLEMENTATION NOTE — match C# original line-for-line:
   *
   * 1. Roll 10 items via doGacha().
   * 2. Track whether any roll yielded Purple or Gold.
   * 3. If ALL 10 are Blue:
   *    a. Reset the purple pity counter that was incremented by the blue-branch
   *       (the gold pity increment is correct and stays).
   *       For Ordinary: ordinaryNonPurpleGachaCount = 0
   *       For Event:    eventNonPurpleGachaCount = 0
   *    b. Call getPurpleItem() to force a purple, applying missedPurpleEventItem.
   *    c. Update missedPurpleEventItem flag (true if eventPurpleItemPool is non-empty
   *       AND the forced item is NOT in eventPurpleItemPool).
   *    d. Replace results[9] with the forced purple.
   * 4. Append all 10 to History, fire onHistoryChanged.
   * 5. Return the 10-item array.
   */
  pull10(): ItemData[] {
    const results: ItemData[] = new Array(10);
    let hasPurpleOrBetter = false;

    for (let i = 0; i < 10; i++) {
      results[i] = this.doGacha(this.Type);
      if (results[i].Rarity === ItemRarity.Purple || results[i].Rarity === ItemRarity.Gold) {
        hasPurpleOrBetter = true;
      }
    }

    if (!hasPurpleOrBetter) {
      // Undo the blue-branch purple-pity increment
      if (this.Type === GachaType.Ordinary) {
        this.ordinaryNonPurpleGachaCount = 0;
      } else {
        this.eventNonPurpleGachaCount = 0;
      }

      const forcedPurple = this.getPurpleItem(this.Type, this.missedPurpleEventItem);
      this.missedPurpleEventItem =
        this.eventPurpleItemPool.length > 0 &&
        !this.eventPurpleItemPool.includes(forcedPurple);
      results[9] = forcedPurple;
    }

    this.History.push(...results);
    this.onHistoryChanged?.();
    return results;
  }
```

### 4.6 `reset()` — Reset All Mutable State

```typescript
  /**
   * Reset all mutable state (history, guarantee flags, pity counters)
   * WITHOUT touching the item pools or banner type.
   */
  reset(): void {
    this.History.length = 0; // clear in-place
    this.missedGoldEventItem = false;
    this.missedPurpleEventItem = false;
    this.eventNonGoldGachaAvatarCount = 0;
    this.eventNonGoldGachaLightConeCount = 0;
    this.eventNonPurpleGachaCount = 0;
    this.ordinaryNonGoldGachaCount = 0;
    this.ordinaryNonPurpleGachaCount = 0;
    this.onHistoryChanged?.();
  }
```

### 4.7 Computed Getters (Pity Counters)

```typescript
  /** Number of pulls since the last 5★ item. */
  get nonGoldGachaCount(): number {
    switch (this.Type) {
      case GachaType.Ordinary:       return this.ordinaryNonGoldGachaCount;
      case GachaType.EventAvatar:    return this.eventNonGoldGachaAvatarCount;
      case GachaType.EventLightCone: return this.eventNonGoldGachaLightConeCount;
      default: return 0;
    }
  }

  /** True when the next gold pull is guaranteed to be the event item. */
  get isGuaranteed(): boolean {
    return this.missedGoldEventItem;
  }

  /** True when the next purple pull is guaranteed to be an event item. */
  get isPurpleGuaranteed(): boolean {
    return this.missedPurpleEventItem;
  }

  /** Number of pulls since the last 4★ item. */
  get nonPurpleGachaCount(): number {
    switch (this.Type) {
      case GachaType.Ordinary:       return this.ordinaryNonPurpleGachaCount;
      case GachaType.EventAvatar:    return this.eventNonPurpleGachaCount;
      case GachaType.EventLightCone: return this.eventNonPurpleGachaCount;
      default: return 0;
    }
  }
```

### 4.8 Statistics (Computed from History)

```typescript
  get totalPulls(): number { return this.History.length; }

  get goldCount(): number {
    return this.History.filter(i => i.Rarity === ItemRarity.Gold).length;
  }

  get purpleCount(): number {
    return this.History.filter(i => i.Rarity === ItemRarity.Purple).length;
  }

  get blueCount(): number {
    return this.History.filter(i => i.Rarity === ItemRarity.Blue).length;
  }

  /**
   * Number of pulled 5★ items that are off-rate (not in the event gold pool).
   * Returns 0 for ordinary banners.
   */
  get missedGoldCount(): number {
    const goldItems = this.History.filter(i => i.Rarity === ItemRarity.Gold);
    const eventCount = goldItems.filter(i => this.eventGoldItemPool.includes(i)).length;
    return goldItems.length - eventCount;
  }

  /** True if this banner has event gold items. */
  get hasEventItems(): boolean {
    return this.eventGoldItemPool.length > 0;
  }
```

### 4.9 Private: `doGacha()` — Core Probability Roll

```typescript
  /**
   * Core gacha logic. Routes to the correct branch based on GachaType.
   *
   * BRANCHES (must match C# DoGacha exactly):
   * 1. Ordinary:
   *    - Check IsGoldAvatar(ordinaryNonGoldGachaCount)
   *    - Check IsPurpleItem(ordinaryNonPurpleGachaCount)
   *    - Else blue
   * 2. EventAvatar:
   *    - Check IsGoldAvatar(eventNonGoldGachaAvatarCount)
   *    - Check IsPurpleItem(eventNonPurpleGachaCount)
   *    - Else blue
   *    - Update missedGoldEventItem / missedPurpleEventItem based on result
   * 3. EventLightCone:
   *    - Check IsGoldLightCone(eventNonGoldGachaLightConeCount)
   *    - Check IsPurpleItem(eventNonPurpleGachaCount)
   *    - Else blue
   *    - Update missedGoldEventItem / missedPurpleEventItem based on result
   */
  private doGacha(type: GachaType): ItemData {
    if (type === GachaType.Ordinary) {
      if (this.isGoldAvatar(this.ordinaryNonGoldGachaCount)) {
        this.ordinaryNonGoldGachaCount = 0;
        this.ordinaryNonPurpleGachaCount = 0;
        return this.getGoldItem(type, false);
      }
      if (this.isPurpleItem(this.ordinaryNonPurpleGachaCount)) {
        this.ordinaryNonPurpleGachaCount = 0;
        this.ordinaryNonGoldGachaCount++;
        return this.getPurpleItem(type, false);
      }
      this.ordinaryNonGoldGachaCount++;
      this.ordinaryNonPurpleGachaCount++;
      return this.getBlueItem();
    }

    if (type === GachaType.EventAvatar) {
      if (this.isGoldAvatar(this.eventNonGoldGachaAvatarCount)) {
        this.eventNonGoldGachaAvatarCount = 0;
        this.eventNonPurpleGachaCount = 0;
        const item = this.getGoldItem(type, this.missedGoldEventItem);
        this.missedGoldEventItem = !this.eventGoldItemPool.includes(item);
        return item;
      }
      if (this.isPurpleItem(this.eventNonPurpleGachaCount)) {
        this.eventNonPurpleGachaCount = 0;
        this.eventNonGoldGachaAvatarCount++;
        const item = this.getPurpleItem(type, this.missedPurpleEventItem);
        this.missedPurpleEventItem =
          this.eventPurpleItemPool.length > 0 &&
          !this.eventPurpleItemPool.includes(item);
        return item;
      }
      this.eventNonGoldGachaAvatarCount++;
      this.eventNonPurpleGachaCount++;
      return this.getBlueItem();
    }

    if (type === GachaType.EventLightCone) {
      if (this.isGoldLightCone(this.eventNonGoldGachaLightConeCount)) {
        this.eventNonGoldGachaLightConeCount = 0;
        this.eventNonPurpleGachaCount = 0;
        const item = this.getGoldItem(type, this.missedGoldEventItem);
        this.missedGoldEventItem = !this.eventGoldItemPool.includes(item);
        return item;
      }
      if (this.isPurpleItem(this.eventNonPurpleGachaCount)) {
        this.eventNonPurpleGachaCount = 0;
        this.eventNonGoldGachaLightConeCount++;
        const item = this.getPurpleItem(type, this.missedPurpleEventItem);
        this.missedPurpleEventItem =
          this.eventPurpleItemPool.length > 0 &&
          !this.eventPurpleItemPool.includes(item);
        return item;
      }
      this.eventNonGoldGachaLightConeCount++;
      this.eventNonPurpleGachaCount++;
      return this.getBlueItem();
    }

    return this.EmptyItem; // Should never reach here
  }
```

### 4.10 Private: Item Selection Methods

```typescript
  /**
   * Select a gold (5★) item based on banner type and guarantee status.
   *
   * - Ordinary: uniformly random from goldAvatarPool ∪ goldLightConePool.
   * - EventAvatar: if isEvent(avatar) || isRateUp → pick from eventGoldItemPool;
   *   else → pick from eventGoldItemPool ∪ celestialGoldAvatarPool.
   * - EventLightCone: if isEvent(lc) || isRateUp → pick from eventGoldItemPool;
   *   else → pick from eventGoldItemPool ∪ goldLightConePool.
   */
  private getGoldItem(type: GachaType, isRateUp: boolean): ItemData {
    if (type === GachaType.Ordinary) {
      const unionPool = [...this.goldAvatarPool, ...this.goldLightConePool];
      return unionPool[Math.floor(Math.random() * unionPool.length)];
    }
    if (type === GachaType.EventAvatar) {
      const unionPool = [...this.eventGoldItemPool, ...this.celestialGoldAvatarPool];
      if (this.isEvent(true) || isRateUp) {
        return this.eventGoldItemPool[Math.floor(Math.random() * this.eventGoldItemPool.length)];
      }
      return unionPool[Math.floor(Math.random() * unionPool.length)];
    }
    if (type === GachaType.EventLightCone) {
      const unionPool = [...this.eventGoldItemPool, ...this.goldLightConePool];
      if (this.isEvent(false) || isRateUp) {
        return this.eventGoldItemPool[Math.floor(Math.random() * this.eventGoldItemPool.length)];
      }
      return unionPool[Math.floor(Math.random() * unionPool.length)];
    }
    return this.EmptyItem;
  }

  /**
   * Select a purple (4★) item.
   *
   * - Ordinary: uniformly random from purpleAvatarPool ∪ purpleLightConePool.
   * - EventAvatar / EventLightCone: if eventPurpleItemPool is non-empty AND
   *   (isEvent(type) || isRateUp) → pick from eventPurpleItemPool;
   *   else → pick from the full union pool.
   */
  private getPurpleItem(type: GachaType, isRateUp: boolean): ItemData {
    const unionPool = [...this.purpleAvatarPool, ...this.purpleLightConePool];
    if (type === GachaType.Ordinary) {
      return unionPool[Math.floor(Math.random() * unionPool.length)];
    }
    if (type === GachaType.EventAvatar || type === GachaType.EventLightCone) {
      if (this.eventPurpleItemPool.length > 0 && (this.isEvent(type === GachaType.EventAvatar) || isRateUp)) {
        return this.eventPurpleItemPool[
          Math.floor(Math.random() * this.eventPurpleItemPool.length)
        ];
      }
      return unionPool[Math.floor(Math.random() * unionPool.length)];
    }
    return this.EmptyItem;
  }

  /** Select a random blue (3★) item. */
  private getBlueItem(): ItemData {
    return this.blueItemPool[Math.floor(Math.random() * this.blueItemPool.length)];
  }
```

### 4.11 Private: Probability Functions

```typescript
  /**
   * Gold avatar probability: base 6/1000 (0.6%).
   * After GoldAvatarRateUpThreshold (73) consecutive non-gold pulls,
   * adds GoldAvatarRateUpStep (60) per additional pull.
   * Reaches ~100% at pull 90.  (6 + (90-73)*60 = 6 + 1020 = 1026 > 1000)
   */
  private getGoldAvatarProbability(failureCount: number): number {
    if (failureCount > this.GoldAvatarRateUpThreshold) {
      return this.GoldItemBaseProbability +
        (failureCount + 1 - this.GoldAvatarRateUpThreshold) * this.GoldAvatarRateUpStep;
    }
    return this.GoldItemBaseProbability;
  }

  /**
   * Gold light cone probability: base 6/1000 (0.6%).
   * After GoldLightConeRateUpThreshold (65) consecutive non-gold pulls,
   * adds GoldLightConeRateUpStep (70) per additional pull.
   * Reaches ~100% at pull 80.  (6 + (80-65)*70 = 6 + 1050 = 1056 > 1000)
   */
  private getGoldLightConeProbability(failureCount: number): number {
    if (failureCount > this.GoldLightConeRateUpThreshold) {
      return this.GoldItemBaseProbability +
        (failureCount + 1 - this.GoldLightConeRateUpThreshold) * this.GoldLightConeRateUpStep;
    }
    return this.GoldItemBaseProbability;
  }

  /**
   * Purple item probability: base 51/1000 (5.1%).
   * After PurpleItemRateUpThreshold (8) consecutive non-purple pulls,
   * adds PurpleItemRateUpStep (500) per additional pull.
   * Guaranteed (~100%) at pull 10.  (51 + (10-8)*500 = 1051 > 1000)
   */
  private getPurpleItemProbability(failureCount: number): number {
    if (failureCount > this.PurpleItemRateUpThreshold) {
      return this.PurpleItemBaseProbability +
        (failureCount + 1 - this.PurpleItemRateUpThreshold) * this.PurpleItemRateUpStep;
    }
    return this.PurpleItemBaseProbability;
  }

  /**
   * 50/50 or 75/25 check.
   * @param isAvatar — true for avatar banners (50%), false for LC banners (75%).
   * @returns true if the event (rate-up) item is won.
   */
  private isEvent(isAvatar: boolean): boolean {
    const eventProbability = isAvatar
      ? this.EventAvatarProbability
      : this.EventLightConeProbability;
    return Math.floor(Math.random() * 1000) < eventProbability;
  }

  /** Roll against getGoldAvatarProbability. Returns true if gold is pulled. */
  private isGoldAvatar(failureCount: number): boolean {
    return Math.floor(Math.random() * 1000) < this.getGoldAvatarProbability(failureCount);
  }

  /** Roll against getGoldLightConeProbability. Returns true if gold is pulled. */
  private isGoldLightCone(failureCount: number): boolean {
    return Math.floor(Math.random() * 1000) < this.getGoldLightConeProbability(failureCount);
  }

  /** Roll against getPurpleItemProbability. Returns true if purple is pulled. */
  private isPurpleItem(failureCount: number): boolean {
    return Math.floor(Math.random() * 1000) < this.getPurpleItemProbability(failureCount);
  }
}
```

**Critical implementation check:** After writing `GachaSystem.ts`, verify that:
- `pull10()` Undo logic targets the correct pity counter branch (Ordinary vs Event).
- `missedGoldEventItem` is set to `true` when `!eventGoldItemPool.includes(item)` (i.e., the pulled gold item is NOT a rate-up).
- `missedPurpleEventItem` is set to `true` when `eventPurpleItemPool.length > 0 && !eventPurpleItemPool.includes(item)`.
- Probability thresholds and steps match the constants exactly.

---

## 5. Service Layer

All services are implemented as Vue composables (functions returning reactive state + methods). They are NOT singletons in the DI sense — instead, they are instantiated once in the Pinia store or provided via Vue's `provide`/`inject`.

### 5.1 `useLocalizationService` (`src/services/useLocalizationService.ts`)

Replaces `LocalizationService.cs`. Must support the exact same API surface: `get(key)`, `get(key, ...args)`, `getItemName(englishName)`, `currentLanguage`, `availableLanguages`.

```typescript
/**
 * Localization service. Loads /LanguageConfigs/TextMap.json at startup.
 *
 * API surface (match ILocalizationService exactly):
 *   currentLanguage: Ref<string>         — ISO 639-1 code ("en", "zh")
 *   availableLanguages: Ref<string[]>    — read from meta.languages
 *   get(key: string): string
 *   get(key: string, ...args: (string | number)[]): string
 *   getItemName(englishName: string): string
 *
 * Fallback chain (match C# exactly):
 *   1. current language → 2. default language → 3. raw key
 *
 * Language preference is persisted to localStorage under key
 * "hsr-gacha-simulator:language".
 *
 * Implementation notes:
 * - Load TextMap.json via fetch() on first call to get() (lazy init).
 * - Parse meta.languages and meta.defaultLanguage.
 * - Parse entries into Map<string, Record<string, string>>.
 * - currentLanguage is a ref; changing it triggers reactive re-renders
 *   in all components that use get().
 * - getItemName() tries "avatar.<englishName>" first, then "lightcone.<englishName>",
 *   falls back to englishName.
 * - If a format string in get(key, ...args) fails to format (e.g. wrong
 *   number of placeholders), return the raw format string (match C# try/catch).
 */
```

**Key implementation details:**

```typescript
// Persist language to localStorage
const STORAGE_KEY = 'hsr-gacha-simulator:language';

// On init: read saved language from localStorage, fall back to "en"
// On change: write to localStorage

// Lazy loading pattern:
let loaded = false;
const entries = new Map<string, Record<string, string>>();
const defaultLanguage = ref('en');
const availableLanguages = ref<string[]>(['en']);
const currentLanguage = ref('en');

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;
  const resp = await fetch('/LanguageConfigs/TextMap.json');
  const data = await resp.json();
  // Parse meta.defaultLanguage → defaultLanguage
  // Parse meta.languages → availableLanguages
  // Parse entries.<key> → entries map
  // Ensure currentLanguage is in availableLanguages; if not, fall back to default
}

function get(key: string, ...args: (string | number)[]): string {
  await ensureLoaded(); // or handle sync if already loaded
  // ... lookup logic
}
```

> **Note:** Because `get()` is called synchronously in Vue templates (via `{{ $t('key') }}`), the composable must handle the "not yet loaded" case gracefully. The recommended approach: eagerly load on app mount, and return the key itself until loaded. The `ensureLoaded()` call should be fire-and-forget in the constructor; subsequent calls after load return translated values reactively.

### 5.2 `usePoolDataService` (`src/services/usePoolDataService.ts`)

Replaces `PoolDataService.cs`. Pure functions — no reactive state.

```typescript
import type { ItemData, ItemDataDto, EventPoolConfigEntry, EventPoolEntryDto, MasterLookup } from '@/types';
import { ItemType, ItemRarity, PathType, ElementType, masterLookupKey } from '@/types';

/**
 * Deserialize a single pool-config JSON file into an ItemData array.
 *
 * @param filePath — path relative to /public, e.g. "/PoolConfigs/OrdinaryGoldPoolConfig.json"
 * @returns List<ItemData> — mirrors PoolDataService.LoadFromFile()
 */
export async function loadFromFile(filePath: string): Promise<ItemData[]> {
  const resp = await fetch(filePath);
  const dtos: ItemDataDto[] = await resp.json();
  if (!dtos) return [];
  return dtos.map(dto => toItemData(dto));
}

/**
 * Map a JSON DTO to the canonical ItemData interface.
 * Mirrors PoolDataService.ToItemData().
 */
function toItemData(dto: ItemDataDto): ItemData {
  return {
    Type:        parseEnum(ItemType, dto.type),
    Rarity:      parseEnum(ItemRarity, dto.rarity),
    Name:        dto.name ?? '',
    Path:        parseEnum(PathType, dto.path),
    ElementType: !dto['element-type']
                   ? ElementType.Unknown
                   : parseEnum(ElementType, dto['element-type']),
  };
}

/**
 * Parse a string into an enum value, case-insensitive.
 * Returns the enum's default (0) on null/empty/unrecognized input.
 * Mirrors PoolDataService.ParseEnum<T>().
 */
function parseEnum<T extends Record<string, number | string>>(
  enumObj: T,
  value: string | undefined | null,
): T[keyof T] {
  if (!value) return 0 as T[keyof T];
  // Try exact match, then case-insensitive
  for (const key of Object.keys(enumObj)) {
    if (key.toLowerCase() === value.toLowerCase()) {
      return enumObj[key as keyof T] as T[keyof T];
    }
  }
  return 0 as T[keyof T];
}

/**
 * Build a two-level master lookup from gold + purple master pool files.
 * Key: "type|rarity" → name → full ItemData.
 *
 * Mirrors PoolDataService.BuildMasterLookup().
 */
export async function buildMasterLookup(
  allGoldPath: string,
  ordinaryPurplePath: string,
): Promise<MasterLookup> {
  const allGold   = await loadFromFile(allGoldPath);
  const allPurple = await loadFromFile(ordinaryPurplePath);
  const merged    = [...allGold, ...allPurple];

  const lookup: MasterLookup = new Map();

  for (const item of merged) {
    const key = masterLookupKey(item.Type, item.Rarity);
    if (!lookup.has(key)) {
      lookup.set(key, new Map());
    }
    lookup.get(key)!.set(item.Name, item);
  }

  return lookup;
}

/**
 * Load EventPoolConfigs.json, filter to enabled banners, enrich simplified
 * items with full data from the master lookup.
 *
 * Mirrors PoolDataService.LoadEventPoolConfigs().
 */
export async function loadEventPoolConfigs(
  filePath: string,
  masterLookup: MasterLookup,
): Promise<EventPoolConfigEntry[]> {
  const resp = await fetch(filePath);
  const dtos: EventPoolEntryDto[] = await resp.json();
  if (!dtos) return [];

  const entries: EventPoolConfigEntry[] = [];

  for (const dto of dtos) {
    if (!dto.enabled) continue;

    const items: ItemData[] = [];
    for (const itemDto of dto.items) {
      const type   = parseEnum(ItemType, itemDto.type);
      const rarity = parseEnum(ItemRarity, itemDto.rarity);
      const name   = itemDto.name ?? '';

      const key = masterLookupKey(type, rarity);
      const nameDict = masterLookup.get(key);
      const fullItem = nameDict?.get(name);

      if (fullItem) {
        items.push(fullItem);
      } else {
        // Fallback: item not in master pool — warn, create partial ItemData
        console.warn(
          `[PoolDataService] Item '${name}' (${type}, ${rarity}) from event config not found in master pools.`,
        );
        items.push({
          Type: type, Rarity: rarity, Name: name,
          Path: PathType.Unknown, ElementType: ElementType.Unknown,
        });
      }
    }

    entries.push({
      BannerKey:   dto['banner-key'],
      BannerTitle: dto['banner-title'],
      Items:       items,
    });
  }

  return entries;
}
```

### 5.3 `useIconService` (`src/services/useIconService.ts`)

Replaces `IconService.cs`. Returns URL strings for `<img :src="...">` binding.

```typescript
/**
 * Icon service. Provides cached URL strings for icon PNG files.
 * Mirrors IIconService.
 *
 * - Icons are served from /Icons/ (the public/ directory).
 * - No actual image decoding is performed; the browser handles that.
 * - The "cache" is a simple Map<string, string> keyed by file name,
 *   storing the resolved URL. For static assets this is trivially
 *   `/Icons/${fileName}`, but the cache pattern allows future changes.
 */
export function useIconService() {
  const cache = new Map<string, string>();

  /**
   * Returns the public URL for an icon file, or null if it does not exist.
   * Since we can't check file existence from the browser, we always return
   * the URL and let the <img> tag's @error handler hide the element.
   *
   * @param fileName — e.g. "Path_Destruction.png", "Element_Fire.png"
   * @returns URL string like "/Icons/Path_Destruction.png"
   */
  function getUrl(fileName: string): string {
    if (cache.has(fileName)) return cache.get(fileName)!;
    const url = `/Icons/${fileName}`;
    cache.set(fileName, url);
    return url;
  }

  return { getUrl };
}
```

**Usage in components:** Bind like `<img :src="iconService.getUrl(`Path_${item.Path}.png`)" @error="e => (e.target as HTMLImageElement).style.display = 'none'" />`. For path/element icons specifically, the component should compute whether to show them (Avatars always show; Light Cones show Path icon but hide Element icon).

---

## 6. State Management — Pinia Store

Create three Pinia stores. They replace the ViewModels from the original WPF app.

### 6.1 `useGachaStore` (`src/stores/useGachaStore.ts`)

This is the central store. It replaces `MainViewModel`, `BannerViewModel`, and `HistoryPanelViewModel`.

```typescript
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { GachaSystem } from '@/engine/GachaSystem';
import { GachaType, ItemType, ItemRarity, type ItemData, type EventPoolConfigEntry } from '@/types';
import { loadFromFile, buildMasterLookup, loadEventPoolConfigs } from '@/services/usePoolDataService';
import { useLocalizationService } from '@/services/useLocalizationService';

/**
 * Shape of a banner option displayed in the banner strip.
 * Replaces BannerViewModel.
 */
export interface BannerDescriptor {
  /** The GachaSystem instance backing this banner. */
  system: GachaSystem;
  /** Stable key for localization, e.g. "cyrene_avatar". */
  bannerKey: string;
  /** English display title — fallback if loc key is missing. */
  bannerTitle: string;
  /** Determines probability model. */
  gachaType: GachaType;
  /** Localized display name (reactive). */
  displayName: string;
}

/**
 * Shape of a history row displayed in the table.
 * Replaces HistoryItemDisplay.
 */
export interface HistoryRow {
  index: number;
  name: string;
  rarityStars: string;
  rarity: ItemRarity;
  typeLabel: string;
  pathLabel: string;
  elementType: import('@/types').ElementType;
  elementLabel: string;
}
```

**Store definition:**

```typescript
export const useGachaStore = defineStore('gacha', () => {
  const l10n = useLocalizationService();

  // ── Banners ────────────────────────────────────────────────────
  /** All banner descriptors (ordinary, all-gold, event banners). */
  const banners = ref<BannerDescriptor[]>([]);
  /** Index into banners[] of the currently selected banner. */
  const selectedBannerIndex = ref(0);
  /** Whether initial banner loading is complete. */
  const isLoaded = ref(false);
  /** Whether initial load failed. */
  const loadError = ref<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────
  const selectedBanner = computed(() =>
    banners.value[selectedBannerIndex.value] ?? null
  );
  const currentSystem = computed(() =>
    selectedBanner.value?.system ?? null
  );
  const currentBannerKey = computed(() =>
    selectedBanner.value?.bannerKey ?? 'ordinary'
  );

  // ── History ────────────────────────────────────────────────────
  /** Rows displayed in the history table (newest first). */
  const historyRows = ref<HistoryRow[]>([]);
  /**
   * Index into currentSystem.History that the result card is displaying.
   * -1 means "no result selected" (cleared state).
   */
  const currentResultIndex = ref(-1);

  // ── Status ─────────────────────────────────────────────────────
  const statusText = ref('');

  // ═══════════════════════════════════════════════════════════════
  //  Initialization (replaces MainViewModel.InitializeSystems)
  // ═══════════════════════════════════════════════════════════════

  async function initialize(): Promise<void> {
    try {
      const POOL_DIR = '/PoolConfigs';

      // Load shared pools
      const [ordinaryGold, ordinaryPurple, celestialGold, blue, allGold] =
        await Promise.all([
          loadFromFile(`${POOL_DIR}/OrdinaryGoldPoolConfig.json`),
          loadFromFile(`${POOL_DIR}/OrdinaryPurplePoolConfig.json`),
          loadFromFile(`${POOL_DIR}/CelestialGoldPoolConfig.json`),
          loadFromFile(`${POOL_DIR}/BluePoolConfig.json`),
          loadFromFile(`${POOL_DIR}/AllGoldPoolConfig.json`),
        ]);

      const goldAvatars      = ordinaryGold.filter(i => i.Type === ItemType.Avatar);
      const goldLightCones   = ordinaryGold.filter(i => i.Type === ItemType.LightCone);
      const purpleAvatars    = ordinaryPurple.filter(i => i.Type === ItemType.Avatar);
      const purpleLightCones = ordinaryPurple.filter(i => i.Type === ItemType.LightCone);
      const blueItems        = blue.filter(i => i.Rarity === ItemRarity.Blue);
      const allGoldAvatars   = allGold.filter(i => i.Type === ItemType.Avatar);
      const allGoldLightCones = allGold.filter(i => i.Type === ItemType.LightCone);

      // Helper to create a system
      function createSystem(
        type: GachaType,
        eventGold: ItemData[],
        eventPurple: ItemData[],
        celestial: ItemData[] = [],
      ): GachaSystem {
        const sys = GachaSystem.create(type);
        sys.loadPools(
          goldAvatars, goldLightCones, celestial,
          eventGold, purpleAvatars, purpleLightCones,
          eventPurple, blueItems,
        );
        sys.onHistoryChanged = onHistoryChanged;
        return sys;
      }

      const result: BannerDescriptor[] = [];

      // Ordinary banner
      const ordSys = createSystem(GachaType.Ordinary, [], []);
      result.push({
        system: ordSys, bannerKey: 'ordinary',
        bannerTitle: 'Ordinary', gachaType: GachaType.Ordinary,
        displayName: l10n.get('ui.banner.ordinary'),
      });

      // All Gold banner
      const agSys = createSystem(GachaType.Ordinary, [], []);
      agSys.loadPools(allGoldAvatars, allGoldLightCones, [], [],
        purpleAvatars, purpleLightCones, [], blueItems);
      result.push({
        system: agSys, bannerKey: 'all_gold',
        bannerTitle: 'All Gold (Expanded Pool)', gachaType: GachaType.Ordinary,
        displayName: l10n.get('ui.banner.all_gold'),
      });

      // Event banners
      const masterLookup = await buildMasterLookup(
        `${POOL_DIR}/AllGoldPoolConfig.json`,
        `${POOL_DIR}/OrdinaryPurplePoolConfig.json`,
      );
      const eventConfigs = await loadEventPoolConfigs(
        `${POOL_DIR}/EventPoolConfigs.json`,
        masterLookup,
      );

      for (const config of eventConfigs) {
        const goldItems = config.Items.filter(i => i.Rarity === ItemRarity.Gold);
        if (goldItems.length === 0) continue;

        const gachaType = goldItems.some(i => i.Type === ItemType.Avatar)
          ? GachaType.EventAvatar
          : GachaType.EventLightCone;

        const eventGold   = config.Items.filter(i => i.Rarity === ItemRarity.Gold);
        const eventPurple = config.Items.filter(i => i.Rarity === ItemRarity.Purple);
        const celestial   = gachaType === GachaType.EventAvatar ? celestialGold : undefined;

        result.push({
          system: createSystem(gachaType, eventGold, eventPurple, celestial),
          bannerKey: config.BannerKey,
          bannerTitle: config.BannerTitle,
          gachaType,
          displayName: l10n.get(`ui.banner.${config.BannerKey}`),
        });
      }

      banners.value = result;
      isLoaded.value = true;
      statusText.value = l10n.get('ui.status.ready');
    } catch (err: any) {
      loadError.value = err.message ?? String(err);
      statusText.value = l10n.get('ui.status.init_failed');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Banner switching
  // ═══════════════════════════════════════════════════════════════

  function selectBanner(index: number): void {
    if (index < 0 || index >= banners.value.length) return;
    selectedBannerIndex.value = index;
    currentResultIndex.value = -1;
    reloadAllHistory();
    statusText.value = l10n.get('ui.status.ready');
  }

  // ═══════════════════════════════════════════════════════════════
  //  Pull actions (replace MainViewModel.Pull)
  // ═══════════════════════════════════════════════════════════════

  function pull(count: 1 | 10): void {
    const sys = currentSystem.value;
    if (!sys) return;

    if (count === 1) {
      sys.pull();
    } else {
      sys.pull10();
    }

    currentResultIndex.value = sys.History.length - 1;
    afterPull(count);
  }

  /** Called after every pull. Replaces MainViewModel.AfterPull. */
  function afterPull(count: number): void {
    const sys = currentSystem.value;
    if (!sys) return;

    // Prepend newest items to history
    const history = sys.History;
    for (let i = history.length - count; i < history.length; i++) {
      historyRows.value.unshift(itemToHistoryRow(history[i], i + 1));
    }

    statusText.value = l10n.get('ui.status.ready');
  }

  // ═══════════════════════════════════════════════════════════════
  //  Reset
  // ═══════════════════════════════════════════════════════════════

  function resetCurrentBanner(): void {
    const sys = currentSystem.value;
    if (!sys) return;
    sys.reset();
    const bannerName = selectedBanner.value?.displayName ?? l10n.get('ui.banner.ordinary');
    currentResultIndex.value = -1;
    historyRows.value = [];
    statusText.value = l10n.get('ui.status.banner_reset', bannerName);
  }

  // ═══════════════════════════════════════════════════════════════
  //  History navigation (replaces MainViewModel.NavigatePrev/Next)
  // ═══════════════════════════════════════════════════════════════

  function navigatePrev(): void {
    const sys = currentSystem.value;
    if (!sys || sys.History.length === 0) return;
    let newIdx = currentResultIndex.value - 1;
    if (newIdx < 0) newIdx = sys.History.length - 1;
    currentResultIndex.value = newIdx;
  }

  function navigateNext(): void {
    const sys = currentSystem.value;
    if (!sys || sys.History.length === 0) return;
    let newIdx = currentResultIndex.value + 1;
    if (newIdx >= sys.History.length) newIdx = 0;
    currentResultIndex.value = newIdx;
  }

  // ═══════════════════════════════════════════════════════════════
  //  History helpers
  // ═══════════════════════════════════════════════════════════════

  function onHistoryChanged(): void {
    // Called by GachaSystem after any mutation.
    // The store already handles history row updates in pull() and reset().
    // This callback is a no-op for now but must be wired up.
  }

  /**
   * Rebuild historyRows from currentSystem.History (newest first).
   * Called on banner switch.
   * Mirrors HistoryPanelViewModel.ReloadAllHistoryAsync.
   */
  function reloadAllHistory(): void {
    const sys = currentSystem.value;
    if (!sys) { historyRows.value = []; return; }

    const snapshot = [...sys.History];
    const rows: HistoryRow[] = [];
    for (let i = snapshot.length - 1; i >= 0; i--) {
      rows.push(itemToHistoryRow(snapshot[i], i + 1));
    }
    historyRows.value = rows;
  }

  function clearHistory(): void {
    historyRows.value = [];
  }

  // ═══════════════════════════════════════════════════════════════
  //  Static helpers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Convert an ItemData + 1-based index to a HistoryRow.
   * Mirrors HistoryItemDisplay.FromItemData().
   */
  function itemToHistoryRow(item: ItemData, index: number): HistoryRow {
    return {
      index,
      name:         l10n.getItemName(item.Name),
      rarityStars:  rarityToStars(item.Rarity),
      rarity:       item.Rarity,
      typeLabel:    item.Type === ItemType.Avatar
                      ? l10n.get('ui.history.type.avatar')
                      : l10n.get('ui.history.type.lightcone_short'),
      pathLabel:    formatPath(item.Path),
      elementType:  item.ElementType,
      elementLabel: formatElement(item.ElementType, item.Type),
    };
  }

  return {
    // State
    banners, selectedBannerIndex, isLoaded, loadError,
    historyRows, currentResultIndex, statusText,
    // Computed
    selectedBanner, currentSystem, currentBannerKey,
    // Actions
    initialize, selectBanner, pull, resetCurrentBanner,
    navigatePrev, navigateNext, reloadAllHistory, clearHistory,
  };
});
```

**Utility functions** (place in the same file or a shared `utils.ts`):

```typescript
/** Mirrors HistoryItemDisplay.RarityToStars(). */
export function rarityToStars(rarity: ItemRarity): string {
  switch (rarity) {
    case ItemRarity.Gold:   return '★★★★★';
    case ItemRarity.Purple: return '★★★★';
    case ItemRarity.Blue:   return '★★★';
    default:                return '?';
  }
}

/** Mirrors HistoryItemDisplay.FormatPath(). */
export function formatPath(path: PathType): string {
  if (path === PathType.Unknown) return '—';
  return l10n.get(`path.${PathType[path]}`); // e.g. "path.Destruction"
}

/** Mirrors HistoryItemDisplay.FormatElement(). */
export function formatElement(element: ElementType, type: ItemType): string {
  if (type === ItemType.LightCone || element === ElementType.Unknown) return '—';
  return l10n.get(`element.${ElementType[element]}`); // e.g. "element.Fire"
}
```

### 6.2 `usePityStatsStore` (`src/stores/usePityStatsStore.ts`)

This is a **derived store** — it reads from `useGachaStore` and exposes computed pity/statistics values. It replaces `PityStatisticsViewModel`.

```typescript
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useGachaStore } from './useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { ItemRarity } from '@/types';

export const usePityStatsStore = defineStore('pityStats', () => {
  const gacha = useGachaStore();
  const l10n = useLocalizationService();

  const sys = computed(() => gacha.currentSystem);

  // ── Pity: Gold ─────────────────────────────────────────────────
  const goldPity = computed(() => String(sys.value?.nonGoldGachaCount ?? 0));

  const goldGuarantee = computed(() => {
    if (!sys.value) return '';
    return sys.value.isGuaranteed
      ? l10n.get('ui.pity.guaranteed')
      : l10n.get('ui.pity.not_guaranteed');
  });

  /** Gold color (#ffd700) when guaranteed, dim (#c0c0c0) otherwise. */
  const goldGuaranteeColor = computed(() =>
    sys.value?.isGuaranteed ? '#ffd700' : '#c0c0c0'
  );

  // ── Pity: Purple ───────────────────────────────────────────────
  const purplePity = computed(() => String(sys.value?.nonPurpleGachaCount ?? 0));

  const purpleGuarantee = computed(() => {
    if (!sys.value) return '';
    return sys.value.isPurpleGuaranteed
      ? l10n.get('ui.pity.guaranteed')
      : l10n.get('ui.pity.not_guaranteed');
  });

  const purpleGuaranteeColor = computed(() =>
    sys.value?.isPurpleGuaranteed ? '#ffd700' : '#c0c0c0'
  );

  // ── Statistics ─────────────────────────────────────────────────
  const total = computed(() => sys.value?.totalPulls ?? 0);
  const goldCount = computed(() => sys.value?.goldCount ?? 0);
  const purpleCount = computed(() => sys.value?.purpleCount ?? 0);
  const blueCount = computed(() => sys.value?.blueCount ?? 0);

  const goldRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(goldCount.value * 100 / t).toFixed(1)}%)`;
  });
  const purpleRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(purpleCount.value * 100 / t).toFixed(1)}%)`;
  });
  const blueRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(blueCount.value * 100 / t).toFixed(1)}%)`;
  });

  const totalPullsText = computed(() =>
    l10n.get('ui.stats.total_pulls', total.value)
  );

  const missedGoldStats = computed(() => {
    const s = sys.value;
    if (!s || !s.hasEventItems) return '';
    const gold = s.goldCount;
    if (gold === 0) return '';
    const missed = s.missedGoldCount;
    const rate = (missed * 100 / gold).toFixed(1);
    return l10n.get('ui.stats.missed', missed, gold, Number(rate));
  });

  const showMissedStats = computed(() => {
    const s = sys.value;
    return s !== null && s.hasEventItems && s.goldCount > 0;
  });

  return {
    goldPity, goldGuarantee, goldGuaranteeColor,
    purplePity, purpleGuarantee, purpleGuaranteeColor,
    totalPullsText, goldCount, goldRate,
    purpleCount, purpleRate, blueCount, blueRate,
    missedGoldStats, showMissedStats,
  };
});
```

### 6.3 `useResultCardStore` (`src/stores/useResultCardStore.ts`)

Derived store for the result card display. Replaces `ResultCardViewModel`.

```typescript
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useGachaStore } from './useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { useIconService } from '@/services/useIconService';
import { ItemType, ElementType, ItemRarity } from '@/types';
import { rarityToStars, formatPath, formatElement } from './useGachaStore';
import { getRarityForegroundColor, getRarityBorderColor, getElementColor } from '@/composables/useRarityColors';

export const useResultCardStore = defineStore('resultCard', () => {
  const gacha = useGachaStore();
  const l10n = useLocalizationService();
  const icons = useIconService();

  /** The item currently displayed on the result card, or null. */
  const currentItem = computed(() => {
    const sys = gacha.currentSystem;
    if (!sys) return null;
    const idx = gacha.currentResultIndex;
    if (idx < 0 || idx >= sys.History.length) return null;
    return sys.History[idx];
  });

  // ── Rarity ─────────────────────────────────────────────────────
  const rarityStars = computed(() =>
    currentItem.value ? rarityToStars(currentItem.value.Rarity) : ''
  );
  const rarityColor = computed(() =>
    currentItem.value ? getRarityForegroundColor(currentItem.value.Rarity) : '#e0e0e0'
  );

  // ── Name ───────────────────────────────────────────────────────
  const itemName = computed(() =>
    currentItem.value
      ? l10n.getItemName(currentItem.value.Name)
      : l10n.get('ui.result.default')
  );

  // ── Type ───────────────────────────────────────────────────────
  const itemTypeLabel = computed(() => {
    if (!currentItem.value) return '';
    return currentItem.value.Type === ItemType.Avatar
      ? l10n.get('ui.result.type.avatar')
      : l10n.get('ui.result.type.lightcone');
  });

  // ── Path ───────────────────────────────────────────────────────
  const pathLabel = computed(() =>
    currentItem.value ? formatPath(currentItem.value.Path) : ''
  );

  // ── Element ────────────────────────────────────────────────────
  const elementLabel = computed(() => {
    const item = currentItem.value;
    if (!item) return '';
    if (item.Type === ItemType.LightCone || item.ElementType === ElementType.Unknown) return '—';
    return formatElement(item.ElementType, item.Type);
  });

  const elementColor = computed(() => {
    const item = currentItem.value;
    if (!item) return '#c0c0c0';
    if (item.Type === ItemType.LightCone || item.ElementType === ElementType.Unknown) return '#c0c0c0';
    return getElementColor(item.ElementType);
  });

  // ── Icons ──────────────────────────────────────────────────────
  const pathIconUrl = computed(() => {
    const item = currentItem.value;
    if (!item || item.Path === 0) return null;
    return icons.getUrl(`Path_${PathType[item.Path]}.png`); // Use enum name, e.g. "Path_Destruction.png"
  });

  const elementIconUrl = computed(() => {
    const item = currentItem.value;
    if (!item || item.Type === ItemType.LightCone || item.ElementType === ElementType.Unknown) return null;
    return icons.getUrl(`Element_${ElementType[item.ElementType]}.png`);
  });

  /** Show element icon only for Avatars with a known element. */
  const showElementIcon = computed(() => elementIconUrl.value !== null);

  /** Show path icon for all items with a known path. */
  const showPathIcon = computed(() => pathIconUrl.value !== null);

  // ── Border ─────────────────────────────────────────────────────
  const cardBorderColor = computed(() =>
    currentItem.value
      ? getRarityBorderColor(currentItem.value.Rarity)
      : '#3a3a6e'
  );

  // ── Index text ─────────────────────────────────────────────────
  const indexText = computed(() => {
    const sys = gacha.currentSystem;
    if (!sys || sys.History.length === 0) return '';
    const idx = gacha.currentResultIndex;
    if (idx < 0) return '';
    return l10n.get('ui.result.pull_number', idx + 1, sys.History.length);
  });

  // ── Visibility flags ───────────────────────────────────────────
  /** When true, the separator dot between path and element is visible. */
  const showDotElement = computed(() => true);

  /** When true, the element text is visible. */
  const showElementText = computed(() => true);

  /** True when no item is selected. */
  const isEmpty = computed(() => currentItem.value === null);

  return {
    currentItem,
    rarityStars, rarityColor, itemName, itemTypeLabel,
    pathLabel, elementLabel, elementColor,
    pathIconUrl, elementIconUrl, showPathIcon, showElementIcon,
    cardBorderColor, indexText,
    showDotElement, showElementText, isEmpty,
  };
});
```

---

## 7. Component Tree & UI Specification

### 7.0 `App.vue` — Root Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Scrollable Area]                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  BannerStrip                                       │  │
│  ├──────────────────────┬─────────────────────────────┤  │
│  │  PullControls        │  StatisticsPanel            │  │
│  ├──────────────────────┴─────────────────────────────┤  │
│  │  ResultCard + ResultNavigator                      │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  HistoryTable                                      │  │
│  └────────────────────────────────────────────────────┘  │
│  [StatusBar]                                             │
└──────────────────────────────────────────────────────────┘
```

**Layout implementation using Tailwind:**

```html
<template>
  <div class="min-h-screen bg-[#1a1a2e] text-[#e0e0e0] flex flex-col">
    <!-- Main scrollable content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <BannerStrip />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PullControls />
        <StatisticsPanel />
      </div>
      <div>
        <ResultCard />
        <ResultNavigator />
      </div>
      <HistoryTable />
    </div>
    <!-- Status bar fixed at bottom -->
    <AppStatusBar />
  </div>
</template>
```

### 7.1 `AppStatusBar.vue` — Status Bar + Language Selector

```
┌──────────────────────────────────────────────────────────┐
│  Status text (left)           [Language: ▼ en] (right)  │
└──────────────────────────────────────────────────────────┘
```

**Specification:**
- Background: `#0f3460`
- Text color: `#c0c0c0`
- Height: ~32px
- Left side: bound to `gacha.statusText`
- Right side: `<select>` or custom dropdown bound to `l10n.currentLanguage`, options from `l10n.availableLanguages`
- The language selector must have dark-themed styling matching the ComboBox style from `Styles.xaml`
- Font size: 13px

**Template structure:**

```html
<template>
  <footer class="flex items-center justify-between h-8 px-3 bg-[#0f3460] text-[#c0c0c0] text-sm shrink-0">
    <span>{{ gacha.statusText }}</span>
    <div class="flex items-center gap-2">
      <span class="text-xs">{{ $t('ui.lang.selector') }}</span>
      <select
        v-model="l10n.currentLanguage.value"
        class="bg-[#16213e] text-white border border-[#3a3a6e] rounded px-2 py-0.5 text-xs cursor-pointer"
      >
        <option v-for="lang in l10n.availableLanguages.value" :key="lang" :value="lang">
          {{ lang }}
        </option>
      </select>
    </div>
  </footer>
</template>
```

### 7.2 `BannerStrip.vue` — Horizontally-Scrollable Banner Selector

```
┌──────────────────────────────────────────────────────────┐
│  ┌─ Banner Selection ──────────────────────────────────┐ │
│  │ [◀] [Ordinary] [All Gold] [Castorice] [Evernight]… [▶] │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Specification:**
- GroupBox header: localized text from `ui.group.banner_selection`
- Left/right arrow buttons (◀ ▶) scroll the banner list horizontally by ~200px per click
- Mouse wheel over the banner strip scrolls horizontally
- Each banner is a pill-shaped button:
  - Default: background `#16213e`, border `#3a3a6e`, text `#c0c0c0`
  - Selected: background `#3a3a6e`, border `#ffd700` (gold), text `#ffffff`
  - Border radius: 14px (pill shape)
  - Padding: 14px horizontal, 5px vertical
  - Font: 13px, semi-bold
  - Cursor: pointer
- Selected banner auto-scrolls into view (smooth)

**Implementation notes:**
- Use a `<div>` with `overflow-x: hidden` and scroll it programmatically via `scrollLeft`
- The pill buttons are rendered with `v-for` over `gacha.banners`
- Click a pill → `gacha.selectBanner(index)`
- The selected banner gets the gold border

### 7.3 `PullControls.vue` — Pull Buttons + Pity Display

```
┌─ Pull Controls ─────────────────────────────────────────┐
│  [ Warp ×1 ]  [ Warp ×10 ]                             │
│  [ Reset Banner ]                                       │
│                                                         │
│  Gold Pity:   5  pulls since last 5★                   │
│  Gold Guarantee:  Not Guaranteed / ★ Guaranteed         │
│                                                         │
│  Purple Pity: 3  pulls since last 4★                   │
│  Purple Guarantee:  Not Guaranteed / ★ Guaranteed       │
└─────────────────────────────────────────────────────────┘
```

**Specification:**
- "Warp ×1" and "Warp ×10" buttons:
  - Background `#3a3a6e`, hover `#4a4a8e`, active `#2a2a5e`
  - Border `#5a5a8e`, 1px, radius 4px
  - Text `#e0e0e0`, 16px, bold
  - Padding 16px H, 8px V, min-width 120px
  - Cursor pointer
- "Reset Banner" button:
  - Background `#6e3a3a`, hover `#8e4a4a`, active `#4e2a2a`
  - Border `#8e4a4a`, 1px, radius 4px
  - Text `#e0e0e0`, 14px, semi-bold
  - Padding 14px H, 8px V, min-width 120px
  - Click: show `ConfirmDialog` before calling `gacha.resetCurrentBanner()`
- Pity text:
  - Gold pity: "N pulls since last 5★" (N = `pityStats.goldPity`)
  - Gold guarantee: "Guaranteed" (gold `#ffd700`) or "Not Guaranteed" (dim `#c0c0c0`)
  - Purple pity: "N pulls since last 4★"
  - Purple guarantee: same color logic as gold
  - Font: 14px, margin 4px horizontal between label and value

### 7.4 `StatisticsPanel.vue` — Rarity Distribution

```
┌─ Statistics ────────────────────────────────────────────┐
│  Total pulls: 42                                        │
│                                                         │
│  ★★★★★  5★ items:  3   (7.1%)                          │
│    ↳ Missed rate-up: 1/3 (33.3%)  ← only for event      │
│  ★★★★   4★ items:  5  (11.9%)                           │
│  ★★★    3★ items: 34  (81.0%)                           │
└─────────────────────────────────────────────────────────┘
```

**Specification:**
- "Total pulls" text: 14px, semi-bold, `#e0e0e0`
- 5★ row: gold stars (`#ffd700`), label "5★ items:", count in `#ffd700` bold, rate in `#b0b0b0`
- Missed stats row (indented, only visible for event banners with gold pulls):
  - "↳" prefix + text in `#c77dff` (purple), 13px
  - Hidden via `v-if="pityStats.showMissedStats"`
- 4★ row: purple stars (`#c77dff`), count in `#c77dff`
- 3★ row: blue stars (`#6090ff`), count in `#6090ff`
- Minimum label width 80px for alignment
- All text 14px except missed stats (13px)

### 7.5 `ResultCard.vue` — Latest Pull Display

```
┌─ Latest Pull Result ────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Path Icon]  ★★★★★                   [Elem Icon] │   │
│  │               Castorice                          │   │
│  │          Avatar • Destruction • Quantum          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Specification:**
- Card container:
  - Background `#16213e`
  - Border 3px solid, color = rarity color (`#ffd700` gold, `#c77dff` purple, `#6090ff` blue, `#3a3a6e` default)
  - Border radius 8px
  - Padding 20px H, 16px V
  - Min height 80px, min width 400px, max width 600px
  - Centered horizontally
- Left icon: Path icon, 48×48px, margin-right 12px. Hidden if no path/light cone.
- Right icon: Element icon, 48×48px, margin-left 12px. Hidden for light cones or unknown element.
- Center text stack:
  - Rarity stars (top): 20px, bold, centered, colored by rarity
  - Item name: 22px, bold, `#e0e0e0`, centered
  - Detail row: Type • Path • Element, 14px, `#c0c0c0` (path/type) and element color for element
- When no item is selected: name = "—" (from `ui.result.default`), no icons, default border

### 7.6 `ResultNavigator.vue` — Prev/Next Navigation

```
  [◀ Prev]    Pull 42 / 42    [Next ▶]
```

**Specification:**
- "Prev" and "Next" buttons (NavButtonStyle equivalent):
  - Background `#3a3a6e`, hover `#4a4a8e`
  - Border `#5a5a8e`, 1px, radius 3px
  - Text `#e0e0e0`, 14px, padding 8px H, 4px V, min-width 80px
- Center: "Pull N / Total" text, `#c0c0c0`, 14px, min-width 100px, centered
- Click "Prev" → `gacha.navigatePrev()`, click "Next" → `gacha.navigateNext()`
- Wrap around: prev at first → jump to last; next at last → jump to first

### 7.7 `HistoryTable.vue` — Pull History

```
┌─ Pull History ──────────────────────────────────────────┐
│  #    │ Name          │ Rarity    │ Type  │ Path   │ Elem │
│  ─────┼───────────────┼───────────┼───────┼────────┼──────│
│  42   │ Castorice     │ ★★★★★    │ Avatar│ Remembr│ Ice  │  ← newest first
│  41   │ Pela          │ ★★★★      │ Avatar│ Nihility│ Ice │
│  …    │ …             │ …         │ …     │ …      │ …   │
└─────────────────────────────────────────────────────────┘
```

**Specification:**
- Table with columns: # (50px), Name (180px), Rarity (90px), Type (60px), Path (90px), Element (80px)
- Headers: localized via `ui.history.header.*`
- Rows: bound to `gacha.historyRows`
- Rarity column: colored stars — gold `#ffd700`, purple `#c77dff`, blue `#6090ff`. Use `rarityToStars()` and `getRarityForegroundColor()`.
- Element column: text colored by element using `getElementColor()`. For Light Cones or Unknown, show "—" in dim `#c0c0c0`.
- Background: `#16213e`, border: `#3a3a6e` 1px
- Row separator: `#2a2a4e` bottom border 1px
- The table must scroll vertically when content overflows (max-height or flex-grow within the app layout)

### 7.8 `ConfirmDialog.vue` — Reset Confirmation Modal

```
┌──────────────────────────────────────┐
│  Reset Banner                         │
│                                      │
│  Are you sure you want to reset       │
│  "Castorice (Avatar)"?               │
│  This will clear all history and      │
│  pity counters for this banner.       │
│                                      │
│         [ Cancel ]  [ Reset ]        │
└──────────────────────────────────────┘
```

**Specification:**
- Modal overlay: semi-transparent black backdrop
- Dialog box: background `#16213e`, border `#3a3a6e`, rounded
- Title: localized (`dialog.reset_banner.title`)
- Message: localized (`dialog.reset_banner.message`) with banner name interpolated
- Cancel button: NavButtonStyle
- Reset/OK button: ResetButtonStyle (red-toned)
- Clicking backdrop or Cancel → close without action
- Clicking Reset → emit `@confirm`, parent calls `gacha.resetCurrentBanner()`

---

## 8. Routing

No routing is required — the app is a single view. Create a minimal router configuration for future extensibility:

```typescript
// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router';
import App from '@/App.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: App }, // Single route
  ],
});

export default router;
```

---

## 9. Internationalization (i18n)

### 9.1 Custom Solution (not vue-i18n)

The original app uses a custom `LocalizationService` with a specific key format (`ui.button.warp_x1`, `avatar.Himeko`, etc.). To preserve 100% backward compatibility with `TextMap.json`, implement our own composable rather than using `vue-i18n`.

**API surface of `useLocalizationService`:**

```typescript
interface ILocalizationService {
  currentLanguage: Ref<string>;
  availableLanguages: Ref<string[]>;
  get(key: string): string;
  get(key: string, ...args: (string | number)[]): string;
  getItemName(englishName: string): string;
}
```

**Usage in templates:** Components call `l10n.get('key')` inside `computed()` or directly in the template via a helper:

```typescript
// Provide a global $t helper for template convenience
app.config.globalProperties.$t = (key: string, ...args: any[]) =>
  l10n.get(key, ...args);
```

### 9.2 TextMap.json Compatibility

The `LanguageConfigs/TextMap.json` file from the original project is used **verbatim**. No format changes. The service reads `meta.languages`, `meta.defaultLanguage`, and `entries`.

### 9.3 Language Persistence

Language selection is persisted to `localStorage` under key `hsr-gacha-simulator:language`. On startup, the saved language is restored before the first `get()` call.

---

## 10. Dark Theme & Tailwind Configuration

### 10.1 Tailwind Config

```typescript
// tailwind.config.ts (Tailwind v4) or postcss.config.js + tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        // Core palette (match original WPF resources)
        'app-bg':       '#1a1a2e',
        'card-bg':      '#16213e',
        'card-border':  '#3a3a6e',
        'gold':         '#ffd700',
        'purple':       '#c77dff',
        'blue':         '#6090ff',
        'text-primary': '#e0e0e0',
        'text-dim':     '#c0c0c0',
        'text-muted':   '#b0b0b0',
        'status-bg':    '#0f3460',
        'btn-primary':  '#3a3a6e',
        'btn-hover':    '#4a4a8e',
        'btn-active':   '#2a2a5e',
        'btn-reset':    '#6e3a3a',
        'btn-reset-hover': '#8e4a4a',
        'btn-reset-active': '#4e2a2a',
        // Element colors
        'elem-physical':  '#c0c0c0',
        'elem-fire':      '#ff4444',
        'elem-ice':       '#4499ff',
        'elem-lightning': '#dd77dd',
        'elem-wind':      '#44cc44',
        'elem-quantum':   '#6666cc',
        'elem-imaginary': '#dddd44',
      },
    },
  },
};
```

### 10.2 Color Utility Composable

```typescript
// src/composables/useRarityColors.ts
import { ItemRarity, ElementType } from '@/types';

/** Maps ItemRarity to foreground (text) color. Mirrors RarityConverters.GetForegroundBrush. */
export function getRarityForegroundColor(rarity: ItemRarity): string {
  switch (rarity) {
    case ItemRarity.Gold:   return '#ffd700';
    case ItemRarity.Purple: return '#c77dff';
    case ItemRarity.Blue:   return '#6090ff';
    default:                return '#e0e0e0';
  }
}

/** Maps ItemRarity to border color. Mirrors RarityConverters.GetBorderBrush. */
export function getRarityBorderColor(rarity: ItemRarity): string {
  switch (rarity) {
    case ItemRarity.Gold:   return '#ffd700';
    case ItemRarity.Purple: return '#c77dff';
    case ItemRarity.Blue:   return '#6090ff';
    default:                return '#3a3a6e';
  }
}

/** Maps ElementType to display color. Mirrors ElementTypeToBrushConverter.GetBrush. */
export function getElementColor(element: ElementType): string {
  switch (element) {
    case ElementType.Physical:  return '#c0c0c0';
    case ElementType.Fire:      return '#ff4444';
    case ElementType.Ice:       return '#4499ff';
    case ElementType.Lightning: return '#dd77dd';
    case ElementType.Wind:      return '#44cc44';
    case ElementType.Quantum:   return '#6666cc';
    case ElementType.Imaginary: return '#dddd44';
    default:                    return 'transparent';
  }
}
```

### 10.3 Global Styles (`src/style.css`)

```css
@import "tailwindcss";

/* Minimal global styles — most styling via Tailwind utilities */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei',
    sans-serif;
  background-color: #1a1a2e;
  color: #e0e0e0;
}

/* Scrollbar styling for WebKit browsers (dark theme) */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #16213e; }
::-webkit-scrollbar-thumb { background: #3a3a6e; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #5a5a8e; }
```

---

## 11. Static Assets

Copy the following directories from the original project into `public/` **unchanged**:

```
cp -r ../HSR-Gacha-Simulator/PoolConfigs     public/PoolConfigs
cp -r ../HSR-Gacha-Simulator/LanguageConfigs  public/LanguageConfigs
cp -r ../HSR-Gacha-Simulator/Icons            public/Icons
```

No file-format conversion is needed. The JSON configs are loaded via `fetch()`. PNG icons are loaded as `<img src="...">`.

---

## 12. Build, Run & Packaging

### 12.1 Initial Setup

```bash
pnpm create vite HSR-Gacha-Simulator-Cross-Platform --template vue-ts
cd HSR-Gacha-Simulator-Cross-Platform
pnpm add pinia vue-router@4
pnpm add -D tailwindcss @tailwindcss/vite
pnpm add -D eslint prettier eslint-plugin-vue @typescript-eslint/parser
```

### 12.2 Dev Server

```bash
pnpm dev
# Opens at http://localhost:5173
```

### 12.3 Production Build

```bash
pnpm build
# Output in dist/ — deployable to any static hosting (Netlify, Vercel, GitHub Pages)
```

### 12.4 Desktop Packaging (Phase 2 — Optional)

```bash
pnpm add -D @tauri-apps/cli
# Configure tauri.conf.json to wrap the Vite output
pnpm tauri build
# Produces native binaries for macOS (.dmg), Windows (.msi), Linux (.AppImage)
```

---

## 13. Step-by-Step Implementation Order

### Phase 1 — Foundation

1. **Scaffold the Vite + Vue 3 + TypeScript project.**
   - Run `pnpm create vite` with the `vue-ts` template.
   - Install dependencies: `pinia`, `vue-router`, `tailwindcss`, `@tailwindcss/vite`.
   - Configure `vite.config.ts` with the Tailwind plugin.
   - Configure `tsconfig.json` with `strict: true`, path alias `@` → `src/`.

2. **Copy static assets.**
   - `public/PoolConfigs/` ← original `PoolConfigs/`
   - `public/LanguageConfigs/` ← original `LanguageConfigs/`
   - `public/Icons/` ← original `Icons/`

3. **Create `src/types/index.ts`.** Copy the type definitions from §3 verbatim.

4. **Create `src/composables/useRarityColors.ts`.** Copy from §10.2.

5. **Create `src/engine/GachaSystem.ts`.** Copy the full class from §4. **This is the most critical file.** Test it independently with unit tests:
   ```typescript
   // Quick sanity test (run in browser console or vitest):
   const sys = GachaSystem.create(GachaType.Ordinary);
   sys.loadPools([], [], [], [], [], [], [], [blueItem1, blueItem2]);
   const result = sys.pull();
   console.assert(result.Rarity === ItemRarity.Blue);
   ```

### Phase 2 — Services

6. **Create `src/services/useLocalizationService.ts`.**
   - Implement lazy loading, `get()`, `getItemName()`, language persistence.
   - Wire up as a global composable (provide/inject or import directly).

7. **Create `src/services/usePoolDataService.ts`.**
   - Implement `loadFromFile()`, `buildMasterLookup()`, `loadEventPoolConfigs()`.
   - Use `fetch()` to load JSON from `/public`.

8. **Create `src/services/useIconService.ts`.**
   - Simple URL resolver.

### Phase 3 — State Management

9. **Create `src/stores/useGachaStore.ts`.**
   - Implement `initialize()`, `selectBanner()`, `pull()`, `resetCurrentBanner()`, `navigatePrev/Next()`, history management.
   - Wire `onHistoryChanged` callback.

10. **Create `src/stores/usePityStatsStore.ts`.**
    - All computed properties derived from `useGachaStore`.

11. **Create `src/stores/useResultCardStore.ts`.**
    - All computed properties derived from `useGachaStore`.

### Phase 4 — Components

Build components in this order (each can be tested independently):

12. **`AppStatusBar.vue`** — simplest, no dependencies beyond stores.
13. **`BannerPill.vue`** — single banner pill (used by BannerStrip).
14. **`BannerStrip.vue`** — horizontal scroll + banner pills.
15. **`PullControls.vue`** — warp buttons + pity text.
16. **`StatisticsPanel.vue`** — rarity breakdown.
17. **`ResultCard.vue`** — result display with icons.
18. **`ResultNavigator.vue`** — prev/next buttons.
19. **`HistoryTable.vue`** — scrollable history list.
20. **`ConfirmDialog.vue`** — reusable modal.

### Phase 5 — Assembly

21. **Write `App.vue`** — compose all components in the layout.
22. **Write `main.ts`** — create app, install Pinia, provide services, mount.
23. **Call `gacha.initialize()`** in `App.vue`'s `onMounted()`.

### Phase 6 — Polish & Verify

24. **Test all user flows:**
    - Select each banner type (Ordinary, All Gold, Event Avatar, Event LC)
    - Pull ×1 and ×10 on each
    - Verify 10-pull always contains at least one 4★+
    - Verify pity counters increment correctly
    - Verify guarantee flags work (50/50 loss → next is guaranteed)
    - Reset a banner (with confirmation dialog)
    - Navigate history with prev/next
    - Switch language (en ↔ zh)
    - Verify all item names, paths, elements are localized
25. **Cross-browser test** on Chrome, Firefox, Safari.
26. **Responsive check** — ensure layout works at 700px+ width (matching original min-width).

---

## 14. Verification Checklist

Before considering the project complete, verify every item:

### Gacha Mechanics (must match original exactly)
- [ ] Gold base probability: 0.6% (6/1000)
- [ ] Purple base probability: 5.1% (51/1000)
- [ ] Avatar soft pity starts at pull 74, increments +6.0%/pull
- [ ] Light Cone soft pity starts at pull 65, increments +7.0%/pull
- [ ] Purple soft pity starts at pull 9, increments +50.0%/pull
- [ ] 50/50 for event avatars, 75/25 for event light cones
- [ ] Guarantee carry-over: losing 50/50 sets `missedGoldEventItem = true`
- [ ] 10-pull enforcement: all-blue batch → force last to purple
- [ ] Purple 50/50 guarantee (same mechanics as gold)
- [ ] Per-banner independent pity counters and history

### UI
- [ ] Banner strip: horizontal scroll with arrows + mouse wheel
- [ ] Selected banner pill: gold border, highlighted background
- [ ] Warp buttons: correct colors, hover/active states
- [ ] Reset button: confirmation dialog before clearing
- [ ] Pity display: gold/purple counters with guarantee status
- [ ] Statistics: total pulls, rarity counts + percentages, missed stats (event only)
- [ ] Result card: rarity-colored border, path/element icons, name + details
- [ ] History table: newest first, colored stars, colored elements
- [ ] Language selector: switches all text live without page reload

### Data & Config
- [ ] All JSON pool configs load correctly
- [ ] Event banners are data-driven (edit EventPoolConfigs.json → banner appears)
- [ ] Event items enriched from master pools (path + element resolved)
- [ ] `enabled: false` banners are hidden
- [ ] TextMap.json fallback chain: current lang → default lang → raw key

### Cross-Platform
- [ ] Runs in Chrome, Firefox, Safari (latest versions)
- [ ] Runs on macOS, Windows, Linux
- [ ] Layout is functional at viewport widths ≥ 700px

---

## Appendix A: Key Differences from Original

| Original (WPF) | New (Vue 3) | Notes |
|---|---|---|
| `INotifyPropertyChanged` / `SetProperty<T>()` | Vue `ref()` / `reactive()` + `computed()` | Vue's reactivity system is automatic; no manual `OnPropertyChanged` needed. |
| `ObservableCollection<T>` | `ref<T[]>` | Vue's reactivity tracks array mutations automatically. |
| `{markup:Loc key}` | `$t('key')` or `l10n.get('key')` in computed | Custom global helper. |
| `IValueConverter` | `computed()` or inline functions | No converter infrastructure needed; just compute values. |
| `BitmapImage` / `ImageSource` | `<img :src="url">` | Browser handles image decoding. |
| `MessageBox.Show()` | Custom `ConfirmDialog.vue` component | Matches the dark theme. |
| `AppDomain.CurrentDomain.BaseDirectory` | `/public/` (Vite static assets) | Config files are served as static assets. |
| `Environment.SpecialFolder.LocalApplicationData` | `localStorage` | Language preference persistence. |
| `Task.Run()` for async history reload | Synchronous array operations | JS is single-threaded; history rebuild is fast enough to be synchronous. |

## Appendix B: Localization Key Reference

The following keys are used in the UI and must exist in `TextMap.json`:

```
ui.window.title          — Window title ("HSR Gacha Simulator")
ui.lang.selector         — "Language:"
ui.group.banner_selection — "Banner Selection"
ui.group.pull_controls   — "Pull Controls"
ui.group.statistics      — "Statistics"
ui.group.latest_result   — "Latest Pull Result"
ui.group.pull_history    — "Pull History"

ui.button.warp_x1        — "Warp ×1"
ui.button.warp_x10       — "Warp ×10"
ui.button.reset_banner   — "Reset Banner"
ui.button.prev_page      — "◀ Prev"
ui.button.next_page      — "Next ▶"

ui.pity.gold_pity        — "Gold Pity: "
ui.pity.gold_since       — " pulls since last 5★"
ui.pity.gold_guarantee   — "Gold Guarantee: "
ui.pity.purple_pity      — "Purple Pity: "
ui.pity.purple_since     — " pulls since last 4★"
ui.pity.purple_guarantee — "Purple Guarantee: "
ui.pity.guaranteed       — "★ Guaranteed"
ui.pity.not_guaranteed   — "Not Guaranteed"

ui.stats.total_pulls     — "Total pulls: {0}"
ui.stats.rarity_5star    — "5★ items: "
ui.stats.rarity_4star    — "4★ items: "
ui.stats.rarity_3star    — "3★ items: "
ui.stats.missed          — "Missed rate-up: {0}/{1} ({2}%)"

ui.result.default        — "—"
ui.result.type.avatar    — "Avatar"
ui.result.type.lightcone — "Light Cone"
ui.result.separator      — " • "
ui.result.pull_number    — "Pull {0} / {1}"

ui.history.header.number  — "#"
ui.history.header.name    — "Name"
ui.history.header.rarity  — "Rarity"
ui.history.header.type    — "Type"
ui.history.header.path    — "Path"
ui.history.header.element — "Element"
ui.history.type.avatar    — "Avatar"
ui.history.type.lightcone_short — "LC"

ui.status.ready          — "Ready"
ui.status.pulling        — "Pulling..."
ui.status.pulling_x10    — "Pulling ×10..."
ui.status.init_failed    — "Initialization failed"
ui.status.banner_reset   — "Banner "{0}" has been reset."

ui.banner.ordinary       — "Ordinary"
ui.banner.all_gold       — "All Gold (Expanded Pool)"
ui.banner.<banner-key>   — (per event banner, e.g. "Castorice (Avatar)")

dialog.reset_banner.title   — "Reset Banner"
dialog.reset_banner.message — "Are you sure you want to reset "{0}"?\nThis will clear all history and pity counters for this banner."
dialog.error.title          — "Error"
dialog.error.init_failed    — "Failed to initialize: {0}"

path.Destruction, path.TheHunt, path.Erudition, path.Harmony,
path.Nihility, path.Preservation, path.Abundance, path.Remembrance, path.Elation

element.Physical, element.Fire, element.Ice, element.Lightning,
element.Wind, element.Quantum, element.Imaginary

avatar.<Name>            — Localized avatar name
lightcone.<Name>         — Localized light cone name
```
