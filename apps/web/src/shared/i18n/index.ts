import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

export type AppLanguage = "es" | "en";

export const SUPPORTED_LANGUAGES: AppLanguage[] = ["es", "en"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "es",
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "musicflow-lang",
      caches: ["localStorage"],
    },
  });

export function changeLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
  localStorage.setItem("musicflow-lang", lang);
}

export function getCurrentLanguage(): AppLanguage {
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? "es").slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(lang as AppLanguage)
    ? (lang as AppLanguage)
    : "es";
}

export default i18n;
