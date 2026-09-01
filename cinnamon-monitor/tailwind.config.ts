import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eef6ee',
          100: '#d3e8d4',
          200: '#a7d1a9',
          300: '#6fb073',
          400: '#3f8c47',
          500: '#2e7d32',
          600: '#1b5e20',
          700: '#154a19',
          800: '#0f3712',
          900: '#0a250c',
        },
        cinnamon: {
          50: '#fdf6e9',
          100: '#f9e6c2',
          200: '#f0c97c',
          300: '#e3ab3f',
          400: '#c98a1e',
          500: '#a86d14',
          600: '#84540f',
          700: '#5f3c0b',
        },
        ink: '#12211a',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
