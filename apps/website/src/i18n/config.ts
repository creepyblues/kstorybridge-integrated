import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import homeEN from './locales/en/home.json';
import homePreview4EN from './locales/en/homePreview4.json';
import creatorsEN from './locales/en/creators.json';
import producersEN from './locales/en/producers.json';
import aboutEN from './locales/en/about.json';
import newsEN from './locales/en/news.json';
import titlesEN from './locales/en/titles.json';
import onboardingEN from './locales/en/onboarding.json';
import authEN from './locales/en/auth.json';

import commonKO from './locales/ko/common.json';
import homeKO from './locales/ko/home.json';
import homePreview4KO from './locales/ko/homePreview4.json';
import creatorsKO from './locales/ko/creators.json';
import producersKO from './locales/ko/producers.json';
import aboutKO from './locales/ko/about.json';
import newsKO from './locales/ko/news.json';
import titlesKO from './locales/ko/titles.json';
import onboardingKO from './locales/ko/onboarding.json';
import authKO from './locales/ko/auth.json';

// Define resources
const resources = {
  en: {
    common: commonEN,
    home: homeEN,
    homePreview4: homePreview4EN,
    creators: creatorsEN,
    producers: producersEN,
    about: aboutEN,
    news: newsEN,
    titles: titlesEN,
    onboarding: onboardingEN,
    auth: authEN,
  },
  ko: {
    common: commonKO,
    home: homeKO,
    homePreview4: homePreview4KO,
    creators: creatorsKO,
    producers: producersKO,
    about: aboutKO,
    news: newsKO,
    titles: titlesKO,
    onboarding: onboardingKO,
    auth: authKO,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language
    defaultNS: 'common', // Default namespace
    ns: ['common', 'home', 'homePreview4', 'creators', 'producers', 'about', 'news', 'titles', 'onboarding', 'auth'],

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Cache language choice in localStorage
      lookupLocalStorage: 'i18nextLng',
    },

    // Development settings
    debug: import.meta.env.DEV, // Enable debug in dev mode

    // React-specific settings
    react: {
      useSuspense: false, // Disable suspense for simpler setup
      bindI18n: 'languageChanged', // Re-render on language change
      bindI18nStore: 'added removed', // Re-render when translations added/removed
    },
  });

export default i18n;
