<script setup lang="ts">
import type { CustomPoolConfigDto } from '@/types';
import { useLocalizationService } from '@/services/useLocalizationService';

const l10n = useLocalizationService();

defineProps<{
  pools: CustomPoolConfigDto[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

function getDisplayTitle(config: CustomPoolConfigDto): string {
  if (config.customTitle) return config.customTitle;
  const goldName = l10n.getItemName(config.goldItem.name ?? '');
  const typeKey = config.poolType === 'Avatar' ? 'ui.custom.type.avatar' : 'ui.custom.type.lightcone';
  const typeLabel = l10n.get(typeKey);
  return `${goldName} (${typeLabel})`;
}

function getPurpleNames(config: CustomPoolConfigDto): string {
  return config.purpleItems
    .map(p => l10n.getItemName(p.name ?? ''))
    .join(', ');
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-text-primary">
        {{ l10n.get('ui.custom.your_pools') }} ({{ pools.length }})
      </h3>
    </div>

    <!-- Empty state -->
    <div v-if="pools.length === 0" class="text-sm text-text-muted py-2">
      {{ l10n.get('ui.custom.no_pools') }}
    </div>

    <!-- Pool list -->
    <div v-else class="space-y-2">
      <div
        v-for="pool in pools"
        :key="pool.id"
        class="flex items-start justify-between bg-app-bg border border-card-border rounded-lg p-3"
      >
        <div class="min-w-0">
          <div class="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <span class="text-gold">&#11088;</span>
            {{ getDisplayTitle(pool) }}
          </div>
          <div class="text-xs text-text-dim mt-1">
            {{ l10n.get('ui.custom.purple_items_list') }}
            {{ getPurpleNames(pool) }}
          </div>
        </div>
        <button
          @click="emit('delete', pool.id)"
          class="shrink-0 ml-3 px-2 py-1 text-xs text-text-dim hover:text-red-400 hover:bg-btn-reset rounded transition-colors cursor-pointer"
          :title="l10n.get('dialog.delete_custom_pool.confirm')"
        >
          &#128465;
        </button>
      </div>
    </div>
  </div>
</template>
