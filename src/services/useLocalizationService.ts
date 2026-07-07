import { ref } from 'vue';

/**
 * Localization service. Loads /LanguageConfigs/TextMap.json at startup.
 *
 * API surface (match ILocalizationService exactly):
 *   currentLanguage: Ref<string>         — ISO 639-1 code ("en", "zh")
 *   availableLanguages: Ref<string[]>    — read from meta.languages
 *   get(key: string): string
 *   get(key: string, ...args: (string | number)[]): string
 *   getItemName(englishName: string): string
 *
 * Fallback chain (match C# exactly):
 *   1. current language → 2. default language → 3. raw key
 *
 * Language preference is persisted to localStorage under key
 * "hsr-gacha-simulator:language".
 */

const STORAGE_KEY = 'hsr-gacha-simulator:language';

// Module-level state (singleton pattern)
const entries = new Map<string, Record<string, string>>();
const defaultLanguage = ref('en');
const availableLanguages = ref<string[]>(['en']);
const currentLanguage = ref('en');
const loaded = ref(false);
let loadingPromise: Promise<void> | null = null;

function loadSavedLanguage(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ?? null;
  } catch {
    return null;
  }
}

function saveLanguage(language: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Best-effort persistence
  }
}

async function loadAsync(): Promise<void> {
  if (loaded.value) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const saved = loadSavedLanguage();
      if (saved) {
        currentLanguage.value = saved;
      }

      const resp = await fetch('/LanguageConfigs/TextMap.json');
      const data = await resp.json();

      // Parse meta
      if (data.meta) {
        if (data.meta.defaultLanguage) {
          defaultLanguage.value = data.meta.defaultLanguage;
        }
        if (data.meta.languages && Array.isArray(data.meta.languages)) {
          availableLanguages.value = data.meta.languages;
        }
      }

      // Parse entries
      if (data.entries) {
        for (const [key, translations] of Object.entries(data.entries)) {
          entries.set(key, translations as Record<string, string>);
        }
      }

      // Ensure current language is in available list
      if (!availableLanguages.value.includes(currentLanguage.value)) {
        currentLanguage.value = defaultLanguage.value;
      }

      loaded.value = true;
    } catch (err) {
      console.error('[LocalizationService] Failed to load TextMap.json:', err);
      loaded.value = true; // Mark as loaded even on failure — fallback returns keys
    }
  })();

  return loadingPromise;
}

/**
 * Returns the translated string for `key`.
 * Fallback chain: current language → default language → raw key.
 */
function get(key: string, ...args: (string | number)[]): string {
  if (!key) return key;

  // Touch loaded.value to establish reactive dependency on load state.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  loaded.value;

  let result = key;

  if (entries.has(key)) {
    const translations = entries.get(key)!;

    // Try current language first
    if (translations[currentLanguage.value] !== undefined) {
      result = translations[currentLanguage.value];
    }
    // Fall back to default language
    else if (
      currentLanguage.value !== defaultLanguage.value &&
      translations[defaultLanguage.value] !== undefined
    ) {
      result = translations[defaultLanguage.value];
    }
  }

  // Format string with args. Supports both simple {0} placeholders and
  // .NET-style format specifiers like {2:F1} (the specifier is ignored).
  if (args.length > 0) {
    try {
      return result.replace(/\{(\d+)[^}]*\}/g, (_, index) => {
        const i = parseInt(index, 10);
        return i < args.length ? String(args[i]) : `{${index}}`;
      });
    } catch {
      return result;
    }
  }

  return result;
}

/**
 * Returns the display name for an item, trying `avatar.<englishName>`
 * then `lightcone.<englishName>`. Falls back to englishName itself.
 */
function getItemName(englishName: string): string {
  if (!englishName) return englishName;

  // Try avatar first, then lightcone
  const avatarKey = `avatar.${englishName}`;
  const avatarValue = get(avatarKey);
  if (avatarValue !== avatarKey) return avatarValue;

  const lcKey = `lightcone.${englishName}`;
  const lcValue = get(lcKey);
  if (lcValue !== lcKey) return lcValue;

  return englishName;
}

// Initialize from saved preference
const savedLang = loadSavedLanguage();
if (savedLang) {
  currentLanguage.value = savedLang;
}

export function useLocalizationService() {
  return {
    currentLanguage,
    availableLanguages,
    defaultLanguage,
    loadAsync,
    get,
    getItemName,
    /**
     * Set the current language and persist to localStorage.
     */
    setLanguage(lang: string): void {
      if (!lang || currentLanguage.value === lang) return;
      currentLanguage.value = lang;
      saveLanguage(lang);
    },
  };
}
