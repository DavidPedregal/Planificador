import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

const SUPPORTED = ["en", "es", "fr", "de"];
const browserLang = typeof navigator !== "undefined"
    ? navigator.language.split("-")[0]
    : "en";
const detectedLng = SUPPORTED.includes(browserLang) ? browserLang : "en";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            es: { translation: es },
            fr: { translation: fr },
            de: { translation: de },
        },
        lng: detectedLng,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
