/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6b56ff",
        "primary-content": "#ffffff",
        "primary-dark": "#3e23ff",
        "primary-light": "#9889ff",

        secondary: "#bf56ff",
        "secondary-content": "#350056",
        "secondary-dark": "#ac23ff",
        "secondary-light": "#d289ff",

        background: "#1a1a1a",
        foreground: "#262626",
        border: "#404040",

        copy: "#fbfbfb",
        "copy-light": "#d9d9d9",
        "copy-lighter": "#a6a6a6",

        success: "#56ff56",
        warning: "#ffff56",
        error: "#ff5656",

        "success-content": "#005600",
        "warning-content": "#565600",
        "error-content": "#560000"
      },
    }
  },
  plugins: [],
}
