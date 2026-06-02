import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { setLocale, getCurrentLocale, SupportedLocale } from '@/i18n';

interface LanguageState {
  locale: SupportedLocale;
  setLanguage: (locale: SupportedLocale) => Promise<void>;
  init: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: getCurrentLocale(),

  init: async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved && ['af', 'en'].includes(saved)) {
        i18n.locale = saved as SupportedLocale;
        set({ locale: saved as SupportedLocale });
      }
    } catch {}
  },

  setLanguage: async (locale: SupportedLocale) => {
    await setLocale(locale);
    set({ locale });
  },
}));
