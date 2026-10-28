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
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',

        // Status colors
        'status-pending-bg': 'var(--status-pending-bg)',
        'status-pending-text': 'var(--status-pending-text)',
        'status-ready-bg': 'var(--status-ready-bg)',
        'status-ready-text': 'var(--status-ready-text)',
        'status-incoming-bg': 'var(--status-incoming-bg)',
        'status-incoming-text': 'var(--status-incoming-text)',
        'status-missing-bg': 'var(--status-missing-bg)',
        'status-missing-text': 'var(--status-missing-text)',

        // Legacy compatibility aliases
        'ink-night': 'var(--bg)',
        'ink-night-2': 'var(--surface)',
        'ink-night-3': 'var(--surface-muted)',
        'ink-rule': 'var(--border)',
        'paper': 'var(--surface)',
        'paper-2': 'var(--surface-muted)',
        'paper-rule': 'var(--border)',
        'ink-dark': 'var(--text)',
        'ink-soft': 'var(--text-muted)',
        'stamp-ready': 'var(--status-ready-text)',
        'stamp-incoming': 'var(--status-incoming-text)',
        'stamp-missing': 'var(--status-missing-text)',
        'stamp-pending': 'var(--status-pending-text)',
        'cream': 'var(--text)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        md: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        lg: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
