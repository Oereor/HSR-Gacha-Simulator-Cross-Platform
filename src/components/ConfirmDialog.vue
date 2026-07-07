<script setup lang="ts">
import { ref } from 'vue';
import { useLocalizationService } from '@/services/useLocalizationService';

const l10n = useLocalizationService();

defineProps<{
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="emit('cancel')"
  >
    <div class="bg-card-bg border border-card-border rounded-lg p-6 min-w-[320px] max-w-[440px] shadow-xl">
      <h3 class="text-white text-lg font-semibold mb-4">{{ title }}</h3>
      <p class="text-text-dim text-sm mb-6 whitespace-pre-line">{{ message }}</p>
      <div class="flex justify-end gap-3">
        <button
          @click="emit('cancel')"
          class="px-4 py-1.5 bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border rounded text-text-primary text-sm cursor-pointer transition-colors"
        >
          {{ cancelLabel ?? l10n.get('ui.button.prev_page') }}
        </button>
        <button
          @click="emit('confirm')"
          class="px-4 py-1.5 bg-btn-reset hover:bg-btn-reset-hover active:bg-btn-reset-active border border-btn-reset rounded text-text-primary text-sm cursor-pointer transition-colors"
        >
          {{ confirmLabel ?? l10n.get('ui.button.reset_banner') }}
        </button>
      </div>
    </div>
  </div>
</template>
