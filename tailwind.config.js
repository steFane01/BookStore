/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FBF8F2',
          100: '#F5F0E6',
          200: '#EDE4D5',
          300: '#E2D6C1',
          400: '#D4C4A8',
        },
        ink: {
          DEFAULT: '#1C1A17',
          light: '#3A362F',
          muted: '#6B6458',
        },
        oxblood: {
          DEFAULT: '#642A2E',
          dark: '#4E2023',
          light: '#7C3A3F',
        },
        brass: {
          DEFAULT: '#A88755',
          light: '#C4A876',
          dark: '#8A6D42',
        },
        taupe: {
          DEFAULT: '#B8AA99',
          light: '#CEC4B6',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cover: '0 25px 50px -12px rgba(28,26,23,0.35)',
        soft: '0 10px 30px -12px rgba(28,26,23,0.18)',
        lift: '0 30px 60px -15px rgba(28,26,23,0.4)',
      },
      letterSpacing: {
        widest2: '0.2em',
      },
    },
  },
  plugins: [],
}
