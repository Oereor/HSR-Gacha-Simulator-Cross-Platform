<script setup lang="ts">
import { useResultCardStore } from '@/stores/useResultCardStore';
import { useLocalizationService } from '@/services/useLocalizationService';

const resultCard = useResultCardStore();
const l10n = useLocalizationService();

function onImgError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-text-primary text-sm font-semibold mb-3">
      {{ l10n.get('ui.group.latest_result') }}
    </div>

    <div
      class="flex items-center rounded-lg p-4 min-h-[80px] min-w-[400px] max-w-[600px] mx-auto transition-colors"
      :style="{ border: `3px solid ${resultCard.cardBorderColor}`, backgroundColor: '#16213e' }"
    >
      <!-- Path icon (left) -->
      <div v-if="resultCard.showPathIcon" class="shrink-0 mr-3 flex items-center w-12 h-12">
        <img
          :src="resultCard.pathIconUrl!"
          alt="Path"
          class="max-w-12 max-h-12 object-contain"
          @error="onImgError"
        />
      </div>
      <div v-else class="shrink-0 w-12 h-12 mr-3" />

      <!-- Center text stack -->
      <div class="flex-1 flex flex-col items-center">
        <span
          class="text-xl font-bold text-center"
          :style="{ color: resultCard.rarityColor }"
        >
          {{ resultCard.rarityStars }}
        </span>
        <span class="text-[22px] font-bold text-text-primary text-center">
          {{ resultCard.itemName }}
        </span>
        <div class="flex items-center gap-0.5 text-sm text-text-dim text-center">
          <span class="text-text-dim">{{ resultCard.itemTypeLabel }}</span>
          <span>{{ l10n.get('ui.result.separator') }}</span>
          <span class="text-text-dim">{{ resultCard.pathLabel }}</span>
          <span>{{ l10n.get('ui.result.separator') }}</span>
          <span :style="{ color: resultCard.elementColor }">{{ resultCard.elementLabel }}</span>
        </div>
      </div>

      <!-- Element icon (right) -->
      <div v-if="resultCard.showElementIcon" class="shrink-0 ml-3 flex items-center w-12 h-12">
        <img
          :src="resultCard.elementIconUrl!"
          alt="Element"
          class="max-w-12 max-h-12 object-contain"
          @error="onImgError"
        />
      </div>
      <div v-else class="shrink-0 w-12 h-12 ml-3" />
    </div>
  </div>
</template>
