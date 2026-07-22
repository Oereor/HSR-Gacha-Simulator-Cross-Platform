<script setup lang="ts">
import { computed } from 'vue';
import { usePityStatsStore } from '@/stores/usePityStatsStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import type { GoldItemRecord } from '@/types';

const pityStats = usePityStatsStore();
const l10n = useLocalizationService();

/**
 * Compute a color on the green→yellow→red gradient based on pull count.
 * 1 pull → green (hue 120), 60 pulls → yellow (hue ~40), 90 pulls → red (hue 0).
 * Count is clamped to [1, 90].
 */
function getPullColor(count: number): string {
  const clamped = Math.max(1, Math.min(90, count));
  const hue = 120 - ((clamped - 1) / 89) * 120;
  return `hsl(${Math.round(hue)}, 75%, 45%)`;
}

/**
 * Scale the bar width linearly.
 * 1 pull → 15%, 90 pulls → 100%.
 */
function getBarWidthPercent(count: number): string {
  const minW = 15;
  const maxW = 100;
  const clamped = Math.max(1, Math.min(90, count));
  const pct = minW + ((clamped - 1) / 89) * (maxW - minW);
  return `${Math.round(pct)}%`;
}

/** Gold records sorted descending by pull count (longest pities at top). */
const sortedRecords = computed<GoldItemRecord[]>(() => {
  const records = [...pityStats.goldItemRecords];
  records.sort((a, b) => b.pullsSinceLastGold - a.pullsSinceLastGold);
  return records;
});

/** Current pity count (pulls since last gold) as a number, for the dynamic bar. */
const currentPity = computed(() => Number(pityStats.goldPity));
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <!-- Panel title -->
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ l10n.get('ui.group.gold_stats') }}
    </div>

    <!-- Empty state: no gold items pulled yet -->
    <div v-if="!pityStats.hasGoldItemRecords" class="text-text-muted text-sm">
      {{ l10n.get('ui.gold_stats.empty') }}
    </div>

    <!-- Records list -->
    <div v-else class="space-y-2">
      <!-- Current pity row (dynamic, updates each pull) -->
      <div class="flex items-center gap-2 text-sm">
        <!-- "?" marker -->
        <span class="text-text-muted w-5 text-center font-bold">?</span>

        <!-- Colored bar -->
        <div class="flex-1 h-5 rounded-sm overflow-hidden bg-[#2a2a4e]">
          <div
            class="h-full rounded-sm transition-all duration-200"
            :style="{
              width: getBarWidthPercent(currentPity),
              backgroundColor: getPullColor(currentPity),
            }"
          />
        </div>

        <!-- Pull count -->
        <span class="text-text-primary w-6 text-right font-mono">
          {{ pityStats.goldPity }}
        </span>

        <!-- "Current pity" label -->
        <span class="text-text-dim text-xs w-20 text-right">
          {{ l10n.get('ui.gold_stats.current_pity') }}
        </span>
      </div>

      <!-- Gold item records -->
      <div
        v-for="record in sortedRecords"
        :key="record.item.Name + '|' + record.pullsSinceLastGold"
        class="flex items-center gap-2 text-sm"
      >
        <!-- Missed indicator: "!" in red, or empty space -->
        <span
          class="w-5 text-center font-bold text-xs"
          :class="record.isMissed ? 'text-red-400' : 'text-text-muted'"
        >
          {{ record.isMissed ? '!' : '' }}
        </span>

        <!-- Colored bar -->
        <div class="flex-1 h-5 rounded-sm overflow-hidden bg-[#2a2a4e]">
          <div
            class="h-full rounded-sm"
            :style="{
              width: getBarWidthPercent(record.pullsSinceLastGold),
              backgroundColor: getPullColor(record.pullsSinceLastGold),
            }"
          />
        </div>

        <!-- Pull count with "pulls" suffix -->
        <span class="text-text-primary w-16 text-right font-mono font-semibold text-xs">
          {{ l10n.get('ui.gold_stats.pull_count', record.pullsSinceLastGold) }}
        </span>

        <!-- Item name (localized) -->
        <span
          class="text-text-primary text-xs w-28 text-right truncate"
          :title="l10n.getItemName(record.item.Name)"
        >
          {{ l10n.getItemName(record.item.Name) }}
        </span>

        <!-- "Missed!" label (red, only for off-rate) -->
        <span v-if="record.isMissed" class="text-red-400 text-xs font-semibold w-14 text-right">
          {{ l10n.get('ui.gold_stats.missed') }}
        </span>
        <span v-else class="w-14" />
      </div>
    </div>
  </div>
</template>
