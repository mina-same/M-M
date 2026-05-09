import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        w6: {
          paper: 'hsl(36 33% 97%)',
          blue: 'hsl(211 55% 23%)',
          blueSoft: 'hsl(210 38% 91%)',
          olive: 'hsl(82 28% 40%)',
          sand: 'hsl(38 44% 88%)',
          white: 'hsl(0 0% 100%)',
        },
      },
      fontFamily: {
        'med-body': ["'Montserrat'", "'Noto Sans Arabic'", 'system-ui', 'sans-serif'],
        'med-display': ["'Cormorant Garamond'", "'Amiri'", "'Noto Sans Arabic'", 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
