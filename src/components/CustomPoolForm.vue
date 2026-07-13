<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ItemType, ItemRarity, type ItemData, type ItemDataDto, type CustomPoolConfigDto } from '@/types';
import { useLocalizationService } from '@/services/useLocalizationService';
import { useCustomPoolStore } from '@/stores/useCustomPoolStore';
import { loadFromFile, toItemData, itemDataToDto } from '@/services/usePoolDataService';
import PoolTypeSelector from '@/components/PoolTypeSelector.vue';
import SearchableSelect from '@/components/SearchableSelect.vue';
import PurpleItemsTransfer from '@/components/PurpleItemsTransfer.vue';

const l10n = useLocalizationService();
const customStore = useCustomPoolStore();

const emit = defineEmits<{
  create: [config: CustomPoolConfigDto];
}>();

// ── Refs for pool reference data ──────────────────────────────────
const allGoldItems = ref<ItemData[]>([]);
const allPurpleItems = ref<ItemData[]>([]);

// Load reference data on mount
async function loadReferenceData() {
  const [gold, purple] = await Promise.all([
    loadFromFile('/PoolConfigs/AllGoldPoolConfig.json'),
    loadFromFile('/PoolConfigs/OrdinaryPurplePoolConfig.json'),
  ]);
  allGoldItems.value = gold;
  allPurpleItems.value = purple;
}
loadReferenceData();

// ── Form state ────────────────────────────────────────────────────
const poolType = ref<'Avatar' | 'LightCone'>('Avatar');
const goldItem = ref<ItemData | null>(null);
const purpleItems = ref<ItemData[]>([]);
const customTitle = ref('');

// ── Computed options ──────────────────────────────────────────────

/** All gold items filtered by the selected pool type. */
const goldOptions = computed(() =>
  allGoldItems.value
    .filter(i => i.Rarity === ItemRarity.Gold && i.Type === (poolType.value === 'Avatar' ? ItemType.Avatar : ItemType.LightCone))
    .map(i => ({
      value: i.Name,
      label: l10n.getItemName(i.Name),
    }))
);

/** Purple items of matching type, excluding the selected gold item. */
const availablePurpleItems = computed(() =>
  allPurpleItems.value.filter(i => {
    if (i.Rarity !== ItemRarity.Purple) return false;
    const matchType = poolType.value === 'Avatar' ? ItemType.Avatar : ItemType.LightCone;
    if (i.Type !== matchType) return false;
    if (goldItem.value && i.Name === goldItem.value.Name) return false;
    return true;
  })
);

/** Watch gold item — resolve Name → ItemData. */
watch(goldOptions, () => {
  // Clear selection if current gold item is no longer in options
  if (goldItem.value) {
    const stillValid = goldOptions.value.some(o => o.value === goldItem.value!.Name);
    if (!stillValid) goldItem.value = null;
  }
});

watch(poolType, () => {
  goldItem.value = null;
  purpleItems.value = [];
});

const goldSelectedValue = computed(() => goldItem.value?.Name ?? null);

function onGoldSelect(value: string | null) {
  if (!value) {
    goldItem.value = null;
    return;
  }
  const found = allGoldItems.value.find(i => i.Name === value);
  goldItem.value = found ?? null;
  // Clear purple selection since the available items change
  purpleItems.value = [];
}

const defaultTitle = computed(() => {
  if (!goldItem.value) return '';
  const goldName = l10n.getItemName(goldItem.value.Name);
  const typeLabel = l10n.get(poolType.value === 'Avatar' ? 'ui.custom.type.avatar' : 'ui.custom.type.lightcone');
  return `${goldName} (${typeLabel})`;
});

const isValid = computed(() =>
  goldItem.value !== null && purpleItems.value.length === 3
);

// ── Submit ────────────────────────────────────────────────────────
function onSubmit() {
  if (!isValid.value || !customStore.canCreate) return;

  const purpleDtos = purpleItems.value.map(itemDataToDto);
  const config: CustomPoolConfigDto = {
    id: crypto.randomUUID(),
    poolType: poolType.value,
    goldItem: itemDataToDto(goldItem.value!),
    purpleItems: [purpleDtos[0], purpleDtos[1], purpleDtos[2]],
    customTitle: customTitle.value.trim(),
    createdAt: Date.now(),
  };
  emit('create', config);

  // Reset form
  goldItem.value = null;
  purpleItems.value = [];
  customTitle.value = '';
}
</script>

<template>
  <div class="bg-card-bg border border-card-border rounded-lg p-4 space-y-6">
    <h3 class="text-sm font-semibold text-text-primary">
      {{ l10n.get('ui.custom.create_button') }}
    </h3>

    <!-- 1. Pool Type -->
    <PoolTypeSelector v-model="poolType" />

    <!-- 2. Gold Item -->
    <div class="space-y-2">
      <label class="text-sm font-semibold text-text-primary">{{ l10n.get('ui.custom.gold_item_label') }}</label>
      <SearchableSelect
        :options="goldOptions"
        :modelValue="goldSelectedValue"
        @update:modelValue="onGoldSelect"
        :placeholder="l10n.get('ui.custom.gold_item_placeholder')"
      />
      <p class="text-xs text-text-dim">
        {{ l10n.get('ui.custom.gold_item_selected') }}
        <span v-if="goldItem" class="text-gold">{{ l10n.getItemName(goldItem.Name) }}</span>
        <span v-else class="text-text-muted">{{ l10n.get('ui.custom.gold_item_none') }}</span>
      </p>
    </div>

    <!-- 3. Purple Items -->
    <PurpleItemsTransfer
      :availableItems="availablePurpleItems"
      v-model="purpleItems"
    />

    <!-- 4. Title -->
    <div class="space-y-2">
      <label class="text-sm font-semibold text-text-primary">{{ l10n.get('ui.custom.title_label') }}</label>
      <input
        v-model="customTitle"
        :placeholder="l10n.get('ui.custom.title_placeholder')"
        class="w-full bg-card-bg border border-card-border rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-text-dim"
      />
      <p class="text-xs text-text-dim">
        {{ l10n.get('ui.custom.title_hint') }} <span class="text-text-primary">{{ defaultTitle }}</span>
      </p>
    </div>

    <!-- Create button -->
    <div>
      <button
        @click="onSubmit"
        :disabled="!isValid || customStore.isAtLimit"
        class="px-6 py-2 bg-gold text-app-bg font-semibold text-sm rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        :title="customStore.isAtLimit ? l10n.get('ui.custom.limit_reached', String(customStore.maxPools)) : ''"
      >
        {{ l10n.get('ui.custom.create_button') }}
      </button>
      <p v-if="customStore.isAtLimit" class="text-sm text-red-400 mt-2">
        {{ l10n.get('ui.custom.limit_reached', String(customStore.maxPools)) }}
      </p>
    </div>
  </div>
</template>
