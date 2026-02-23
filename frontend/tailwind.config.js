/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cadre-red': '#db4545',
        'cadre-dark': '#111111',
        'cadre-border': '#2a2a2a',
        'cadre-muted': '#e5e5e5',
      },
    },
  },
  plugins: [],
}
