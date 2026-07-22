<script setup lang="ts">
import { watchEffect } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { useAppInit } from '@/composables/useAppInit';
import BannerStrip from '@/components/BannerStrip.vue';
import PullControls from '@/components/PullControls.vue';
import GoldItemStats from '@/components/GoldItemStats.vue';
import StatisticsPanel from '@/components/StatisticsPanel.vue';
import ResultCard from '@/components/ResultCard.vue';
import ResultNavigator from '@/components/ResultNavigator.vue';
import HistoryTable from '@/components/HistoryTable.vue';
import AppStatusBar from '@/components/AppStatusBar.vue';

const gacha = useGachaStore();
const l10n = useLocalizationService();

useAppInit();

watchEffect(() => {
  document.title = l10n.get('ui.window.title');
});
</script>

<template>
  <div class="min-h-screen bg-app-bg text-text-primary flex flex-col">
    <!-- Loading state -->
    <div v-if="!gacha.isLoaded && !gacha.loadError" class="flex-1 flex items-center justify-center">
      <div class="text-text-dim text-lg">
        {{ l10n.get('ui.status.loading') }}
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="gacha.loadError" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="text-red-400 text-lg font-semibold mb-2">
          {{ l10n.get('dialog.error.title') }}
        </div>
        <div class="text-text-dim">
          {{ l10n.get('dialog.error.init_failed', gacha.loadError) }}
        </div>
      </div>
    </div>

    <!-- Main content -->
    <template v-else>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <BannerStrip />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PullControls />
          <GoldItemStats />
          <StatisticsPanel />
        </div>
        <div>
          <ResultCard />
          <ResultNavigator />
        </div>
        <HistoryTable />
      </div>
      <AppStatusBar />
    </template>
  </div>
</template>
