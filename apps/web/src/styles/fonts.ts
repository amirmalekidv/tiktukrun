/**
 * Self-hosted UI fonts (no Google Fonts CDN).
 * Vazirmatn for Persian/Arabic; Orbitron for Latin display accents.
 */
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/600.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/vazirmatn/800.css'
import '@fontsource/vazirmatn/900.css'
import '@fontsource/orbitron/500.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'

/** Primary UI / Persian body stack */
export const FONT_FA =
  '"Vazirmatn", Tahoma, "Segoe UI", system-ui, sans-serif'

/** Display stack: Orbitron for Latin brand text, Vazirmatn for Persian glyphs */
export const FONT_DISPLAY =
  '"Orbitron", "Vazirmatn", Tahoma, "Segoe UI", system-ui, sans-serif'
