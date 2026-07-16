<script setup lang="ts">
import { useGachaStore } from '@/stores/useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { getRarityForegroundColor, getElementColor } from '@/composables/useRarityColors';
import { ElementType, ItemType } from '@/types';

const gacha = useGachaStore();
const l10n = useLocalizationService();

/** Jump the result card to the item corresponding to this history row. */
function selectRow(rowIndex: number): void {
  gacha.navigateTo(rowIndex - 1);
}

/** Whether this row was the last one clicked (drives highlight). */
function isSelected(rowIndex: number): boolean {
  return gacha.selectedHistoryIndex === rowIndex - 1;
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ l10n.get('ui.group.pull_history') }}
    </div>

    <div class="overflow-y-auto max-h-[400px]">
      <table class="w-full text-sm border-collapse">
        <thead class="sticky top-0 bg-card-bg z-10">
          <tr class="text-text-dim text-left border-b border-[#2a2a4e]">
            <th class="p-2 w-[50px]">{{ l10n.get('ui.history.header.number') }}</th>
            <th class="p-2 w-[180px]">{{ l10n.get('ui.history.header.name') }}</th>
            <th class="p-2 w-[90px]">{{ l10n.get('ui.history.header.rarity') }}</th>
            <th class="p-2 w-[60px]">{{ l10n.get('ui.history.header.type') }}</th>
            <th class="p-2 w-[90px]">{{ l10n.get('ui.history.header.path') }}</th>
            <th class="p-2 w-[80px]">{{ l10n.get('ui.history.header.element') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in gacha.historyRows"
            :key="row.index"
            @click="selectRow(row.index)"
            :class="[
              'border-b border-[#2a2a4e] transition-colors',
              isSelected(row.index)
                ? 'bg-[#2a3a5e] cursor-default'
                : 'hover:bg-[#1e2a4a] cursor-pointer'
            ]"
          >
            <td class="p-2 text-text-dim">{{ row.index }}</td>
            <td class="p-2 text-text-primary">{{ row.name }}</td>
            <td class="p-2 font-bold" :style="{ color: getRarityForegroundColor(row.rarity) }">
              {{ row.rarityStars }}
            </td>
            <td class="p-2 text-text-dim">{{ row.typeLabel }}</td>
            <td class="p-2 text-text-dim">{{ row.pathLabel }}</td>
            <td
              class="p-2"
              :style="{
                color: row.elementType !== ElementType.Unknown
                  ? getElementColor(row.elementType)
                  : '#c0c0c0'
              }"
            >
              {{ row.elementLabel }}
            </td>
          </tr>
          <tr v-if="gacha.historyRows.length === 0">
            <td colspan="6" class="p-4 text-center text-text-muted">
              &mdash;
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
