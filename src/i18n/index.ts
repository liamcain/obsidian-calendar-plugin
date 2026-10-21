import { writable, get } from "svelte/store";
import type { Moment } from "moment";

// Language detection
function detectLanguage(): string {
  // Try to get Obsidian's language setting
  const obsidianLang = (window as Record<string, unknown>).app?.vault?.config?.locale;
  if (obsidianLang && typeof obsidianLang === 'string') {
    return obsidianLang.toLowerCase().split('-')[0];
  }
  
  // Fallback to system language
  const sysLang = navigator.language?.toLowerCase();
  return sysLang?.split('-')[0] || 'en';
}

// Language store
export const currentLang = writable<string>(detectLanguage());

// Translation function type
type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

// Create translation function
export function createTranslationFunction(translations: Record<string, Record<string, string>>): TranslationFunction {
  return (key: string, params?: Record<string, string | number>): string => {
    const lang = get(currentLang);
    const langTranslations = translations[lang] || translations['en'];
    let translation = langTranslations?.[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }
    
    return translation;
  };
}

// Export translation function (will be initialized later)
export let t: TranslationFunction = (key: string) => key;

// Initialize translations
export function initTranslations(translations: Record<string, Record<string, string>>): void {
  t = createTranslationFunction(translations);
}

// Helper to format dates with locale support
export function formatDate(date: Moment, format: string): string {
  return date.format(format);
}

// Helper to get localized weekday names
export function getWeekdays(): string[] {
  return window.moment.weekdays();
}

// Helper to get localized month names
export function getMonths(): string[] {
  return window.moment.months();
}
