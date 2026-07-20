import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CustomPoolConfigDto } from '@/types';

/** Maximum number of custom pools a user can create. */
const MAX_CUSTOM_POOLS = 10;

export const useCustomPoolStore = defineStore('customPool', () => {
  const pools = ref<CustomPoolConfigDto[]>([]);

  /**
   * Add a new custom pool.
   * Throws if the pool limit has been reached — callers must check `canCreate` first.
   */
  function createPool(config: CustomPoolConfigDto): CustomPoolConfigDto {
    if (pools.value.length >= MAX_CUSTOM_POOLS) {
      throw new Error(`Cannot create more than ${MAX_CUSTOM_POOLS} custom pools.`);
    }
    pools.value.push(config);
    return config;
  }

  /** Remove a custom pool by id. Returns true if found and removed. */
  function deletePool(id: string): boolean {
    const idx = pools.value.findIndex(p => p.id === id);
    if (idx === -1) return false;
    pools.value.splice(idx, 1);
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

  /**
   * Serialize pools to JSON and trigger a browser file download.
   * Returns false if there are no pools to save.
   */
  function exportToFile(): boolean {
    if (pools.value.length === 0) return false;

    const json = JSON.stringify(pools.value, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.getFullYear() + '-'
      + String(now.getMonth() + 1).padStart(2, '0') + '-'
      + String(now.getDate()).padStart(2, '0');
    const filename = `hsr-custom-pools-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }

  /**
   * Parse and validate a File object containing custom pool JSON.
   * Returns the parsed and validated pools array.
   * Throws with a user-readable message on failure.
   */
  function validateImportFile(file: File): Promise<CustomPoolConfigDto[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            reject(new Error('Invalid JSON file.'));
            return;
          }

          if (!Array.isArray(parsed)) {
            reject(new Error('File does not contain an array of pools.'));
            return;
          }

          const valid: CustomPoolConfigDto[] = [];
          for (const item of parsed) {
            if (
              typeof item === 'object' && item !== null &&
              typeof (item as CustomPoolConfigDto).id === 'string' &&
              ((item as CustomPoolConfigDto).poolType === 'Avatar' ||
               (item as CustomPoolConfigDto).poolType === 'LightCone') &&
              typeof (item as CustomPoolConfigDto).goldItem === 'object' &&
              (item as CustomPoolConfigDto).goldItem !== null &&
              Array.isArray((item as CustomPoolConfigDto).purpleItems) &&
              (item as CustomPoolConfigDto).purpleItems.length === 3
            ) {
              valid.push(item as CustomPoolConfigDto);
            } else {
              console.warn('[CustomPoolStore] Skipping invalid pool entry:', item);
            }
          }

          if (valid.length === 0) {
            reject(new Error('No valid custom pools found in file.'));
            return;
          }

          resolve(valid);
        } catch (err) {
          // Re-throw if it's already a user-facing error
          if (err instanceof Error) {
            reject(err);
          } else {
            reject(new Error('Failed to read file.'));
          }
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Replace all current pools with the given array.
   * Enforces the 10-pool limit defensively.
   * Returns the number of pools truncated (0 if none).
   */
  function replaceAll(newPools: CustomPoolConfigDto[]): number {
    const originalLength = newPools.length;
    const truncated = newPools.slice(0, MAX_CUSTOM_POOLS);
    pools.value = truncated;
    return Math.max(0, originalLength - MAX_CUSTOM_POOLS);
  }

  return {
    pools,
    createPool,
    deletePool,
    exportToFile,
    validateImportFile,
    replaceAll,
    isEmpty,
    count,
    isAtLimit,
    canCreate,
    maxPools,
  };
});
