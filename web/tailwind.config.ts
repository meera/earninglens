import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables that we define in globals.css
        background: 'var(--background)',
        'background-elevated': 'var(--background-elevated)',
        'background-hover': 'var(--background-hover)',
        'background-muted': 'var(--background-muted)',

        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',

        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-light': 'var(--accent-light)',

        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',

        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'border-accent': 'var(--border-accent)',

        'chart-primary': 'var(--chart-primary)',
        'chart-secondary': 'var(--chart-secondary)',
        'chart-accent': 'var(--chart-accent)',
        'chart-violet': 'var(--chart-violet)',
        'chart-pink': 'var(--chart-pink)',
        'chart-blue': 'var(--chart-blue)',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
