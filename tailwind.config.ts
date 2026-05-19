import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151615",
        mist: "#f5f4ef",
        sea: "#24746a",
        coral: "#e06f55",
      },
    },
  },
  plugins: [],
};

export default config;
