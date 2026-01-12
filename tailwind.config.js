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
        primary: '#B65A2A',
        bg: '#1a1a1a',
        card: '#2a2a2a',
        text: '#ffffff',
        'text-muted': '#b0b0b0',
        'warn-bg': '#5c1d1d',
        'warn-text': '#ffffff',
      },
    },
  },
  plugins: [],
}







