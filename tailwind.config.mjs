import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: 'color-mix(in srgb, var(--primary) 50%, white)',
          100: 'color-mix(in srgb, var(--primary) 10%, white)',
          200: 'color-mix(in srgb, var(--primary) 20%, white)',
          300: 'color-mix(in srgb, var(--primary) 30%, white)',
          400: 'color-mix(in srgb, var(--primary) 40%, white)',
          500: 'var(--primary)',
          600: 'color-mix(in srgb, var(--primary) 10%, black)',
          700: 'color-mix(in srgb, var(--primary) 20%, black)',
          800: 'color-mix(in srgb, var(--primary) 30%, black)',
          900: 'color-mix(in srgb, var(--primary) 40%, black)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          50: 'var(--secondary-50, color-mix(in srgb, var(--secondary) 5%, white))',
          100: 'var(--secondary-100, color-mix(in srgb, var(--secondary) 10%, white))',
          500: 'var(--secondary-500, var(--secondary))',
          600: 'var(--secondary-600, color-mix(in srgb, var(--secondary) 10%, black))',
          700: 'var(--secondary-700, color-mix(in srgb, var(--secondary) 20%, black))',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [animate],
};

export default config;
