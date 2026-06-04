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
        // Creative Tech Palette
        primary: {
          DEFAULT: '#3B82F6', // Royal Blue - primary interactive color
          dark: '#2563EB',     // Darker blue for hover states
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber Orange - minimal use for highlights
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald Green - for positive/success elements
        },
        neutral: {
          50: '#F8FAFC',     // Off-white background
          100: '#F1F5F9',
          200: '#E2E8F0',    // Light blue-gray borders
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',    // Slate Gray - main text color
          800: '#1E293B',
          900: '#0F172A',
        },
        success: {
          DEFAULT: '#10B981', // Emerald Green
        },
        error: {
          DEFAULT: '#EF4444', // Softer red
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config