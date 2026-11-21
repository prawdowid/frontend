import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config & { daisyui: Record<string, unknown> } = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#264653",
        ink: "#10242C",
        crimson: "#DC143C",
        "crimson-dark": "#B01030",
        mist: "#F2F4F5",
        line: "#D9E1E3",
        muted: "#5B6C72",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        prawdowid: {
          primary: "#264653",
          "primary-content": "#FFFFFF",
          secondary: "#F2F4F5",
          "secondary-content": "#264653",
          accent: "#DC143C",
          "accent-content": "#FFFFFF",
          neutral: "#10242C",
          "neutral-content": "#FFFFFF",
          "base-100": "#FFFFFF",
          "base-200": "#F2F4F5",
          "base-300": "#D9E1E3",
          "base-content": "#10242C",
          info: "#264653",
          "info-content": "#FFFFFF",
          success: "#2F7D68",
          "success-content": "#FFFFFF",
          warning: "#B7791F",
          "warning-content": "#FFFFFF",
          error: "#DC143C",
          "error-content": "#FFFFFF",
          "--rounded-box": "0rem",
          "--rounded-btn": "0rem",
          "--rounded-badge": "0rem",
          "--border-btn": "0px",
          "--tab-border": "0px",
          "--tab-radius": "0rem",
          "--animation-btn": "0.15s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "1",
          "--btn-text-case": "uppercase",
        },
      },
    ],
  },
};

export default config;
