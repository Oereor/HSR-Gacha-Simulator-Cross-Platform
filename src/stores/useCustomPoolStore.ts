import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CustomPoolConfigDto } from '@/types';

const STORAGE_KEY = 'hsr-gacha-simulator:custom-pools';

/** Maximum number of custom pools a user can create. */
const MAX_CUSTOM_POOLS = 10;

export const useCustomPoolStore = defineStore('customPool', () => {
  const pools = ref<CustomPoolConfigDto[]>([]);
  const loaded = ref(false);

  /** Load from localStorage. Call once on app init. */
  function loadFromStorage(): void {
    if (loaded.value) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Enforce the limit on load (defensive)
          pools.value = parsed.slice(0, MAX_CUSTOM_POOLS);
          if (parsed.length > MAX_CUSTOM_POOLS) {
            saveToStorage(); // trim persisted data
          }
        }
      }
    } catch (err) {
      console.warn('[CustomPoolStore] Failed to load from localStorage:', err);
      pools.value = [];
    }
    loaded.value = true;
  }

  /** Persist current state to localStorage. */
  function saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pools.value));
    } catch (err) {
      console.error('[CustomPoolStore] Failed to save to localStorage:', err);
    }
  }

  /**
   * Add a new custom pool.
   * Throws if the pool limit has been reached — callers must check `canCreate` first.
   */
  function createPool(config: CustomPoolConfigDto): CustomPoolConfigDto {
    if (pools.value.length >= MAX_CUSTOM_POOLS) {
      throw new Error(`Cannot create more than ${MAX_CUSTOM_POOLS} custom pools.`);
    }
    pools.value.push(config);
    saveToStorage();
    return config;
  }

  /** Remove a custom pool by id. Returns true if found and removed. */
  function deletePool(id: string): boolean {
    const idx = pools.value.findIndex(p => p.id === id);
    if (idx === -1) return false;
    pools.value.splice(idx, 1);
    saveToStorage();
    return true;
  }

  /** True if the user has reached the maximum number of custom pools. */
  const isAtLimit = computed(() => pools.value.length >= MAX_CUSTOM_POOLS);

  /** True if the user can still create more custom pools. */
  const canCreate = computed(() => pools.value.length < MAX_CUSTOM_POOLS);

  /** True if there are no custom pools. */
  const isEmpty = computed(() => pools.value.length === 0);

  /** Total number of custom pools. */
  const count = computed(() => pools.value.length);

  /** The maximum allowed custom pools. */
  const maxPools = MAX_CUSTOM_POOLS;

  return {
    pools,
    loaded,
    loadFromStorage,
    createPool,
    deletePool,
    isEmpty,
    count,
    isAtLimit,
    canCreate,
    maxPools,
  };
});
