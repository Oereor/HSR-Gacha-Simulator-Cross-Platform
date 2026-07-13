<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { CustomPoolConfigDto } from '@/types';
import { useGachaStore } from '@/stores/useGachaStore';
import { useCustomPoolStore } from '@/stores/useCustomPoolStore';
import { useLocalizationService } from '@/services/useLocalizationService';
import { useAppInit } from '@/composables/useAppInit';
import CustomPoolList from '@/components/CustomPoolList.vue';
import CustomPoolForm from '@/components/CustomPoolForm.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const l10n = useLocalizationService();
const gacha = useGachaStore();
const customStore = useCustomPoolStore();
const router = useRouter();

useAppInit();

// ── Delete confirmation ────────────────────────────────────────
const showDeleteConfirm = ref(false);
const deleteTargetId = ref<string | null>(null);
const deleteTargetTitle = ref('');

function onDeleteRequest(id: string) {
  const config = customStore.pools.find(p => p.id === id);
  if (!config) return;
  deleteTargetId.value = id;
  const goldName = l10n.getItemName(config.goldItem.name ?? '');
  const typeKey = config.poolType === 'Avatar' ? 'ui.custom.type.avatar' : 'ui.custom.type.lightcone';
  const title = config.customTitle || `${goldName} (${l10n.get(typeKey)})`;
  deleteTargetTitle.value = title;
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

// ── Create ─────────────────────────────────────────────────────
function onCreate(config: CustomPoolConfigDto) {
  customStore.createPool(config);
  gacha.addCustomBanner(config);
}
</script>

<template>
  <div class="min-h-screen bg-app-bg text-text-primary p-4 space-y-6">
    <!-- Back link -->
    <router-link
      to="/"
      class="inline-block text-sm text-text-dim hover:text-text-primary transition-colors"
    >
      {{ l10n.get('ui.custom.back') }}
    </router-link>

    <!-- Page title -->
    <h1 class="text-lg font-semibold text-text-primary">
      {{ l10n.get('ui.custom.page_title') }}
    </h1>

    <!-- Existing custom pools -->
    <CustomPoolList
      :pools="customStore.pools"
      @delete="onDeleteRequest"
    />

    <!-- Create form -->
    <CustomPoolForm @create="onCreate" />

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
