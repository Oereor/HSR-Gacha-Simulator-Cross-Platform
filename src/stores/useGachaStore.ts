import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { GachaSystem } from '@/engine/GachaSystem';
import { GachaType, ItemType, ItemRarity, PathType, ElementType, type ItemData, type EventPoolConfigEntry, type CustomPoolConfigDto } from '@/types';
import { loadFromFile, buildMasterLookup, loadEventPoolConfigs, toItemData } from '@/services/usePoolDataService';
import { useLocalizationService } from '@/services/useLocalizationService';
import { rarityToStars as rarityToStarsFn, getRarityForegroundColor, getElementColor } from '@/composables/useRarityColors';
import { formatPath as formatPathFn, formatElement as formatElementFn } from '@/utils/formatters';

const l10n = useLocalizationService();

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
  /** True if this banner was created by the user (not built-in). */
  isCustom?: boolean;
  /** The custom pool config ID (only set when isCustom is true). */
  customPoolId?: string;
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
  elementType: ElementType;
  elementLabel: string;
}

export const useGachaStore = defineStore('gacha', () => {
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
  /** Tracks which history row was last clicked. -1 = none. Drives table highlight only. */
  const selectedHistoryIndex = ref(-1);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      loadError.value = message;
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
    selectedHistoryIndex.value = -1;
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
    selectedHistoryIndex.value = -1;
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
    selectedHistoryIndex.value = -1;
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

  /**
   * Jump the result card to a specific history index (called from row click).
   * Sets BOTH currentResultIndex (card) and selectedHistoryIndex (table highlight).
   * @param historyIndex - 0-based index into currentSystem.History
   */
  function navigateTo(historyIndex: number): void {
    const sys = currentSystem.value;
    if (!sys || sys.History.length === 0) return;
    if (historyIndex < 0 || historyIndex >= sys.History.length) return;
    currentResultIndex.value = historyIndex;
    selectedHistoryIndex.value = historyIndex;
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
  //  Custom pool helpers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate the default banner title from gold item name and pool type.
   * Format: "{gold-item-localized-name} ({pool-type-localized})"
   */
  function getDefaultTitle(goldItemEnglishName: string, poolType: 'Avatar' | 'LightCone'): string {
    const goldLocalized = l10n.getItemName(goldItemEnglishName);
    const typeKey = poolType === 'Avatar'
      ? 'ui.custom.type.avatar'
      : 'ui.custom.type.lightcone';
    const typeLocalized = l10n.get(typeKey);
    return `${goldLocalized} (${typeLocalized})`;
  }

  /**
   * Add a custom banner to the end of the banners list.
   * Creates a GachaSystem for it using shared pools from the ordinary banner.
   */
  function addCustomBanner(config: CustomPoolConfigDto): void {
    const gachaType = config.poolType === 'Avatar'
      ? GachaType.EventAvatar
      : GachaType.EventLightCone;

    const eventGold: ItemData[] = [toItemData(config.goldItem)];
    const eventPurple: ItemData[] = config.purpleItems.map(toItemData);

    const ordinarySys = banners.value[0]?.system;
    if (!ordinarySys) {
      console.error('[GachaStore] Cannot add custom banner: ordinary system not initialized.');
      return;
    }

    const celestial = gachaType === GachaType.EventAvatar
      ? [...ordinarySys.celestialGoldAvatarPoolExposed]
      : [];

    const sys = GachaSystem.create(gachaType);
    sys.loadPools(
      [...ordinarySys.goldAvatarPoolExposed],
      [...ordinarySys.goldLightConePoolExposed],
      celestial,
      eventGold,
      [...ordinarySys.purpleAvatarPoolExposed],
      [...ordinarySys.purpleLightConePoolExposed],
      eventPurple,
      [...ordinarySys.blueItemPoolExposed],
    );
    sys.onHistoryChanged = onHistoryChanged;

    const bannerKey = `custom_${config.id}`;
    const displayName = config.customTitle
      || getDefaultTitle(config.goldItem.name!, config.poolType);

    banners.value.push({
      system: sys,
      bannerKey,
      bannerTitle: displayName,
      gachaType,
      displayName,
      isCustom: true,
      customPoolId: config.id,
    });
  }

  /**
   * Remove a custom banner by its pool config ID.
   */
  function removeCustomBanner(poolId: string): void {
    const idx = banners.value.findIndex(
      b => b.isCustom && b.customPoolId === poolId
    );
    if (idx === -1) return;

    if (selectedBannerIndex.value === idx) {
      selectBanner(0);
    } else if (selectedBannerIndex.value > idx) {
      selectedBannerIndex.value--;
    }

    banners.value.splice(idx, 1);
  }

  // ═══════════════════════════════════════════════════════════════
  //  Static helpers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Convert an ItemData + 1-based index to a HistoryRow.
   * Mirrors HistoryItemDisplay.FromItemData().
   */
  function itemToHistoryRow(item: ItemData, index: number): HistoryRow {
    const getLoc = (key: string) => l10n.get(key);
    return {
      index,
      name:         l10n.getItemName(item.Name),
      rarityStars:  rarityToStarsFn(item.Rarity),
      rarity:       item.Rarity,
      typeLabel:    item.Type === ItemType.Avatar
                      ? l10n.get('ui.history.type.avatar')
                      : l10n.get('ui.history.type.lightcone_short'),
      pathLabel:    formatPathFn(item.Path, getLoc),
      elementType:  item.ElementType,
      elementLabel: formatElementFn(item.ElementType, item.Type, getLoc),
    };
  }

  return {
    // State
    banners, selectedBannerIndex, isLoaded, loadError,
    historyRows, currentResultIndex, selectedHistoryIndex, statusText,
    // Computed
    selectedBanner, currentSystem, currentBannerKey,
    // Actions
    initialize, selectBanner, pull, resetCurrentBanner,
    navigatePrev, navigateNext, navigateTo, reloadAllHistory, clearHistory,
    addCustomBanner, removeCustomBanner,
  };
});
