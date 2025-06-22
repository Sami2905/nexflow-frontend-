/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      colors: {
        // As per the design prompt
        'primary': 'hsl(var(--primary))',
        'accent': 'hsl(var(--accent))',
        'warning': 'hsl(var(--warning))',
        'danger': 'hsl(var(--danger))',
        
        'background-light': 'hsl(var(--background-light))',
        'surface-light': 'hsl(var(--surface-light))',
        'text-primary-light': 'hsl(var(--text-primary-light))',
        'text-secondary-light': 'hsl(var(--text-secondary-light))',
        'border-light': 'hsl(var(--border-light))',

        'background-dark': 'hsl(var(--background-dark))',
        'surface-dark': 'hsl(var(--surface-dark))',
        'text-primary-dark': 'hsl(var(--text-primary-dark))',
        'text-secondary-dark': 'hsl(var(--text-secondary-dark))',
        'border-dark': 'hsl(var(--border-dark))',
      },
    },
  },
  plugins: [],
};