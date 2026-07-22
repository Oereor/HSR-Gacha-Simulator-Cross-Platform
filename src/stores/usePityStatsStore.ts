import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useGachaStore } from './useGachaStore';
import { useLocalizationService } from '@/services/useLocalizationService';

export const usePityStatsStore = defineStore('pityStats', () => {
  const gacha = useGachaStore();
  const l10n = useLocalizationService();

  const sys = computed(() => {
    void gacha.statsTick; // establish reactive dependency on every pull/reset
    return gacha.currentSystem;
  });

  // ── Pity: Gold ─────────────────────────────────────────────────
  const goldPity = computed(() => String(sys.value?.nonGoldGachaCount ?? 0));

  const goldGuarantee = computed(() => {
    if (!sys.value) return '';
    return sys.value.isGuaranteed
      ? l10n.get('ui.pity.guaranteed')
      : l10n.get('ui.pity.not_guaranteed');
  });

  /** Gold color (#ffd700) when guaranteed, dim (#c0c0c0) otherwise. */
  const goldGuaranteeColor = computed(() =>
    sys.value?.isGuaranteed ? '#ffd700' : '#c0c0c0'
  );

  // ── Pity: Purple ───────────────────────────────────────────────
  const purplePity = computed(() => String(sys.value?.nonPurpleGachaCount ?? 0));

  const purpleGuarantee = computed(() => {
    if (!sys.value) return '';
    return sys.value.isPurpleGuaranteed
      ? l10n.get('ui.pity.guaranteed')
      : l10n.get('ui.pity.not_guaranteed');
  });

  const purpleGuaranteeColor = computed(() =>
    sys.value?.isPurpleGuaranteed ? '#ffd700' : '#c0c0c0'
  );

  // ── Statistics ─────────────────────────────────────────────────
  const total = computed(() => sys.value?.totalPulls ?? 0);
  const goldCount = computed(() => sys.value?.goldCount ?? 0);
  const purpleCount = computed(() => sys.value?.purpleCount ?? 0);
  const blueCount = computed(() => sys.value?.blueCount ?? 0);

  const goldRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(goldCount.value * 100 / t).toFixed(1)}%)`;
  });
  const purpleRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(purpleCount.value * 100 / t).toFixed(1)}%)`;
  });
  const blueRate = computed(() => {
    const t = total.value;
    return t === 0 ? '  (—)' : `  (${(blueCount.value * 100 / t).toFixed(1)}%)`;
  });

  const totalPullsText = computed(() =>
    l10n.get('ui.stats.total_pulls', total.value)
  );

  const missedGoldStats = computed(() => {
    const s = sys.value;
    if (!s || !s.hasEventItems) return '';
    const gold = s.goldCount;
    if (gold === 0) return '';
    const missed = s.missedGoldCount;
    const rate = (missed * 100 / gold).toFixed(1);
    return l10n.get('ui.stats.missed', missed, gold, Number(rate));
  });

  const showMissedStats = computed(() => {
    const s = sys.value;
    return s !== null && s.hasEventItems && s.goldCount > 0;
  });

  // ── Average pull statistics ─────────────────────────────────────
  // Updated only when a gold (or rate-up gold) item is pulled,
  // not on every pull. Formula delegates to GachaSystem getters
  // which use lastGoldPullIndex / itemCount.

  const avgGoldPullText = ref('');
  const showAvgGold = ref(false);

  watch(
    () => sys.value?.goldCount ?? 0,
    (gc) => {
      const s = sys.value;
      if (!s || gc === 0) {
        avgGoldPullText.value = '';
        showAvgGold.value = false;
        return;
      }
      const avg = s.averageGoldPullNumber;
      avgGoldPullText.value = l10n.get('ui.stats.avg_gold', avg.toFixed(1));
      showAvgGold.value = true;
    },
  );

  const avgRateUpPullText = ref('');
  const showAvgRateUp = ref(false);

  // Watch goldCount so the rate-up average also updates when an
  // off-rate gold is pulled (lastGoldPullIndex moves forward while
  // rateUpGoldCount stays the same, so the quotient still changes).
  watch(
    () => sys.value?.goldCount ?? 0,
    (_gc) => {
      const s = sys.value;
      if (!s || !s.hasEventItems || s.rateUpGoldCount === 0) {
        avgRateUpPullText.value = '';
        showAvgRateUp.value = false;
        return;
      }
      const avg = s.averageRateUpPullNumber;
      avgRateUpPullText.value = l10n.get('ui.stats.avg_rateup', avg.toFixed(1));
      showAvgRateUp.value = true;
    },
  );

  // ── Gold item per-pull statistics ─────────────────────────────
  const goldItemRecords = computed(() =>
    sys.value?.goldItemRecordList ?? []
  );

  const hasGoldItemRecords = computed(() =>
    goldItemRecords.value.length > 0
  );

  return {
    goldPity, goldGuarantee, goldGuaranteeColor,
    purplePity, purpleGuarantee, purpleGuaranteeColor,
    totalPullsText, goldCount, goldRate,
    purpleCount, purpleRate, blueCount, blueRate,
    missedGoldStats, showMissedStats,
    total,
    showAvgGold, avgGoldPullText,
    showAvgRateUp, avgRateUpPullText,
    goldItemRecords, hasGoldItemRecords,
  };
});
