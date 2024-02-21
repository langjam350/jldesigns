/** @type {import('tailwindcss').Config} */

module.exports = {
  purge: [
    // Adjust the paths to match your project structure
    './src/**/*.tsx',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#0B132B",
        secondary: "#1C2541",
        background: "#FFFFFF",
        accent: "#5BC0BE",
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}