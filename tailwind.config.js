/** @type {import('tailwindcss').Config} */
// Cache buster v2.1
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        primary: 'rgb(var(--primary))',
        'primary-foreground': 'rgb(var(--primary-foreground))',
        accent: 'rgb(var(--accent))',
      },
    },
  },
  plugins: [],
};
