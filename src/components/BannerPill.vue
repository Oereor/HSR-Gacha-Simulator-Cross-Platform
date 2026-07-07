<script setup lang="ts">
defineProps<{
  banner: {
    bannerKey: string;
    displayName: string;
    bannerTitle: string;
  };
  isSelected: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();
</script>

<template>
  <button
    @click="emit('select')"
    class="shrink-0 px-[14px] py-[5px] text-[13px] font-semibold rounded-[14px] cursor-pointer transition-colors border select-none"
    :class="isSelected
      ? 'bg-card-border border-gold text-white'
      : 'bg-card-bg border-card-border text-text-dim hover:border-text-dim'"
  >
    {{ banner.displayName }}
  </button>
</template>
