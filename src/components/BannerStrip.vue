<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import BannerPill from './BannerPill.vue';

const gacha = useGachaStore();
const l10n = useLocalizationService();

const scrollContainer = ref<HTMLDivElement | null>(null);

const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollButtons() {
  const el = scrollContainer.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function scrollLeft() {
  scrollContainer.value?.scrollBy({ left: -200, behavior: 'smooth' });
}

function scrollRight() {
  scrollContainer.value?.scrollBy({ left: 200, behavior: 'smooth' });
}

function onWheel(e: WheelEvent) {
  const el = e.currentTarget as HTMLDivElement;
  el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
}

// Auto-scroll selected pill into view
watch(() => gacha.selectedBannerIndex, () => {
  const el = scrollContainer.value;
  if (!el) return;
  const pills = el.children;
  const selected = pills[gacha.selectedBannerIndex] as HTMLElement | undefined;
  if (selected) {
    selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
});

onMounted(() => {
  updateScrollButtons();
});
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-3">
    <div class="text-text-primary text-sm font-semibold mb-2">
      {{ l10n.get('ui.group.banner_selection') }}
    </div>
    <div class="flex items-center gap-1">
      <button
        @click="scrollLeft"
        class="shrink-0 w-6 h-6 flex items-center justify-center text-text-dim hover:text-white cursor-pointer bg-card-bg border border-card-border rounded disabled:opacity-30"
        :disabled="!canScrollLeft"
      >
        ◀
      </button>
      <div
        ref="scrollContainer"
        class="flex gap-2 overflow-x-hidden scroll-smooth"
        @wheel.prevent="onWheel"
        @scroll="updateScrollButtons"
      >
        <BannerPill
          v-for="(banner, index) in gacha.banners"
          :key="banner.bannerKey"
          :banner="banner"
          :is-selected="index === gacha.selectedBannerIndex"
          @select="gacha.selectBanner(index)"
        />
      </div>
      <button
        @click="scrollRight"
        class="shrink-0 w-6 h-6 flex items-center justify-center text-text-dim hover:text-white cursor-pointer bg-card-bg border border-card-border rounded disabled:opacity-30"
        :disabled="!canScrollRight"
      >
        ▶
      </button>
    </div>
  </div>
</template>
