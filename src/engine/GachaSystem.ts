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

  /** Base probability for gold avatar (in 1/1000 units: 6 = 0.6%). */
  private readonly GoldAvatarBaseProbability = 6;
  /** Base probability for gold light cone (in 1/1000 units: 8 = 0.8%). */
  private readonly GoldLightConeBaseProbability = 8;
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

  // ── Constructor & Factory ──────────────────────────────────────

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

  // ── Pool-exposing getters (readonly) ──────────────────────────────

  /** Expose shared pools for custom banner creation. Read-only. */
  get goldAvatarPoolExposed(): readonly ItemData[] { return this.goldAvatarPool; }
  get goldLightConePoolExposed(): readonly ItemData[] { return this.goldLightConePool; }
  get celestialGoldAvatarPoolExposed(): readonly ItemData[] { return this.celestialGoldAvatarPool; }
  get purpleAvatarPoolExposed(): readonly ItemData[] { return this.purpleAvatarPool; }
  get purpleLightConePoolExposed(): readonly ItemData[] { return this.purpleLightConePool; }
  get blueItemPoolExposed(): readonly ItemData[] { return this.blueItemPool; }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Atomically populate all internal item pools.
   * Called once per banner during initialization.
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

  // ── Computed Getters (Pity Counters) ───────────────────────────

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

  // ── Statistics (Computed from History) ─────────────────────────

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

  /** Number of pulled rate-up gold items (gold items in the event gold pool). */
  get rateUpGoldCount(): number {
    return this.History.filter(
      i => i.Rarity === ItemRarity.Gold && this.eventGoldItemPool.includes(i),
    ).length;
  }

  /**
   * 1-based index of the last gold (5★) item in History.
   * Returns 0 if no gold items have been pulled.
   */
  get lastGoldPullIndex(): number {
    for (let i = this.History.length - 1; i >= 0; i--) {
      if (this.History[i].Rarity === ItemRarity.Gold) {
        return i + 1; // 1-based
      }
    }
    return 0;
  }

  /**
   * Average pulls per gold: index of the latest gold divided by total gold count.
   * Uses the latest gold's position (not History.length) to avoid counting
   * overflow pulls from a x10 batch that came after the last gold.
   * Returns NaN if no gold items have been pulled.
   */
  get averageGoldPullNumber(): number {
    const idx = this.lastGoldPullIndex;
    const gc = this.goldCount;
    if (gc === 0 || idx === 0) return NaN;
    return idx / gc;
  }

  /**
   * Average pulls per rate-up gold: index of the latest gold divided by
   * rate-up gold count. Always ≥ averageGoldPullNumber since the denominator
   * is ≤ goldCount and the numerator is identical.
   * Returns NaN if no rate-up gold items have been pulled.
   */
  get averageRateUpPullNumber(): number {
    const idx = this.lastGoldPullIndex;
    const rc = this.rateUpGoldCount;
    if (rc === 0 || idx === 0) return NaN;
    return idx / rc;
  }

  // ═══════════════════════════════════════════════════════════════
  //  Private: Core Probability Roll
  // ═══════════════════════════════════════════════════════════════

  /**
   * Core gacha logic. Routes to the correct branch based on GachaType.
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

  // ═══════════════════════════════════════════════════════════════
  //  Private: Item Selection Methods
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  //  Private: Probability Functions
  // ═══════════════════════════════════════════════════════════════

  /**
   * Gold avatar probability: base 6/1000 (0.6%).
   * After GoldAvatarRateUpThreshold (73) consecutive non-gold pulls,
   * adds GoldAvatarRateUpStep (60) per additional pull.
   * Reaches ~100% at pull 90.  (6 + (90-73)*60 = 6 + 1020 = 1026 > 1000)
   */
  private getGoldAvatarProbability(failureCount: number): number {
    if (failureCount > this.GoldAvatarRateUpThreshold) {
      return this.GoldAvatarBaseProbability +
        (failureCount + 1 - this.GoldAvatarRateUpThreshold) * this.GoldAvatarRateUpStep;
    }
    return this.GoldAvatarBaseProbability;
  }

  /**
   * Gold light cone probability: base 8/1000 (0.8%).
   * After GoldLightConeRateUpThreshold (65) consecutive non-gold pulls,
   * adds GoldLightConeRateUpStep (70) per additional pull.
   * Reaches ~100% at pull 80.  (8 + (80-65)*70 = 8 + 1050 = 1058 > 1000)
   */
  private getGoldLightConeProbability(failureCount: number): number {
    if (failureCount > this.GoldLightConeRateUpThreshold) {
      return this.GoldLightConeBaseProbability +
        (failureCount + 1 - this.GoldLightConeRateUpThreshold) * this.GoldLightConeRateUpStep;
    }
    return this.GoldLightConeBaseProbability;
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
