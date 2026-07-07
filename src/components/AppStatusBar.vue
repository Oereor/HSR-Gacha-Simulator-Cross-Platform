<script setup lang="ts">
import { computed } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';

const gacha = useGachaStore();
const l10n = useLocalizationService();

const statusText = computed(() => gacha.statusText);
</script>

<template>
  <footer class="flex items-center justify-between h-8 px-3 bg-status-bg text-text-dim text-sm shrink-0">
    <span>{{ statusText }}</span>
    <div class="flex items-center gap-2">
      <span class="text-xs">{{ l10n.get('ui.lang.selector') }}</span>
      <select
        :value="l10n.currentLanguage.value"
        @change="l10n.setLanguage(($event.target as HTMLSelectElement).value)"
        class="bg-card-bg text-white border border-card-border rounded px-2 py-0.5 text-xs cursor-pointer"
      >
        <option v-for="lang in l10n.availableLanguages.value" :key="lang" :value="lang">
          {{ lang }}
        </option>
      </select>
    </div>
  </footer>
</template>
