/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ink-night': '#14151a',
        'ink-night-2': '#1b1c22',
        'ink-rule': '#33343d',
        'paper': '#ece3cd',
        'paper-2': '#e2d7ba',
        'paper-rule': '#c8bb95',
        'ink-dark': '#2a2317',
        'ink-soft': '#6b6250',
        'stamp-ready': '#2f6b4f',
        'stamp-incoming': '#3a5f8a',
        'stamp-missing': '#a4392f',
        'stamp-pending': '#c98a2b',
        'cream': '#f3ede0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
