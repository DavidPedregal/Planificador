import "@testing-library/jest-dom";
import i18n from "./src/i18n/i18n";

// Pin to Spanish so tests that assert translated text work consistently.
i18n.changeLanguage("es");

// Suppress the full DOM dump that testing-library prints on failed queries.
process.env.DEBUG_PRINT_LIMIT = "0";