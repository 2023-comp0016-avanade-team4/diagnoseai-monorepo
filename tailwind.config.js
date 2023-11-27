/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          "100": "#fbfbfb",
          "200": "rgba(255, 255, 255, 0.1)",
        },
        white: "#fff",
        darkslategray: {
          "100": "#416072",
          "200": "#333",
          "300": "#2c3032",
        },
        dimgray: "#666",
        whitesmoke: {
          "100": "#ededed",
          "200": "#ebebeb",
          "300": "#ece8e8",
        },
        black: "#000",
        steelblue: "rgba(23, 151, 192, 0.3)",
        "colors-grey": "#eee",
      },
      spacing: {},
      fontFamily: {
        montserrat: "Montserrat",
        "crete-round": "'Crete Round'",
        roboto: "Roboto",
        inter: "Inter",
      },
      borderRadius: {
        "8xs": "5px",
      },
    },
    fontSize: {
      base: "16px",
      "5xl": "24px",
      "3xl": "22px",
      "11xl": "30px",
      xl: "20px",
      "7xl": "26px",
      inherit: "inherit",
    },
  },
  corePlugins: {
    preflight: false,
  },
};
