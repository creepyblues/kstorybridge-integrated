import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import titlesEN from './locales/en/titles.json';
import profileEN from './locales/en/profile.json';
import navigationEN from './locales/en/navigation.json';
import surveyEN from './locales/en/survey.json';
import validationEN from './locales/en/validation.json';
import pricingEN from './locales/en/pricing.json';
import billingEN from './locales/en/billing.json';
import paymentEN from './locales/en/payment.json';
import contentEN from './locales/en/content.json';

import commonKO from './locales/ko/common.json';
import authKO from './locales/ko/auth.json';
import titlesKO from './locales/ko/titles.json';
import profileKO from './locales/ko/profile.json';
import navigationKO from './locales/ko/navigation.json';
import surveyKO from './locales/ko/survey.json';
import validationKO from './locales/ko/validation.json';
import pricingKO from './locales/ko/pricing.json';
import billingKO from './locales/ko/billing.json';
import paymentKO from './locales/ko/payment.json';
import contentKO from './locales/ko/content.json';

// Define resources
const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    titles: titlesEN,
    profile: profileEN,
    navigation: navigationEN,
    survey: surveyEN,
    validation: validationEN,
    pricing: pricingEN,
    billing: billingEN,
    payment: paymentEN,
    content: contentEN,
  },
  ko: {
    common: commonKO,
    auth: authKO,
    titles: titlesKO,
    profile: profileKO,
    navigation: navigationKO,
    survey: surveyKO,
    validation: validationKO,
    pricing: pricingKO,
    billing: billingKO,
    payment: paymentKO,
    content: contentKO,
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
    fallbackLng: 'ko', // Fallback language (default: Korean)
    defaultNS: 'common', // Default namespace
    ns: ['common', 'auth', 'titles', 'profile', 'navigation', 'survey', 'validation', 'pricing', 'billing', 'payment', 'content'],

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
    },
  });

export default i18n;
