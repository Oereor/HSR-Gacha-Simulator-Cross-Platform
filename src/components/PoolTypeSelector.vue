<script setup lang="ts">
import { useLocalizationService } from '@/services/useLocalizationService';

const l10n = useLocalizationService();

const props = defineProps<{
  modelValue: 'Avatar' | 'LightCone';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: 'Avatar' | 'LightCone'];
}>();
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4">
    <div class="text-sm font-semibold mb-3">{{ l10n.get('ui.custom.pool_type_label') }}</div>
    <div class="flex gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value="Avatar"
          :checked="modelValue === 'Avatar'"
          @change="emit('update:modelValue', 'Avatar')"
          class="accent-gold"
        />
        <span class="text-text-primary text-sm">{{ l10n.get('ui.custom.type.avatar') }}</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          value="LightCone"
          :checked="modelValue === 'LightCone'"
          @change="emit('update:modelValue', 'LightCone')"
          class="accent-gold"
        />
        <span class="text-text-primary text-sm">{{ l10n.get('ui.custom.type.lightcone') }}</span>
      </label>
    </div>
  </div>
</template>
