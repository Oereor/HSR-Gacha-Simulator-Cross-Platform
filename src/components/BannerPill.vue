<script setup lang="ts">
defineProps<{
  banner: {
    bannerKey: string;
    displayName: string;
    bannerTitle: string;
  };
  isSelected: boolean;
  isCustom?: boolean;
}>();

const emit = defineEmits<{
  select: [];
  delete: [];
}>();
</script>

<template>
  <button
    @click="emit('select')"
    class="shrink-0 px-[14px] py-[5px] text-[13px] font-semibold rounded-[14px] cursor-pointer transition-colors border select-none relative group"
    :class="isSelected
      ? 'bg-card-border text-white'
      : 'bg-card-bg text-text-dim hover:border-text-dim'"
    :style="isCustom && !isSelected
      ? { borderColor: '#7c3aed' }
      : isSelected
        ? { borderColor: '#ffd700' }
        : {}"
  >
    <span v-if="isCustom" class="mr-1 text-purple-400">&#9881;</span>
    {{ banner.displayName }}
    <span
      v-if="isCustom"
      @click.stop="emit('delete')"
      class="ml-1.5 text-text-dim hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete this custom pool"
    >&#10005;</span>
  </button>
</template>
