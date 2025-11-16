// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html', // Tell Tailwind to scan all HTML files in the root folder
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'secondary': '#6366f1',
      }
    },
  },
  plugins: [],
}