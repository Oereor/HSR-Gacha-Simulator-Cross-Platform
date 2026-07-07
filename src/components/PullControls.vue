<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { usePityStatsStore } from '@/stores/usePityStatsStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import ConfirmDialog from './ConfirmDialog.vue';

const gacha = useGachaStore();
const pityStats = usePityStatsStore();
const l10n = useLocalizationService();

const showResetConfirm = ref(false);

const bannerName = computed(() => gacha.selectedBanner?.displayName ?? '');

function onResetClick() {
  showResetConfirm.value = true;
}

function onResetConfirm() {
  showResetConfirm.value = false;
  gacha.resetCurrentBanner();
}

function onResetCancel() {
  showResetConfirm.value = false;
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ l10n.get('ui.group.pull_controls') }}
    </div>

    <!-- Pull buttons -->
    <div class="flex gap-3 mb-4">
      <button
        @click="gacha.pull(1)"
        class="px-4 py-2 bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border rounded text-text-primary text-base font-bold cursor-pointer transition-colors min-w-[120px]"
      >
        {{ l10n.get('ui.button.warp_x1') }}
      </button>
      <button
        @click="gacha.pull(10)"
        class="px-4 py-2 bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border rounded text-text-primary text-base font-bold cursor-pointer transition-colors min-w-[120px]"
      >
        {{ l10n.get('ui.button.warp_x10') }}
      </button>
    </div>

    <!-- Reset button -->
    <button
      @click="onResetClick"
      class="px-[14px] py-2 bg-btn-reset hover:bg-btn-reset-hover active:bg-btn-reset-active border border-btn-reset rounded text-text-primary text-sm font-semibold cursor-pointer transition-colors min-w-[120px] mb-4"
    >
      {{ l10n.get('ui.button.reset_banner') }}
    </button>

    <!-- Pity display -->
    <div class="space-y-1 text-sm">
      <div class="flex items-center gap-1">
        <span class="text-text-dim">{{ l10n.get('ui.pity.gold_pity') }}</span>
        <span class="text-gold font-semibold">{{ pityStats.goldPity }}</span>
        <span class="text-text-muted">{{ l10n.get('ui.pity.gold_since') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-text-dim">{{ l10n.get('ui.pity.gold_guarantee') }}</span>
        <span :style="{ color: pityStats.goldGuaranteeColor }" class="font-semibold">
          {{ pityStats.goldGuarantee }}
        </span>
      </div>
      <div class="flex items-center gap-1 mt-2">
        <span class="text-text-dim">{{ l10n.get('ui.pity.purple_pity') }}</span>
        <span class="text-purple font-semibold">{{ pityStats.purplePity }}</span>
        <span class="text-text-muted">{{ l10n.get('ui.pity.purple_since') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-text-dim">{{ l10n.get('ui.pity.purple_guarantee') }}</span>
        <span :style="{ color: pityStats.purpleGuaranteeColor }" class="font-semibold">
          {{ pityStats.purpleGuarantee }}
        </span>
      </div>
    </div>

    <!-- Reset confirmation dialog -->
    <ConfirmDialog
      :visible="showResetConfirm"
      :title="l10n.get('dialog.reset_banner.title')"
      :message="l10n.get('dialog.reset_banner.message', bannerName)"
      @confirm="onResetConfirm"
      @cancel="onResetCancel"
    />
  </div>
</template>
