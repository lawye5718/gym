/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#08090d',
          800: '#0f1117',
          700: '#171a22',
          600: '#21252f',
        },
        leo: '#38bdf8',
        linda: '#fb7185',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Helvetica Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
