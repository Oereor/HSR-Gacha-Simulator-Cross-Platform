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

// ── Save / Load ──────────────────────────────────────────────────
const statusMessage = ref('');
const statusIsError = ref(false);
let statusTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(msg: string, isError = false) {
  statusMessage.value = msg;
  statusIsError.value = isError;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMessage.value = '';
  }, 4000);
}

// Save
function onSave() {
  const saved = customStore.exportToFile();
  if (saved) {
    setStatus(l10n.get('ui.custom.save_success'));
  } else {
    setStatus(l10n.get('ui.custom.no_pools_to_save'), true);
  }
}

// Load
const fileInputRef = ref<HTMLInputElement | null>(null);
const importConfirmVisible = ref(false);
const importData = ref<CustomPoolConfigDto[] | null>(null);

function onLoadClick() {
  fileInputRef.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const pools = await customStore.validateImportFile(file);
    if (customStore.pools.length > 0) {
      // Show confirmation before replacing
      importData.value = pools;
      importConfirmVisible.value = true;
    } else {
      // No existing pools — load directly
      commitImport(pools);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(l10n.get('ui.custom.load_error', message), true);
  } finally {
    // Reset file input so the same file can be re-selected
    input.value = '';
  }
}

function commitImport(pools: CustomPoolConfigDto[]) {
  // 1. Remove all existing custom banners from gacha store
  for (const pool of customStore.pools) {
    gacha.removeCustomBanner(pool.id);
  }

  // 2. Replace pool data in custom store
  const truncated = customStore.replaceAll(pools);

  // 3. Add all imported custom banners
  for (const pool of customStore.pools) {
    gacha.addCustomBanner(pool);
  }

  // 4. Success message
  setStatus(l10n.get('ui.custom.load_success', String(customStore.pools.length)));

  // 5. Truncation warning if needed
  if (truncated > 0) {
    setStatus(
      l10n.get('ui.custom.load_truncated', String(customStore.maxPools), String(truncated)),
      true
    );
  }
}

function onImportConfirm() {
  if (importData.value) {
    commitImport(importData.value);
  }
  importConfirmVisible.value = false;
  importData.value = null;
}

function onImportCancel() {
  importConfirmVisible.value = false;
  importData.value = null;
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

    <!-- Save / Load toolbar -->
    <div class="flex items-center gap-2">
      <button
        @click="onSave"
        :disabled="customStore.isEmpty"
        class="px-4 py-1.5 text-sm font-semibold rounded bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border text-text-primary cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {{ l10n.get('ui.custom.save') }}
      </button>
      <button
        @click="onLoadClick"
        class="px-4 py-1.5 text-sm font-semibold rounded bg-btn-primary hover:bg-btn-hover active:bg-btn-active border border-card-border text-text-primary cursor-pointer transition-colors"
      >
        {{ l10n.get('ui.custom.load') }}
      </button>
      <!-- Hidden file input for Load -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        class="hidden"
        @change="onFileSelected"
      />
    </div>

    <!-- Status message (auto-clears after 4s) -->
    <p
      v-if="statusMessage"
      class="text-sm"
      :class="statusIsError ? 'text-red-400' : 'text-green-400'"
    >
      {{ statusMessage }}
    </p>

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

    <!-- Import confirmation dialog -->
    <ConfirmDialog
      :visible="importConfirmVisible"
      :title="l10n.get('dialog.import_custom_pools.title')"
      :message="l10n.get('dialog.import_custom_pools.message', importData ? String(importData.length) : '0')"
      :confirmLabel="l10n.get('dialog.import_custom_pools.confirm')"
      @confirm="onImportConfirm"
      @cancel="onImportCancel"
    />
  </div>
</template>
