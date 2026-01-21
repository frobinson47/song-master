/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent color (orange/gold)
        primary: {
          DEFAULT: '#F5A623',
          50: '#FEF6E7',
          100: '#FDEACC',
          200: '#FBD599',
          300: '#F9C066',
          400: '#F7AB33',
          500: '#F5A623',
          600: '#D48A0A',
          700: '#A16908',
          800: '#6E4805',
          900: '#3B2703',
        },
        // Secondary accent (cyan) for settings/secondary actions
        secondary: {
          DEFAULT: '#06b6d4',
          500: '#06b6d4',
        },
        // Dark theme backgrounds
        dark: {
          950: '#020617', // Primary background (slate-950)
          900: '#0f172a', // Slightly lighter
          800: '#1e293b', // Secondary background (slate-800)
          700: '#334155', // Tertiary/borders (slate-700)
          600: '#475569', // Lighter borders
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'lg': '0.5rem',
        'md': '0.375rem',
      },
    },
  },
  plugins: [],
}
