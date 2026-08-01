/**
 * Theme Accent Manager
 *
 * App primary accent colors preset palette and CSS variable updater.
 */

export const THEME_PRESETS = [
  { id: 'green',  name: 'Emerald Green', hex: '#00c896', rgb: '0,200,150' },
  { id: 'blue',   name: 'Electric Blue', hex: '#4a90e2', rgb: '74,144,226' },
  { id: 'gold',   name: 'Champions Gold',hex: '#f5a623', rgb: '245,166,35' },
  { id: 'violet', name: 'Neon Violet',   hex: '#9f7aea', rgb: '159,122,234' },
  { id: 'red',    name: 'Crimson Red',    hex: '#f56565', rgb: '245,101,101' },
];

export function applyThemeAccent(hexColor) {
  const preset = THEME_PRESETS.find(p => p.hex.toLowerCase() === (hexColor || '').toLowerCase()) || THEME_PRESETS[0];
  const root = document.documentElement;

  root.style.setProperty('--green', preset.hex);
  root.style.setProperty('--green-bg', `rgba(${preset.rgb},.12)`);
}
