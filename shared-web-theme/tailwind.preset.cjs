/** Tailwind preset — colors align with iOS `PetPalsPalette.classic` */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--pp-primary)',
          50: 'var(--pp-bg)',
          100: 'var(--pp-bg)',
          200: 'var(--pp-card-bg)',
          300: 'var(--pp-card-border)',
          400: 'var(--pp-primary)',
          500: 'var(--pp-primary)',
          600: 'var(--pp-primary)',
          700: 'var(--pp-primary-deep)',
          800: 'var(--pp-primary-deep)',
          900: 'var(--pp-primary-deep)',
        },
        honeydew: '#FAF8F2',
        blush: '#f2a4a5',
        almond: '#e5d4c5',
        cerulean: {
          DEFAULT: '#EC5E27',
          light: '#F47A4A',
        },
        navy: {
          DEFAULT: '#090087',
          dark: '#010a2e',
        },
        pp: {
          honeydew: '#FAF8F2',
          blush: '#f2a4a5',
          almond: '#e5d4c5',
          cerulean: '#EC5E27',
          navy: '#090087',
          'navy-dark': '#010a2e',
          orange: '#EC5E27',
        },
      },
      fontFamily: {
        sans: [
          'Nunito',
          'ui-rounded',
          'SF Pro Rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'Nunito',
          'ui-rounded',
          'SF Pro Rounded',
          '-apple-system',
          'sans-serif',
        ],
      },
      borderRadius: {
        pp: '32px',
        'pp-sm': '18px',
        'pp-md': '24px',
        'pp-lg': '32px',
        'pp-xl': '40px',
        'pp-2xl': '48px',
        pill: '9999px',
      },
      boxShadow: {
        pp: '0 6px 16px rgba(236, 94, 39, 0.12)',
        'pp-float': '0 12px 24px rgba(236, 94, 39, 0.16)',
        glow: '0 0 40px -8px rgba(236, 94, 39, 0.45)',
      },
      backgroundImage: {
        'pp-brand': 'linear-gradient(135deg, #EC5E27 0%, #F47A4A 55%, #C44A1A 100%)',
      },
    },
  },
};
