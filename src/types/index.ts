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

// ── Custom pool types ────────────────────────────────────────────────

/**
 * Serializable DTO for a user-created custom event pool.
 * Stored in localStorage. Does NOT contain GachaSystem instances.
 */
export interface CustomPoolConfigDto {
  /** Stable UUID v4, generated at creation time. */
  id: string;
  /** Pool type: "Avatar" or "LightCone". */
  poolType: 'Avatar' | 'LightCone';
  /** The full ItemDataDto for the rate-up gold item. */
  goldItem: ItemDataDto;
  /** Exactly 3 ItemDataDto entries for rate-up purple items. */
  purpleItems: [ItemDataDto, ItemDataDto, ItemDataDto];
  /** User-provided custom title, or empty string for auto-generation. */
  customTitle: string;
  /** Unix timestamp (ms) of creation. */
  createdAt: number;
}
