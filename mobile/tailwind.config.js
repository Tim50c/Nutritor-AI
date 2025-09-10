/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable `dark:` variant (class-based)
  // NOTE: Update this to include the paths to all files that contain NativeWind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ---- your existing palette (kept as-is) ----
        primary: {
          40: '#FFBDA2',
          50: '#FF9C73',
          100: '#F47551',
          200: '#FF5A16',
          300: '#E04E00',
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
        bmi: {
          under: "#009FFA",
          healthy: "#23D154",
          over: "#DCF805",
          obese: "#FF0000"
        },

        // ---- semantic tokens for theming (use these in components) ----
        // Backgrounds / surfaces
        'bg-default': '#FFFFFF',        // light surface
        'bg-default-dark': '#0B0B0C',   // dark surface

        'bg-surface': '#F8F8F9',        // card / pane in light
        'bg-surface-dark': '#0F1112',   // card / pane in dark

        // Text
        'text-default': '#111214',      // primary text in light
        'text-default-dark': '#F5F6F7', // primary text in dark

        'text-secondary': '#6B6F76',
        'text-secondary-dark': '#A7A9AC',

        // Borders / dividers
        'border-default': '#E6E7EA',
        'border-default-dark': '#222527',

        // Interactive / accents (map to your palette)
        'accent': '#F47551',            // primary 100
        'accent-dark': '#FF5A16',       // primary 200

        // Success / warning / danger (optional)
        'success': '#23D154',
        'warning': '#F8D558',
        'danger': '#FF4D67',
      }
    },
  },
  plugins: [],
}
