<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ItemData } from '@/types';
import { useLocalizationService } from '@/services/useLocalizationService';

const l10n = useLocalizationService();

const props = defineProps<{
  availableItems: ItemData[];
  modelValue: ItemData[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ItemData[]];
}>();

const availableFilter = ref('');

const filteredAvailable = computed(() => {
  const q = availableFilter.value.toLowerCase().trim();
  if (!q) return props.availableItems;
  return props.availableItems.filter(i =>
    l10n.getItemName(i.Name).toLowerCase().includes(q)
  );
});

function addItem(item: ItemData) {
  if (props.modelValue.length >= 3) return;
  emit('update:modelValue', [...props.modelValue, item]);
}

function removeItem(index: number) {
  const updated = [...props.modelValue];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-sm font-semibold mb-3">
      {{ l10n.get('ui.custom.purple_items_label') }} — {{ l10n.get('ui.custom.select_exactly_3') }}
    </div>
    <div class="grid grid-cols-2 gap-4">
      <!-- Available column -->
      <div>
        <input
          v-model="availableFilter"
          :placeholder="l10n.get('ui.custom.filter') ?? 'Filter...'"
          class="w-full bg-app-bg border border-card-border rounded px-2 py-1 text-sm text-text-primary mb-2 outline-none"
        />
        <div class="max-h-48 overflow-y-auto space-y-1">
          <div
            v-for="item in filteredAvailable"
            :key="item.Name"
            class="flex items-center justify-between px-2 py-1 rounded hover:bg-card-border text-sm"
          >
            <span class="text-text-primary">{{ l10n.getItemName(item.Name) }}</span>
            <button
              @click="addItem(item)"
              :disabled="modelValue.length >= 3"
              class="text-text-dim hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed ml-2"
            >
              &#10133;
            </button>
          </div>
          <div v-if="filteredAvailable.length === 0" class="text-text-muted text-sm px-2 py-1">
            No matches
          </div>
        </div>
      </div>
      <!-- Selected column -->
      <div>
        <div class="text-xs text-text-muted mb-2">
          {{ modelValue.length }}/3 {{ l10n.get('ui.custom.selected') }}
        </div>
        <div class="space-y-1">
          <div
            v-for="(item, idx) in modelValue"
            :key="item.Name"
            class="flex items-center justify-between px-2 py-1 rounded bg-card-border text-sm"
          >
            <span class="text-text-primary">{{ l10n.getItemName(item.Name) }}</span>
            <button @click="removeItem(idx)" class="text-text-dim hover:text-red-400 ml-2">&#10005;</button>
          </div>
          <div
            v-for="n in (3 - modelValue.length)"
            :key="'empty-' + n"
            class="px-2 py-1 text-sm text-text-muted border border-dashed border-card-border rounded"
          >
            — {{ l10n.get('ui.custom.empty_slot') }} —
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
