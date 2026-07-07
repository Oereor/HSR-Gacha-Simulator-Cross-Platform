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

/** Mirrors HistoryItemDisplay.RarityToStars(). */
export function rarityToStars(rarity: ItemRarity): string {
  switch (rarity) {
    case ItemRarity.Gold:   return '★★★★★';
    case ItemRarity.Purple: return '★★★★';
    case ItemRarity.Blue:   return '★★★';
    default:                return '?';
  }
}
