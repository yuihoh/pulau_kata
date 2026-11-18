import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';

export const SUPPORTED_LANGS = ['en', 'zh'] as const;
export type UiLang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'jk.lang';

function initialLang(): UiLang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'en'; // default UI language: English (Yang's decision, 17 Nov 2026)
}

export function setLang(lang: UiLang): void {
  void i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

// Keep <html lang> in sync for screen readers and correct CJK font selection.
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined')
    document.documentElement.lang = lng === 'zh' ? 'zh-Hans' : 'en';
});

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: initialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
