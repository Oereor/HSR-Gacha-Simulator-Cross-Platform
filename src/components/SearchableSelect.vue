<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  options: { value: string; label: string }[];
  modelValue: string | null;
  placeholder: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const searchText = ref('');
const open = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
  const q = searchText.value.toLowerCase().trim();
  if (!q) return props.options;
  return props.options.filter(o => o.label.toLowerCase().includes(q));
});

const selectedLabel = computed(() => {
  if (!props.modelValue) return '';
  return props.options.find(o => o.value === props.modelValue)?.label ?? '';
});

function select(value: string) {
  emit('update:modelValue', value);
  searchText.value = '';
  open.value = false;
}

function clear() {
  emit('update:modelValue', null);
  searchText.value = '';
}

function onFocus() {
  if (!props.disabled) open.value = true;
}

function onInput() {
  if (!props.disabled) open.value = true;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    open.value = false;
    return;
  }
}

// Click outside to close
function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});

// Clear search when dropdown closes
watch(open, (val) => {
  if (!val) searchText.value = '';
});
</script>

<template>
  <div class="relative" ref="containerRef">
    <div class="flex items-center bg-card-bg border border-card-border rounded px-3 py-2"
         :class="{ 'opacity-50 cursor-not-allowed': disabled }">
      <input
        ref="inputRef"
        v-model="searchText"
        :placeholder="modelValue ? selectedLabel : placeholder"
        :disabled="disabled"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeyDown"
        class="bg-transparent flex-1 outline-none text-text-primary text-sm min-w-0"
      />
      <button v-if="modelValue && !disabled" @click="clear" class="text-text-dim hover:text-white ml-2 shrink-0">&#10005;</button>
      <span class="text-text-dim ml-1 shrink-0">&#9660;</span>
    </div>
    <ul
      v-if="open && filteredOptions.length > 0 && !disabled"
      class="absolute z-50 mt-1 w-full bg-card-bg border border-card-border rounded max-h-48 overflow-y-auto shadow-lg"
    >
      <li
        v-for="opt in filteredOptions"
        :key="opt.value"
        @click="select(opt.value)"
        class="px-3 py-1.5 text-sm cursor-pointer hover:bg-card-border text-text-primary"
        :class="{ 'bg-card-border': opt.value === modelValue }"
      >
        {{ opt.label }}
      </li>
    </ul>
    <div
      v-if="open && filteredOptions.length === 0 && !disabled"
      class="absolute z-50 mt-1 w-full bg-card-bg border border-card-border rounded px-3 py-2 text-sm text-text-muted shadow-lg"
    >
      No matches
    </div>
  </div>
</template>
