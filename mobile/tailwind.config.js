/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        primary: {
          50: '#FF9C73',
          100: '#F47551',
          200: '#FF5A16'
        },
        protein: {
          100: '#67BD6E',
          200: '#45C57B',
          300: '#45C588',
        },
        fats: {
          100: '#F47551',
          200: '#FF6F43',
        },
        carbs: {
          100: '#F5F378',
          300: '#F8D558',
        },
        calories: {
          100: '#DDC0FF',
          500: '#A45CF8',
        },
        favorite: {
          100: '#FF4D67',
        },
      }
    },
  },
  plugins: [],
}
