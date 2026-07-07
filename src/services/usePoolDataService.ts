import type { ItemData, ItemDataDto, EventPoolConfigEntry, EventPoolEntryDto, MasterLookup } from '@/types';
import { ItemType, ItemRarity, PathType, ElementType, masterLookupKey } from '@/types';

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
