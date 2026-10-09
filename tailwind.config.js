/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1D9BF0',
          hover: '#1A8CD8',
          light: '#E8F5FD',
          border: '#CFD9DE',
        },
      },
    },
  },
  plugins: [],
};
