import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: 'var(--accent)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        border: 'var(--border)',
        'neon-green': '#00ff80',
        'electric-blue': '#4040ff',
        'hot-pink': '#ff0040',
        'bright-yellow': '#ffff00',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
        '6': '6px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'brutalist': '6px 6px 0px black',
        'brutalist-lg': '8px 8px 0px black',
        'brutalist-sm': '4px 4px 0px black',
      },
      animation: {
        'pulse-record': 'pulse-record 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config