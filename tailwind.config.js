/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          bg: '#141416',
          panel: '#19191d',
          sidebar: '#161619',
          card: '#1e1e23',
          hover: '#25252b',
          border: '#2a2a32',
          borderSubtle: '#222228',
          text: '#e4e4e7',
          muted: '#8e8e98',
          dim: '#5e5e68',
          accent: '#7c3aed',
          accentHover: '#6d28d9',
        },
        entity: {
          person: '#38bdf8',
          organization: '#818cf8',
          company: '#60a5fa',
          website: '#34d399',
          domain: '#2dd4bf',
          account: '#a78bfa',
          email: '#fbbf24',
          phone: '#f59e0b',
          ip: '#fb923c',
          location: '#f87171',
          document: '#94a3b8',
          event: '#eab308',
          custom: '#e879f9',
        },
        status: {
          candidate: '#94a3b8',
          unverified: '#eab308',
          supported: '#38bdf8',
          confirmed: '#34d399',
          rejected: '#f87171',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        popover: '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
