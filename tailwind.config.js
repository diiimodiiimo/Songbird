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
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'warn-bg': 'var(--warn-bg)',
        'warn-text': 'var(--warn-text)',
      },
    },
  },
  plugins: [],
}
