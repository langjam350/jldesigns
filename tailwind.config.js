/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Updated from 'purge' to 'content'
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // If using app directory
  ],
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
  plugins: [],
}