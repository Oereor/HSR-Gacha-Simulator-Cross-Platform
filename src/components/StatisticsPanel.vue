<script setup lang="ts">
import { usePityStatsStore } from '@/stores/usePityStatsStore';
import { useLocalizationService } from '@/services/useLocalizationService';

const pityStats = usePityStatsStore();
const l10n = useLocalizationService();
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ l10n.get('ui.group.statistics') }}
    </div>

    <!-- Total pulls -->
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ pityStats.totalPullsText }}
    </div>

    <!-- 5★ row -->
    <div class="flex items-center gap-2 text-sm mb-1">
      <span class="text-gold min-w-[80px]">★★★★★  {{ l10n.get('ui.stats.rarity_5star') }}</span>
      <span class="text-gold font-bold">{{ pityStats.goldCount }}</span>
      <span class="text-text-muted">{{ pityStats.goldRate }}</span>
    </div>

    <!-- Missed stats (event banners only) -->
    <div
      v-if="pityStats.showMissedStats"
      class="text-purple text-[13px] ml-4 mb-1"
    >
      ↳ {{ pityStats.missedGoldStats }}
    </div>

    <!-- 4★ row -->
    <div class="flex items-center gap-2 text-sm mb-1">
      <span class="text-purple min-w-[80px]">★★★★  {{ l10n.get('ui.stats.rarity_4star') }}</span>
      <span class="text-purple font-bold">{{ pityStats.purpleCount }}</span>
      <span class="text-text-muted">{{ pityStats.purpleRate }}</span>
    </div>

    <!-- 3★ row -->
    <div class="flex items-center gap-2 text-sm">
      <span class="text-blue min-w-[80px]">★★★  {{ l10n.get('ui.stats.rarity_3star') }}</span>
      <span class="text-blue font-bold">{{ pityStats.blueCount }}</span>
      <span class="text-text-muted">{{ pityStats.blueRate }}</span>
    </div>
  </div>
</template>
