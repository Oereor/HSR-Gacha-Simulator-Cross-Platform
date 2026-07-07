import { PathType, ElementType, ItemType } from '@/types';

/** Mirrors HistoryItemDisplay.RarityToStars(). */
export function rarityToStars(rarity: import('@/types').ItemRarity): string {
  switch (rarity) {
    case 3: return '★★★★★';  // Gold
    case 2: return '★★★★';   // Purple
    case 1: return '★★★';    // Blue
    default: return '?';
  }
}

/**
 * Format a PathType into its localized display name.
 * @param path — the path enum value
 * @param getLoc — function that resolves a localization key (e.g. "path.Destruction")
 */
export function formatPath(path: PathType, getLoc: (key: string) => string): string {
  if (path === PathType.Unknown) return '—';
  return getLoc(`path.${PathType[path]}`);
}

/**
 * Format an ElementType into its localized display name.
 * Returns '—' for Light Cones or Unknown elements.
 * @param element — the element enum value
 * @param type — ItemType (Avatar vs LightCone)
 * @param getLoc — function that resolves a localization key (e.g. "element.Fire")
 */
export function formatElement(
  element: ElementType,
  type: ItemType,
  getLoc: (key: string) => string,
): string {
  if (type === ItemType.LightCone || element === ElementType.Unknown) return '—';
  return getLoc(`element.${ElementType[element]}`);
}
