<script setup lang="ts">
import { useGachaStore } from '@/stores/useGachaStore';
import { useResultCardStore } from '@/stores/useResultCardStore';
import { useLocalizationService } from '@/services/useLocalizationService';

const gacha = useGachaStore();
const resultCard = useResultCardStore();
const l10n = useLocalizationService();
</script>

<template>
  <div class="flex items-center justify-center gap-4 mt-3">
    <button
      @click="gacha.navigatePrev()"
      class="px-3 py-1 bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border rounded text-text-primary text-sm cursor-pointer transition-colors min-w-[80px]"
    >
      {{ l10n.get('ui.button.prev_page') }}
    </button>

    <span class="text-text-dim text-sm min-w-[100px] text-center">
      {{ resultCard.indexText }}
    </span>

    <button
      @click="gacha.navigateNext()"
      class="px-3 py-1 bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border rounded text-text-primary text-sm cursor-pointer transition-colors min-w-[80px]"
    >
      {{ l10n.get('ui.button.next_page') }}
    </button>
  </div>
</template>
