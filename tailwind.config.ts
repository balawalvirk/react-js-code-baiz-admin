import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff3ee',
          100: '#ffe4d6',
          500: '#FC5B15',
          600: '#e54e0e',
          700: '#c4420c',
        },
      },
    },
  },
  plugins: [],
};
export default config;
