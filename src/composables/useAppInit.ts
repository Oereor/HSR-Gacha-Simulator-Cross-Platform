import { ref, onMounted } from 'vue';
import { useGachaStore } from '@/stores/useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';

const isInitialized = ref(false);
const isError = ref<string | null>(null);

export function useAppInit() {
  if (isInitialized.value) return { isInitialized, isError };

  const gacha = useGachaStore();
  const l10n = useLocalizationService();

  onMounted(async () => {
    if (isInitialized.value) return;
    try {
      await l10n.loadAsync();
      await gacha.initialize();
      isInitialized.value = true;
    } catch (err) {
      isError.value = err instanceof Error ? err.message : String(err);
    }
  });

  return { isInitialized, isError };
}
