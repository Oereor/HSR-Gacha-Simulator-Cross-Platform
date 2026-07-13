<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { useCustomPoolStore } from '@/stores/useCustomPoolStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import BannerPill from './BannerPill.vue';
import ConfirmDialog from './ConfirmDialog.vue';

const gacha = useGachaStore();
const customStore = useCustomPoolStore();
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

// ── Custom pool delete ──────────────────────────────────────────
const showDeleteConfirm = ref(false);
const deleteTargetId = ref<string | null>(null);
const deleteTargetTitle = ref('');

function onDeleteCustom(poolId: string) {
  const config = customStore.pools.find(p => p.id === poolId);
  if (!config) return;
  deleteTargetId.value = poolId;
  const goldName = l10n.getItemName(config.goldItem.name ?? '');
  const typeKey = config.poolType === 'Avatar' ? 'ui.custom.type.avatar' : 'ui.custom.type.lightcone';
  deleteTargetTitle.value = config.customTitle || `${goldName} (${l10n.get(typeKey)})`;
  showDeleteConfirm.value = true;
}

function onDeleteConfirm() {
  if (!deleteTargetId.value) return;
  customStore.deletePool(deleteTargetId.value);
  gacha.removeCustomBanner(deleteTargetId.value);
  showDeleteConfirm.value = false;
  deleteTargetId.value = null;
}

function onDeleteCancel() {
  showDeleteConfirm.value = false;
  deleteTargetId.value = null;
}
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
          :is-custom="banner.isCustom ?? false"
          @select="gacha.selectBanner(index)"
          @delete="banner.isCustom ? onDeleteCustom(banner.customPoolId!) : null"
        />
        <!-- Add Custom entry pill -->
        <router-link
          to="/custom"
          class="shrink-0 px-[14px] py-[5px] text-[13px] font-semibold rounded-[14px] cursor-pointer transition-colors border bg-card-bg border-dashed border-card-border text-text-dim hover:border-purple hover:text-purple no-underline select-none"
        >
          &#10133; {{ l10n.get('ui.custom.add') }}
        </router-link>
      </div>
      <button
        @click="scrollRight"
        class="shrink-0 w-6 h-6 flex items-center justify-center text-text-dim hover:text-white cursor-pointer bg-card-bg border border-card-border rounded disabled:opacity-30"
        :disabled="!canScrollRight"
      >
        ▶
      </button>
    </div>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog
      :visible="showDeleteConfirm"
      :title="l10n.get('dialog.delete_custom_pool.title')"
      :message="l10n.get('dialog.delete_custom_pool.message', deleteTargetTitle)"
      :confirmLabel="l10n.get('dialog.delete_custom_pool.confirm')"
      @confirm="onDeleteConfirm"
      @cancel="onDeleteCancel"
    />
  </div>
</template>
