import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationPT from './locales/pt.json';
import translationEN from './locales/en.json';

const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector) // deteta linguagem do browser
  .use(initReactI18next) // liga ao react-i18next
  .init({
    resources,
    fallbackLng: 'pt', // Usa PT se a língua do browser não for suportada
    interpolation: {
      escapeValue: false // o react já faz o escape por segurança
    }
  });

export default i18n;
