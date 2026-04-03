/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg, #0D0D11)',
        card: '#18181D',
        elev: '#23262F',
        border: '#353945',
        'border-s': '#2C2F3A',
        blue: {
          DEFAULT: '#3772FF',
          h: '#2B5FD9',
          t: '#6E9BFF',
        },
        pink: {
          DEFAULT: '#E8247C',
          h: '#C91E6A',
          t: '#F06EAB',
        },
        green: {
          DEFAULT: '#45B26B',
          t: '#7DD69B',
        },
        amber: {
          DEFAULT: '#F5A623',
          t: '#FCC76E',
        },
        red: {
          DEFAULT: '#EF466F',
          t: '#F5899E',
        },
        purple: {
          DEFAULT: '#9757D7',
          t: '#BA8DE9',
        },
        t1: '#FCFCFD',
        t2: '#B1B5C4',
        t3: '#777E91',
        t4: '#52566A',
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        pill: '100px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,.25)',
        elevated: '0 8px 40px rgba(0,0,0,.35)',
        'glow-blue': '0 0 24px rgba(55,114,255,.25)',
        'glow-pink': '0 0 24px rgba(232,36,124,.25)',
      },
    },
  },
  plugins: [],
}
