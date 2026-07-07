import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useGachaStore } from './useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { useIconService } from '@/services/useIconService';
import { ItemType, ElementType, PathType } from '@/types';
import { getRarityForegroundColor, getRarityBorderColor, getElementColor, rarityToStars } from '@/composables/useRarityColors';
import { formatPath, formatElement } from '@/utils/formatters';

export const useResultCardStore = defineStore('resultCard', () => {
  const gacha = useGachaStore();
  const l10n = useLocalizationService();
  const icons = useIconService();

  const getLoc = (key: string) => l10n.get(key);

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
    currentItem.value ? formatPath(currentItem.value.Path, getLoc) : ''
  );

  // ── Element ────────────────────────────────────────────────────
  const elementLabel = computed(() => {
    const item = currentItem.value;
    if (!item) return '';
    if (item.Type === ItemType.LightCone || item.ElementType === ElementType.Unknown) return '—';
    return formatElement(item.ElementType, item.Type, getLoc);
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
    return icons.getUrl(`Path_${PathType[item.Path]}.png`);
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
