/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5e7',
          100: '#fde8c8',
          200: '#fbd08d',
          300: '#f8b052',
          400: '#f59e28',
          500: '#e67e22',
          600: '#d4631a',
          700: '#b04d18',
          800: '#8e3e1a',
          900: '#743518',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d0c7',
          300: '#a3b1a3',
          400: '#7d8f7d',
          500: '#627462',
          600: '#4d5c4d',
          700: '#404b40',
          800: '#363f36',
          900: '#2f362f',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e6',
          300: '#f6e8d3',
          400: '#f0d9b8',
          500: '#e8c99d',
          600: '#d9b17a',
          700: '#c4965a',
          800: '#a67d4c',
          900: '#886841',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

