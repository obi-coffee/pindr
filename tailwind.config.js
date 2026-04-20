// Tailwind mirrors the authoritative tokens in components/ui/theme.ts.
// Keep the hex values and radii in lockstep — theme.ts wins any conflict.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#EDE9E1',
        'paper-raised': '#F6F3EC',
        'paper-high': '#FBF9F3',

        ink: '#0E0E0C',
        'ink-soft': '#5D5852',
        'ink-subtle': '#9A9189',

        moss: '#1F2A21',
        'moss-soft': '#3D4E3F',

        taupe: '#8B6B5F',
        clay: '#7A4C3D',

        mustard: '#D6A640',
        burgundy: '#6B1B24',
        stone: '#B8B2A5',

        success: '#2F5A3A',
        warning: '#C4903B',
        danger: '#6B1B24',

        stroke: '#D8D3C7',
        'stroke-strong': '#B9B2A4',
      },
      borderRadius: {
        sm: '4px',
        md: '10px',
        lg: '14px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        extrabold: ['Inter_800ExtraBold'],
        black: ['Inter_900Black'],
      },
    },
  },
  plugins: [],
};
