import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B0B0F",
          surface: "#1A1A1F",
          border: "#27272F",
          hover: "#2E2E38",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B4B4B8",
          muted: "#6E6E73",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
