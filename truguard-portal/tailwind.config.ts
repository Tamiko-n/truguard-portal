import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0A0A0F',
        surface: '#111118',
        raised:  '#1A1A24',
        border:  '#2A2A3C',
        muted:   '#6B7280',
        dim:     '#9094A8',
        primary: '#E8E8F0',
        yellow:  '#F5C518',
        green:   '#16A34A',
        red:     '#DC2626',
        orange:  '#EA580C',
        blue:    '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
