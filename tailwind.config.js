/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ink-night': 'var(--ink-night)',
        'ink-night-2': 'var(--ink-night-2)',
        'ink-rule': 'var(--ink-rule)',
        'paper': 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-rule': 'var(--paper-rule)',
        'ink-dark': 'var(--ink-dark)',
        'ink-soft': 'var(--ink-soft)',
        'stamp-ready': 'var(--stamp-ready)',
        'stamp-incoming': 'var(--stamp-incoming)',
        'stamp-missing': 'var(--stamp-missing)',
        'stamp-pending': 'var(--stamp-pending)',
        'cream': 'var(--cream)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
