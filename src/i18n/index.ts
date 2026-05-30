import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import af from './af.json';

const i18n = new I18n({ en, af });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Set from device locale initially
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
i18n.locale = ['af', 'en'].includes(deviceLocale) ? deviceLocale : 'en';

// Load persisted language preference
AsyncStorage.getItem('app_language').then(saved => {
  if (saved && ['af', 'en'].includes(saved)) {
    i18n.locale = saved;
  }
}).catch(() => {});

export default i18n;
export type SupportedLocale = 'en' | 'af';

export const setLocale = async (locale: SupportedLocale) => {
  i18n.locale = locale;
  await AsyncStorage.setItem('app_language', locale);
};

export const t = (key: string, options?: object) => i18n.t(key, options);
export const getCurrentLocale = () => i18n.locale as SupportedLocale;
